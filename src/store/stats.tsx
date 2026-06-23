import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Lifetime cleanup stats: how many photos the user has actually deleted and roughly how
 * much storage that freed. Persisted so the numbers survive restarts. "freedBytes" is an
 * estimate (see estimateAssetBytes) — the UI shows it with a "~".
 */
export type CleanupStats = { clearedPhotos: number; freedBytes: number };

const EMPTY: CleanupStats = { clearedPhotos: 0, freedBytes: 0 };
const STORAGE_KEY = 'photoslide.stats.v1';

type StatsContextValue = CleanupStats & {
  hydrated: boolean;
  record: (photos: number, bytes: number) => void;
  reset: () => void;
};

const StatsContext = createContext<StatsContextValue | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<CleanupStats>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setStats({ ...EMPTY, ...JSON.parse(raw) });
      } catch {
        // ignore corrupt cache
      } finally {
        didHydrate.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!didHydrate.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats)).catch(() => {});
  }, [stats]);

  const record = useCallback((photos: number, bytes: number) => {
    setStats((prev) => ({
      clearedPhotos: prev.clearedPhotos + Math.max(0, photos),
      freedBytes: prev.freedBytes + Math.max(0, bytes),
    }));
  }, []);

  const reset = useCallback(() => setStats(EMPTY), []);

  const value = useMemo<StatsContextValue>(
    () => ({ ...stats, hydrated, record, reset }),
    [stats, hydrated, record, reset],
  );

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within a StatsProvider');
  return ctx;
}
