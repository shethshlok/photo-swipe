import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Asset } from 'expo-media-library';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { resolveAssetPlace } from '@/lib/media';
import { Radius, Spacing, cardShadow } from '@/theme/tokens';
import { useColors } from '@/theme/useColors';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const SWIPE_THRESHOLD = SCREEN_W * 0.26;
const SKIP_THRESHOLD = SCREEN_H * 0.14;
const FLING_X = SCREEN_W * 1.6;
const FLING_Y = SCREEN_H * 1.1;
const VISIBLE = 3; // visible depths in the stack (0,1,2); one extra is rendered as a buffer

export type Decision = 'keep' | 'delete' | 'skip';

export type DeckHandle = {
  swipeKeep: () => void;
  swipeDelete: () => void;
  skip: () => void;
  undo: () => void;
  canUndo: () => boolean;
};

type Props = {
  assets: Asset[];
  onKeep: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onUndoDelete: (asset: Asset) => void;
  /** Defer a photo: move it to the back of the queue to review later. */
  onSkip: (asset: Asset) => void;
  /** Undo a defer: restore the photo to `index` so it's the current card again. */
  onUndoSkip: (asset: Asset, index: number) => void;
  onDecision?: (haptic: Decision) => void;
  onIndexChange?: (index: number) => void;
};

function formatDate(ms?: number) {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatTime(ms?: number) {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** Resolves a Photos-style place name for an asset, refreshing when the asset changes. */
function usePlace(asset: Asset | null): string | undefined {
  const [place, setPlace] = useState<string>();
  useEffect(() => {
    setPlace(undefined);
    if (!asset) return;
    let active = true;
    resolveAssetPlace(asset.id).then((p) => {
      if (active) setPlace(p);
    });
    return () => {
      active = false;
    };
  }, [asset]);
  return place;
}

type Tag = { icon: SFSymbol; label: string };

function dateTimeTags(asset: Asset): Tag[] {
  const tags: Tag[] = [];
  const date = formatDate(asset.creationTime);
  if (date) tags.push({ icon: 'calendar', label: date });
  const time = formatTime(asset.creationTime);
  if (time) tags.push({ icon: 'clock', label: time });
  return tags;
}

/** Tags for the full-screen viewer (date, time, and location together). */
function metaTags(asset: Asset, place?: string): Tag[] {
  const tags = dateTimeTags(asset);
  if (place) tags.push({ icon: 'mappin.and.ellipse', label: place });
  return tags;
}

function MetaTags({ tags, color, chip }: { tags: Tag[]; color: string; chip: string }) {
  return (
    <View style={styles.tagRow}>
      {tags.map((t) => (
        <View key={t.icon + t.label} style={[styles.tag, { backgroundColor: chip }]}>
          <SymbolView name={t.icon} size={12} tintColor={color} type="monochrome" />
          <AppText variant="caption" color={color}>
            {t.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const CHIP = 'rgba(255,255,255,0.18)';

/**
 * Just the two image layers, keyed purely on the photo URI (a stable string). Because the
 * source is a primitive and this is memoized on `uri` alone, neither a deck re-render nor an
 * async location update ever changes its props — so expo-image never reloads / shows a
 * placeholder, which is what caused the swipe flicker.
 */
const CardImages = memo(function CardImages({ uri }: { uri: string }) {
  return (
    <>
      {/* Blurred, dimmed copy of the photo fills the letterbox area so the card reads
          edge-to-edge (deference + depth) while the full image stays uncropped on top. */}
      <Image
        source={uri}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={40}
        cachePolicy="memory-disk"
      />
      <View style={[StyleSheet.absoluteFill, styles.fillTint]} />
      <Image
        source={uri}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </>
  );
});

/** A card's visual stack: stable images, location pinned top-center, date/time bottom-center. */
const CardFace = memo(function CardFace({ asset, place }: { asset: Asset; place?: string }) {
  return (
    <>
      <CardImages uri={asset.uri} />

      {/* Location — top center */}
      {place ? (
        <>
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent'] as const}
            style={styles.topScrim}
            pointerEvents="none"
          />
          <View style={styles.topMeta} pointerEvents="none">
            <MetaTags tags={[{ icon: 'mappin.and.ellipse', label: place }]} color="#fff" chip={CHIP} />
          </View>
        </>
      ) : null}

      {/* Date + time — bottom center */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)'] as const}
        locations={[0.45, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={styles.bottomMeta} pointerEvents="none">
        <MetaTags tags={dateTimeTags(asset)} color="#fff" chip={CHIP} />
      </View>
    </>
  );
});

/**
 * One card in the stack. Each card owns its transform via a worklet so the *outgoing* card can
 * be pinned off-screen (by id, on the UI thread) the instant we reset the shared drag offset —
 * otherwise the just-swiped card briefly snaps back to center and flashes the previous photo.
 */
const DeckCard = memo(function DeckCard({
  asset,
  depth,
  isTop,
  place,
  c,
  tx,
  ty,
  leavingId,
  exitX,
  exitY,
  enterScale,
}: {
  asset: Asset;
  depth: number;
  isTop: boolean;
  place?: string;
  c: ReturnType<typeof useColors>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  leavingId: SharedValue<string>;
  exitX: SharedValue<number>;
  exitY: SharedValue<number>;
  enterScale: SharedValue<number>;
}) {
  const id = asset.id;

  const cardStyle = useAnimatedStyle(() => {
    // This card is leaving: hold it at its exit position regardless of the live drag offset.
    if (leavingId.value === id) {
      const rot = exitX.value > 1 ? 11 : exitX.value < -1 ? -11 : 0;
      return {
        transform: [
          { translateX: exitX.value },
          { translateY: exitY.value },
          { rotate: `${rot}deg` },
        ],
      };
    }
    if (isTop) {
      const rotate = interpolate(tx.value, [-SCREEN_W, 0, SCREEN_W], [-11, 0, 11], Extrapolation.CLAMP);
      // enterScale springs from the depth-1 resting scale up to 1 as this card takes front,
      // so the next photo eases into place instead of snapping to full size.
      return {
        transform: [
          { translateX: tx.value },
          { translateY: ty.value },
          { rotate: `${rotate}deg` },
          { scale: enterScale.value },
        ],
      };
    }
    // Cards underneath rise toward the top as the current card is dragged away. depth-1 stops
    // just short of full size (0.98) so the hand-off to the top card's spring is seamless.
    const p = interpolate(Math.abs(tx.value), [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP);
    if (depth === 1) return { transform: [{ scale: 0.94 + 0.04 * p }, { translateY: 14 - 14 * p }] };
    return { transform: [{ scale: 0.88 + 0.06 * p }, { translateY: 28 - 14 * p }] };
  });

  const keepStyle = useAnimatedStyle(() => ({
    opacity: isTop ? interpolate(tx.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) : 0,
  }));
  const deleteStyle = useAnimatedStyle(() => ({
    opacity: isTop ? interpolate(tx.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP) : 0,
  }));
  const skipStyle = useAnimatedStyle(() => ({
    opacity: isTop ? interpolate(ty.value, [-SKIP_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP) : 0,
  }));

  return (
    <Animated.View
      pointerEvents={isTop ? 'auto' : 'none'}
      style={[styles.card, cardShadow(c.shadow), { backgroundColor: c.card }, cardStyle]}
    >
      <CardFace asset={asset} place={place} />

      {isTop && (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.badge, styles.badgeLeft, { borderColor: c.keep }, keepStyle]}
          >
            <AppText variant="title2" rounded color={c.keep}>
              KEEP
            </AppText>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.badge, styles.badgeRight, { borderColor: c.delete }, deleteStyle]}
          >
            <AppText variant="title2" rounded color={c.delete}>
              DELETE
            </AppText>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.badgeTopWrap, skipStyle]}>
            <View style={[styles.badgeBox, { borderColor: c.tint }]}>
              <AppText variant="title2" rounded color={c.tint}>
                LATER
              </AppText>
            </View>
          </Animated.View>
        </>
      )}
    </Animated.View>
  );
});

export const SwipeDeck = forwardRef<DeckHandle, Props>(function SwipeDeck(
  { assets, onKeep, onDelete, onUndoDelete, onSkip, onUndoSkip, onDecision, onIndexChange },
  ref,
) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState<Asset | null>(null);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // Identity + resting position of the card currently animating off, so it stays put while the
  // shared drag offset resets to 0 for the new top card. Empty string = nothing leaving.
  const leavingId = useSharedValue('');
  const exitX = useSharedValue(0);
  const exitY = useSharedValue(0);
  // Scale of the top card; springs from the depth-1 resting scale up to 1 when a new card
  // takes front, so the incoming photo settles in smoothly rather than popping.
  const enterScale = useSharedValue(1);

  const settleTop = useCallback(() => {
    enterScale.value = 0.98;
    enterScale.value = withSpring(1, { damping: 16, stiffness: 170 });
  }, [enterScale]);

  // Refs keep the gesture callbacks stable while always reading fresh values.
  const indexRef = useRef(0);
  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const history = useRef<{ asset: Asset; decision: Decision }[]>([]);
  const cb = useRef({ onKeep, onDelete, onUndoDelete, onSkip, onUndoSkip, onDecision, onIndexChange });
  cb.current = { onKeep, onDelete, onUndoDelete, onSkip, onUndoSkip, onDecision, onIndexChange };

  const advance = useCallback(
    (dir: number) => {
      const i = indexRef.current;
      const asset = assetsRef.current[i];
      if (!asset) return;
      if (dir > 0) cb.current.onKeep(asset);
      else cb.current.onDelete(asset);
      history.current.push({ asset, decision: dir > 0 ? 'keep' : 'delete' });
      // Pin the outgoing card off-screen, then reset the offset for the incoming top card.
      leavingId.value = asset.id;
      exitX.value = dir * FLING_X;
      exitY.value = ty.value;
      indexRef.current = i + 1;
      setIndex(i + 1);
      cb.current.onIndexChange?.(i + 1);
      tx.value = 0;
      ty.value = 0;
      settleTop();
    },
    [tx, ty, leavingId, exitX, exitY, settleTop],
  );

  const fireHaptic = useCallback((dir: number) => {
    cb.current.onDecision?.(dir > 0 ? 'keep' : 'delete');
  }, []);

  // Defer the current card: it slides up off-screen, the parent moves it to the back of the
  // queue, and the next card takes its place. Index is unchanged.
  const advanceSkip = useCallback(() => {
    const i = indexRef.current;
    const asset = assetsRef.current[i];
    if (!asset) return;
    leavingId.value = asset.id;
    exitX.value = 0;
    exitY.value = -FLING_Y;
    cb.current.onSkip(asset);
    history.current.push({ asset, decision: 'skip' });
    tx.value = 0;
    ty.value = 0;
    settleTop();
  }, [tx, ty, leavingId, exitX, exitY, settleTop]);

  const flingUp = useCallback(() => {
    cb.current.onDecision?.('skip');
    tx.value = withTiming(0, { duration: 240 });
    ty.value = withTiming(-FLING_Y, { duration: 240 }, (finished) => {
      if (finished) runOnJS(advanceSkip)();
    });
  }, [advanceSkip, tx, ty]);

  const openViewer = useCallback(() => {
    const asset = assetsRef.current[indexRef.current];
    if (asset) setViewer(asset);
  }, []);

  const fling = useCallback(
    (dir: number, velocityY = 0) => {
      fireHaptic(dir);
      const easing = Easing.out(Easing.cubic);
      ty.value = withTiming(ty.value + velocityY * 0.05 - 30, { duration: 260, easing });
      tx.value = withTiming(dir * FLING_X, { duration: 260, easing }, (finished) => {
        if (finished) runOnJS(advance)(dir);
      });
    },
    [advance, fireHaptic, tx, ty],
  );

  const undo = useCallback(() => {
    if (history.current.length === 0) return;
    const last = history.current.pop()!;
    leavingId.value = ''; // un-pin so a restored card isn't stuck off-screen
    enterScale.value = 1;

    if (last.decision === 'skip') {
      // Index didn't move on skip, so restore the photo at the current top position.
      cb.current.onUndoSkip(last.asset, indexRef.current);
      tx.value = 0;
      ty.value = -FLING_Y;
      ty.value = withSpring(0, { damping: 18, stiffness: 160 });
      return;
    }

    const i = indexRef.current - 1;
    indexRef.current = i;
    setIndex(i);
    cb.current.onIndexChange?.(i);
    if (last.decision === 'delete') cb.current.onUndoDelete(last.asset);
    // Rewind the card in from the side it left.
    const fromDir = last.decision === 'delete' ? -1 : 1;
    tx.value = fromDir * FLING_X;
    ty.value = -30;
    tx.value = withSpring(0, { damping: 18, stiffness: 160 });
    ty.value = withSpring(0, { damping: 18, stiffness: 160 });
  }, [tx, ty, leavingId, enterScale]);

  useImperativeHandle(
    ref,
    () => ({
      swipeKeep: () => fling(1),
      swipeDelete: () => fling(-1),
      skip: () => flingUp(),
      undo,
      canUndo: () => history.current.length > 0,
    }),
    [fling, flingUp, undo],
  );

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .onUpdate((e) => {
        tx.value = e.translationX;
        ty.value = e.translationY;
      })
      .onEnd((e) => {
        // Upward drag that's mostly vertical → defer ("look later").
        const up =
          (-e.translationY > SKIP_THRESHOLD || e.velocityY < -900) &&
          -e.translationY > Math.abs(e.translationX);
        if (up) {
          runOnJS(flingUp)();
          return;
        }
        const swipe =
          Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 850;
        if (swipe) {
          const dir = e.translationX > 0 || e.velocityX > 0 ? 1 : -1;
          runOnJS(fling)(dir, e.velocityY);
        } else {
          tx.value = withSpring(0, { damping: 18, stiffness: 180 });
          ty.value = withSpring(0, { damping: 18, stiffness: 180 });
        }
      });
    // A clean tap (no drag) opens the full-screen viewer; a drag swipes the card.
    const tap = Gesture.Tap()
      .maxDuration(250)
      .onEnd((_e, success) => {
        if (success) runOnJS(openViewer)();
      });
    return Gesture.Race(tap, pan);
  }, [fling, flingUp, openViewer, tx, ty]);

  // Render one extra card beyond the visible depths as an occluded buffer, so the next card to
  // appear was already mounted and decoded a swipe earlier (no pop/flash).
  const window = assets.slice(index, index + VISIBLE + 1);
  const topPlace = usePlace(window[0] ?? null);

  // Once the new arrangement has committed, the outgoing card is gone — un-pin it so a future
  // undo can bring it (or any card with that id) back into view.
  useEffect(() => {
    leavingId.value = '';
  }, [index, assets, leavingId]);

  // Preload upcoming photos into the memory cache so a card never mounts with an undecoded image.
  useEffect(() => {
    const ahead = assets.slice(index, index + VISIBLE + 4).map((a) => a.uri);
    if (ahead.length) Image.prefetch(ahead, 'memory-disk');
  }, [index, assets]);

  return (
    <View style={styles.deck}>
      {/* One stable GestureDetector for the whole stack so promoted cards are never remounted. */}
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          {/* Render back-to-front so the current card sits on top. */}
          {window
            .map((asset, i) => ({ asset, depth: i }))
            .reverse()
            .map(({ asset, depth }) => (
              <DeckCard
                key={asset.id}
                asset={asset}
                depth={depth}
                isTop={depth === 0}
                place={depth === 0 ? topPlace : undefined}
                c={c}
                tx={tx}
                ty={ty}
                leavingId={leavingId}
                exitX={exitX}
                exitY={exitY}
                enterScale={enterScale}
              />
            ))}
        </View>
      </GestureDetector>

      <FullScreenViewer asset={viewer} onClose={() => setViewer(null)} insets={insets} />
    </View>
  );
});

function FullScreenViewer({
  asset,
  onClose,
  insets,
}: {
  asset: Asset | null;
  onClose: () => void;
  insets: { top: number; bottom: number };
}) {
  const place = usePlace(asset);
  return (
    <Modal
      visible={!!asset}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.viewerRoot}>
        {asset && (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
              <Image
                source={asset.uri}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </Pressable>

            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent'] as const}
              style={[styles.viewerTopScrim, { height: insets.top + 72 }]}
              pointerEvents="none"
            />
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close photo"
              style={({ pressed }) => [
                styles.viewerClose,
                { top: insets.top + Spacing.sm, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <SymbolView name="xmark" size={18} tintColor="#fff" type="monochrome" />
            </Pressable>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)'] as const}
              style={[styles.viewerBottomScrim, { paddingBottom: insets.bottom + Spacing.xl }]}
              pointerEvents="none"
            >
              <MetaTags tags={metaTags(asset, place)} color="#fff" chip={CHIP} />
            </LinearGradient>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    overflow: 'hidden',
  },
  fillTint: {
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  topScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '26%',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  topMeta: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  bottomMeta: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  badge: {
    position: 'absolute',
    top: Spacing.xxl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 4,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  badgeLeft: {
    left: Spacing.xl,
    transform: [{ rotate: '-16deg' }],
  },
  badgeRight: {
    right: Spacing.xl,
    transform: [{ rotate: '16deg' }],
  },
  badgeTopWrap: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badgeBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 4,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  viewerClose: {
    position: 'absolute',
    right: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  viewerBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
