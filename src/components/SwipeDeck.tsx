import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Asset } from 'expo-media-library';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Radius, Spacing, cardShadow } from '@/theme/tokens';
import { useColors } from '@/theme/useColors';

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_W * 0.26;
const FLING_X = SCREEN_W * 1.6;
const VISIBLE = 3; // cards rendered in the stack for depth

export type Decision = 'keep' | 'delete';

export type DeckHandle = {
  swipeKeep: () => void;
  swipeDelete: () => void;
  undo: () => void;
  canUndo: () => boolean;
};

type Props = {
  assets: Asset[];
  onKeep: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onUndoDelete: (asset: Asset) => void;
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

export const SwipeDeck = forwardRef<DeckHandle, Props>(function SwipeDeck(
  { assets, onKeep, onDelete, onUndoDelete, onDecision, onIndexChange },
  ref,
) {
  const c = useColors();
  const [index, setIndex] = useState(0);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  // Refs keep the gesture callbacks stable while always reading fresh values.
  const indexRef = useRef(0);
  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const history = useRef<{ asset: Asset; decision: Decision }[]>([]);
  const cb = useRef({ onKeep, onDelete, onUndoDelete, onDecision, onIndexChange });
  cb.current = { onKeep, onDelete, onUndoDelete, onDecision, onIndexChange };

  const advance = useCallback((dir: number) => {
    const i = indexRef.current;
    const asset = assetsRef.current[i];
    if (!asset) return;
    if (dir > 0) cb.current.onKeep(asset);
    else cb.current.onDelete(asset);
    history.current.push({ asset, decision: dir > 0 ? 'keep' : 'delete' });
    indexRef.current = i + 1;
    setIndex(i + 1);
    cb.current.onIndexChange?.(i + 1);
    tx.value = 0;
    ty.value = 0;
  }, [tx, ty]);

  const fireHaptic = useCallback((dir: number) => {
    cb.current.onDecision?.(dir > 0 ? 'keep' : 'delete');
  }, []);

  const fling = useCallback(
    (dir: number, velocityY = 0) => {
      fireHaptic(dir);
      ty.value = withTiming(ty.value + velocityY * 0.05 - 30, { duration: 240 });
      tx.value = withTiming(dir * FLING_X, { duration: 240 }, (finished) => {
        if (finished) runOnJS(advance)(dir);
      });
    },
    [advance, fireHaptic, tx, ty],
  );

  const undo = useCallback(() => {
    if (indexRef.current === 0 || history.current.length === 0) return;
    const last = history.current.pop()!;
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
  }, [tx, ty]);

  useImperativeHandle(ref, () => ({
    swipeKeep: () => fling(1),
    swipeDelete: () => fling(-1),
    undo,
    canUndo: () => indexRef.current > 0,
  }), [fling, undo]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          tx.value = e.translationX;
          ty.value = e.translationY;
        })
        .onEnd((e) => {
          const swipe =
            Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 850;
          if (swipe) {
            const dir = e.translationX > 0 || e.velocityX > 0 ? 1 : -1;
            runOnJS(fling)(dir, e.velocityY);
          } else {
            tx.value = withSpring(0, { damping: 18, stiffness: 180 });
            ty.value = withSpring(0, { damping: 18, stiffness: 180 });
          }
        }),
    [fling, tx, ty],
  );

  // ---- Animated styles ----
  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      tx.value,
      [-SCREEN_W, 0, SCREEN_W],
      [-11, 0, 11],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const keepOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const deleteOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // Depth styles for the cards underneath; they rise as the top card is dragged.
  const secondCardStyle = useAnimatedStyle(() => {
    const p = interpolate(
      Math.abs(tx.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale: 0.94 + 0.06 * p }, { translateY: 14 - 14 * p }],
    };
  });
  const thirdCardStyle = useAnimatedStyle(() => {
    const p = interpolate(
      Math.abs(tx.value),
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ scale: 0.88 + 0.06 * p }, { translateY: 28 - 14 * p }],
    };
  });

  const window = assets.slice(index, index + VISIBLE);

  return (
    <View style={styles.deck}>
      {/* Render back-to-front so the current card sits on top. */}
      {window
        .map((asset, i) => ({ asset, depth: i }))
        .reverse()
        .map(({ asset, depth }) => {
          const isTop = depth === 0;
          const depthStyle =
            depth === 1 ? secondCardStyle : depth === 2 ? thirdCardStyle : undefined;

          const card = (
            <Animated.View
              key={asset.id}
              pointerEvents={isTop ? 'auto' : 'none'}
              style={[
                styles.card,
                cardShadow(c.shadow),
                { backgroundColor: c.card },
                isTop ? topCardStyle : depthStyle,
              ]}
            >
              <Image
                source={{ uri: asset.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                recyclingKey={asset.id}
                transition={120}
                cachePolicy="memory-disk"
              />

              {/* Caption scrim */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.7)'] as const}
                locations={[0, 0.55, 1]}
                style={styles.scrim}
              />
              <View style={styles.caption}>
                <AppText variant="headline" color="#fff" numberOfLines={1}>
                  {asset.filename || 'Photo'}
                </AppText>
                <AppText variant="footnote" color="rgba(255,255,255,0.8)">
                  {formatDate(asset.creationTime)}
                </AppText>
              </View>

              {isTop && (
                <>
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.badge, styles.badgeLeft, { borderColor: c.keep }, keepOverlayStyle]}
                  >
                    <AppText variant="title2" rounded color={c.keep}>
                      KEEP
                    </AppText>
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.badge,
                      styles.badgeRight,
                      { borderColor: c.delete },
                      deleteOverlayStyle,
                    ]}
                  >
                    <AppText variant="title2" rounded color={c.delete}>
                      DELETE
                    </AppText>
                  </Animated.View>
                </>
              )}
            </Animated.View>
          );

          return isTop ? (
            <GestureDetector gesture={pan} key={asset.id}>
              {card}
            </GestureDetector>
          ) : (
            card
          );
        })}
    </View>
  );
});

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
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  caption: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xl,
    gap: 2,
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
});
