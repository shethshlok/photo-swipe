import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Asset } from 'expo-media-library/legacy';
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
 * The "trash" is purely an in-app staging list. Swiping left only *adds* an asset
 * here — nothing in the photo library is touched until the user explicitly deletes
 * from the Trash screen. The list is persisted so staged photos survive an app restart.
 */
export type StagedAsset = {
  id: string;
  uri: string;
  filename?: string;
  mediaType?: string;
  width?: number;
  height?: number;
  creationTime?: number;
  duration?: number;
  albumTitle?: string;
};

const STORAGE_KEY = 'photoslide.staged.v1';

export function toStaged(asset: Asset, albumTitle?: string): StagedAsset {
  return {
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename,
    mediaType: asset.mediaType,
    width: asset.width,
    height: asset.height,
    creationTime: asset.creationTime,
    duration: asset.duration,
    albumTitle,
  };
}

type TrashContextValue = {
  items: StagedAsset[];
  ids: Set<string>;
  count: number;
  hydrated: boolean;
  has: (id: string) => boolean;
  add: (asset: StagedAsset) => void;
  remove: (id: string) => void;
  removeMany: (ids: string[]) => void;
  clear: () => void;
};

const TrashContext = createContext<TrashContextValue | null>(null);

export function TrashProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StagedAsset[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const didHydrate = useRef(false);

  // Load persisted staging list once on startup.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {
        // ignore corrupt cache
      } finally {
        didHydrate.current = true;
        setHydrated(true);
      }
    })();
  }, []);

  // Persist after every change (but not before the first load completes).
  useEffect(() => {
    if (!didHydrate.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const ids = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  const has = useCallback((id: string) => ids.has(id), [ids]);

  const add = useCallback((asset: StagedAsset) => {
    setItems((prev) => (prev.some((i) => i.id === asset.id) ? prev : [asset, ...prev]));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const removeMany = useCallback((removeIds: string[]) => {
    const set = new Set(removeIds);
    setItems((prev) => prev.filter((i) => !set.has(i.id)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<TrashContextValue>(
    () => ({ items, ids, count: items.length, hydrated, has, add, remove, removeMany, clear }),
    [items, ids, hydrated, has, add, remove, removeMany, clear],
  );

  return <TrashContext.Provider value={value}>{children}</TrashContext.Provider>;
}

export function useTrash() {
  const ctx = useContext(TrashContext);
  if (!ctx) throw new Error('useTrash must be used within a TrashProvider');
  return ctx;
}
