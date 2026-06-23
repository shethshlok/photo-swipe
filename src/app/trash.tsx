import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library/legacy';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { GlassBar } from '@/components/GlassBar';
import { StagedAsset, useTrash } from '@/store/trash';
import { Radius, Spacing } from '@/theme/tokens';
import { useColors } from '@/theme/useColors';

const COLS = 3;
const GAP = 3;

export default function TrashScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, removeMany } = useTrash();

  // Track de-selected ids so newly added photos default to selected.
  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const selectedIds = useMemo(
    () => items.filter((i) => !deselected.has(i.id)).map((i) => i.id),
    [items, deselected],
  );
  const allSelected = selectedIds.length === items.length && items.length > 0;

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setDeselected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setDeselected(allSelected ? new Set(items.map((i) => i.id)) : new Set());
  };

  const confirmDelete = () => {
    if (selectedIds.length === 0) return;
    const n = selectedIds.length;
    Alert.alert(
      `Delete ${n} photo${n === 1 ? '' : 's'}?`,
      'They will be removed from your library (moved to Recently Deleted). iOS will ask you to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: runDelete },
      ],
    );
  };

  const runDelete = async () => {
    setBusy(true);
    try {
      const ok = await MediaLibrary.deleteAssetsAsync(selectedIds);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        removeMany(selectedIds);
        setDeselected(new Set());
        if (selectedIds.length === items.length) router.back();
      }
    } catch (e) {
      Alert.alert('Could not delete', 'Something went wrong while deleting those photos.');
    } finally {
      setBusy(false);
    }
  };

  const restore = () => {
    if (selectedIds.length === 0) return;
    removeMany(selectedIds);
    setDeselected(new Set());
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Close">
          <SymbolView name="xmark.circle.fill" size={30} tintColor={c.textTertiary} type="hierarchical" />
        </Pressable>
        <View style={styles.headerCenter}>
          <AppText variant="headline" rounded color={c.text}>
            Trash
          </AppText>
          <AppText variant="caption" color={c.textSecondary}>
            {items.length} staged
          </AppText>
        </View>
        {items.length > 0 ? (
          <Pressable onPress={toggleAll} hitSlop={10}>
            <AppText variant="subhead" color={c.tint}>
              {allSelected ? 'Deselect' : 'Select All'}
            </AppText>
          </Pressable>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState c={c} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={COLS}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingHorizontal: Spacing.lg }}
          columnWrapperStyle={{ gap: GAP }}
          ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
          ListHeaderComponent={
            <View style={[styles.note, { backgroundColor: c.bgGrouped }]}>
              <SymbolView name="lock.shield.fill" size={16} tintColor={c.tint} />
              <AppText variant="footnote" color={c.textSecondary} style={{ flex: 1 }}>
                These are only staged. Nothing leaves your library until you tap Delete.
              </AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Thumb item={item} c={c} selected={!deselected.has(item.id)} onPress={() => toggle(item.id)} />
          )}
        />
      )}

      {items.length > 0 && (
        <View style={[styles.actionsWrap, { paddingBottom: insets.bottom + Spacing.md }]}>
          <GlassBar style={styles.actionsBar} tintColor={c.card}>
            <Pressable
              onPress={restore}
              disabled={selectedIds.length === 0 || busy}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: c.bgGrouped, opacity: selectedIds.length === 0 || busy ? 0.4 : pressed ? 0.7 : 1 },
              ]}
            >
              <SymbolView name="arrow.uturn.backward" size={18} tintColor={c.text} />
              <AppText variant="headline" color={c.text}>
                Keep {selectedIds.length || ''}
              </AppText>
            </Pressable>
            <Pressable
              onPress={confirmDelete}
              disabled={selectedIds.length === 0 || busy}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: c.delete, opacity: selectedIds.length === 0 || busy ? 0.4 : pressed ? 0.85 : 1 },
              ]}
            >
              <SymbolView name="trash.fill" size={18} tintColor="#fff" />
              <AppText variant="headline" color="#fff">
                Delete {selectedIds.length || ''}
              </AppText>
            </Pressable>
          </GlassBar>
        </View>
      )}
    </View>
  );
}

function Thumb({
  item,
  c,
  selected,
  onPress,
}: {
  item: StagedAsset;
  c: ReturnType<typeof useColors>;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.thumb}>
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={item.id} />
      {!selected && <View style={styles.dim} />}
      <View
        style={[
          styles.check,
          selected
            ? { backgroundColor: c.tint, borderColor: '#fff' }
            : { backgroundColor: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.9)' },
        ]}
      >
        {selected && <SymbolView name="checkmark" size={13} tintColor="#fff" />}
      </View>
    </Pressable>
  );
}

function EmptyState({ c }: { c: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.bgGrouped }]}>
        <SymbolView name="sparkles" size={56} tintColor={c.keep} type="monochrome" />
      </View>
      <AppText variant="title2" rounded color={c.text}>
        Nothing staged
      </AppText>
      <AppText
        variant="body"
        color={c.textSecondary}
        style={{ textAlign: 'center', marginTop: 6, paddingHorizontal: Spacing.xxl }}
      >
        Swipe photos left while browsing an album to collect them here for deletion.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerCenter: { alignItems: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  thumb: {
    flex: 1 / COLS,
    aspectRatio: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    backgroundColor: '#00000010',
  },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Spacing.xl },
  actionsBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
});
