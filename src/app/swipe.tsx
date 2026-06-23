import * as Haptics from 'expo-haptics';
import type { Asset } from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { GlassBar } from '@/components/GlassBar';
import { IconButton } from '@/components/IconButton';
import { Decision, DeckHandle, SwipeDeck } from '@/components/SwipeDeck';
import { AssetPage, getAssetBytes, loadAssetsPage } from '@/lib/media';
import { toStaged, useTrash } from '@/store/trash';
import { Radius, Spacing, cardShadow } from '@/theme/tokens';
import { useColors } from '@/theme/useColors';

const PAGE = 60;

export default function SwipeScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trash = useTrash();
  const { albumId, title, count } = useLocalSearchParams<{
    albumId: string;
    title: string;
    count?: string;
  }>();

  const deckRef = useRef<DeckHandle>(null);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [index, setIndex] = useState(0);
  const cursor = useRef<string | undefined>(undefined);
  const hasNext = useRef(true);
  const loadingMore = useRef(false);
  const seen = useRef<Set<string>>(new Set());
  const trashIds = useRef(trash.ids);
  trashIds.current = trash.ids;

  const total = count ? parseInt(count, 10) : undefined;

  const ingest = useCallback((page: AssetPage) => {
    const fresh = page.assets.filter(
      (a) => !seen.current.has(a.id) && !trashIds.current.has(a.id),
    );
    fresh.forEach((a) => seen.current.add(a.id));
    cursor.current = page.endCursor;
    hasNext.current = page.hasNextPage;
    setAssets((prev) => [...(prev ?? []), ...fresh]);
  }, []);

  // Initial load.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const page = await loadAssetsPage(albumId, undefined, PAGE);
        if (active) ingest(page);
      } catch {
        if (active) setAssets([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [albumId, ingest]);

  // Load more as the deck approaches the end of what's loaded.
  useEffect(() => {
    if (!assets || loadingMore.current || !hasNext.current) return;
    if (index < assets.length - 8) return;
    loadingMore.current = true;
    (async () => {
      try {
        const page = await loadAssetsPage(albumId, cursor.current, PAGE);
        ingest(page);
      } catch {
        hasNext.current = false;
      } finally {
        loadingMore.current = false;
      }
    })();
  }, [index, assets, albumId, ingest]);

  const onDecision = useCallback((d: Decision) => {
    if (d === 'keep') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const onDelete = useCallback(
    (asset: Asset) => {
      trash.add(toStaged(asset, title));
      // Upgrade the placeholder estimate to the real on-disk size in the background.
      getAssetBytes(asset.id).then((bytes) => {
        if (bytes > 0) trash.setBytes(asset.id, bytes);
      });
    },
    [trash, title],
  );
  const onUndoDelete = useCallback((asset: Asset) => trash.remove(asset.id), [trash]);

  if (!assets) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.textSecondary} />
      </View>
    );
  }

  const done = index >= assets.length && !hasNext.current;
  const remaining = Math.max(0, (total ?? assets.length) - index);
  const progress = total ? Math.min(1, index / total) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <IconButton
          name="chevron.left"
          onPress={() => router.back()}
          size={42}
          iconSize={18}
          background={c.bgGrouped}
          accessibilityLabel="Back"
        />
        <View style={styles.headerCenter}>
          <AppText variant="headline" rounded color={c.text} numberOfLines={1}>
            {title || 'Photos'}
          </AppText>
          {!done && (
            <AppText variant="caption" color={c.textSecondary}>
              {remaining} to review
            </AppText>
          )}
        </View>
        <Pressable
          onPress={() => router.push('/trash')}
          accessibilityLabel={`Trash, ${trash.count} staged`}
          style={({ pressed }) => [
            styles.trashPill,
            { backgroundColor: c.bgGrouped, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <SymbolView name="trash.fill" size={16} tintColor={trash.count > 0 ? c.delete : c.textSecondary} />
          {trash.count > 0 && (
            <View style={[styles.badge, { backgroundColor: c.delete }]}>
              <AppText variant="caption" color="#fff" rounded>
                {trash.count > 99 ? '99+' : trash.count}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>

      {total ? (
        <View style={[styles.progressTrack, { backgroundColor: c.bgGrouped }]}>
          <View style={[styles.progressFill, { backgroundColor: c.tint, width: `${progress * 100}%` }]} />
        </View>
      ) : null}

      {done ? (
        <DoneView
          c={c}
          title={title}
          staged={trash.count}
          onTrash={() => router.push('/trash')}
          onBack={() => router.back()}
          empty={assets.length === 0}
        />
      ) : (
        <>
          <View style={styles.deckWrap}>
            <SwipeDeck
              ref={deckRef}
              assets={assets}
              onKeep={() => {}}
              onDelete={onDelete}
              onUndoDelete={onUndoDelete}
              onDecision={onDecision}
              onIndexChange={setIndex}
            />
          </View>

          {/* Action bar */}
          <View style={[styles.actionsWrap, { paddingBottom: insets.bottom + Spacing.md }]}>
            <GlassBar style={styles.actionsBar} tintColor={c.card}>
              <IconButton
                name="arrow.uturn.backward"
                onPress={() => deckRef.current?.undo()}
                size={52}
                iconSize={20}
                background={c.bgGrouped}
                color={c.textSecondary}
                accessibilityLabel="Undo last swipe"
              />
              <IconButton
                name="xmark"
                onPress={() => deckRef.current?.swipeDelete()}
                size={72}
                iconSize={30}
                background={c.card}
                color={c.delete}
                bordered
                shadow
                accessibilityLabel="Stage for deletion"
              />
              <IconButton
                name="heart.fill"
                onPress={() => deckRef.current?.swipeKeep()}
                size={72}
                iconSize={30}
                background={c.card}
                color={c.keep}
                bordered
                shadow
                accessibilityLabel="Keep"
              />
              <IconButton
                name="square.grid.2x2.fill"
                onPress={() => router.back()}
                size={52}
                iconSize={20}
                background={c.bgGrouped}
                color={c.textSecondary}
                accessibilityLabel="Back to albums"
              />
            </GlassBar>
          </View>
        </>
      )}
    </View>
  );
}

function DoneView({
  c,
  title,
  staged,
  onTrash,
  onBack,
  empty,
}: {
  c: ReturnType<typeof useColors>;
  title?: string;
  staged: number;
  onTrash: () => void;
  onBack: () => void;
  empty: boolean;
}) {
  return (
    <View style={styles.done}>
      <View style={[styles.doneIcon, { backgroundColor: c.bgGrouped }]}>
        <SymbolView
          name={empty ? 'photo.on.rectangle' : 'checkmark.seal.fill'}
          size={64}
          tintColor={empty ? c.textTertiary : c.keep}
          type="monochrome"
        />
      </View>
      <AppText variant="title1" rounded color={c.text} style={{ textAlign: 'center' }}>
        {empty ? 'No photos here' : 'All caught up'}
      </AppText>
      <AppText
        variant="body"
        color={c.textSecondary}
        style={{ textAlign: 'center', marginTop: 6, paddingHorizontal: Spacing.xl }}
      >
        {empty
          ? `${title || 'This album'} doesn't have any photos to review.`
          : `You've reviewed every photo in ${title || 'this album'}.`}
      </AppText>

      {staged > 0 && (
        <Pressable
          onPress={onTrash}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: c.delete, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <SymbolView name="trash.fill" size={18} tintColor="#fff" />
          <AppText variant="headline" color="#fff">
            Review Trash ({staged})
          </AppText>
        </Pressable>
      )}
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.secondaryBtn,
          { backgroundColor: c.bgGrouped, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <AppText variant="headline" color={c.text}>
          Back to Albums
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  trashPill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  deckWrap: {
    flex: 1,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  actionsWrap: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    width: '100%',
    overflow: 'hidden',
  },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  doneIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.pill,
  },
  secondaryBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.pill,
  },
});
