import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { formatBytes } from '@/lib/format';
import { ALL_PHOTOS_ID, AlbumSummary, loadAlbums } from '@/lib/media';
import { useStats } from '@/store/stats';
import { useTrash } from '@/store/trash';
import { Radius, Spacing, cardShadow, withAlpha } from '@/theme/tokens';
import { useColors } from '@/theme/useColors';

const GAP = Spacing.md;
const H_PAD = Spacing.xl;

export default function AlbumsScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trash = useTrash();
  const [permission, requestPermission] = MediaLibrary.usePermissions();

  const [albums, setAlbums] = useState<AlbumSummary[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlbums = useCallback(async () => {
    try {
      setAlbums(await loadAlbums(permission?.accessPrivileges === 'limited'));
    } catch {
      setAlbums([]);
    }
  }, [permission?.accessPrivileges]);

  // Refresh whenever the screen regains focus (e.g. after deleting from Trash).
  useFocusEffect(
    useCallback(() => {
      if (permission?.granted) fetchAlbums();
    }, [permission?.granted, fetchAlbums]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlbums();
    setRefreshing(false);
  }, [fetchAlbums]);

  // Re-fetch when the user changes which photos are shared under limited access
  // (e.g. via the "select more" picker or iOS Settings).
  useEffect(() => {
    const sub = MediaLibrary.addListener(() => {
      if (permission?.granted) fetchAlbums();
    });
    return () => sub.remove();
  }, [permission?.granted, fetchAlbums]);

  // ----- Permission gate -----
  if (!permission) {
    return <Centered c={c} />;
  }

  if (!permission.granted) {
    const blocked = permission.status === 'denied' && !permission.canAskAgain;
    return (
      <View style={[styles.gate, { backgroundColor: c.bg, paddingTop: insets.top + 40 }]}>
        <View style={[styles.gateIcon, { backgroundColor: c.bgGrouped }]}>
          <SymbolView name="photo.stack.fill" size={56} tintColor={c.tint} type="monochrome" />
        </View>
        <AppText variant="title1" rounded color={c.text} style={styles.center}>
          Access your photos
        </AppText>
        <AppText variant="body" color={c.textSecondary} style={[styles.center, { marginTop: 8 }]}>
          Photoslide needs permission to show your albums so you can swipe through them. Nothing is
          ever deleted or moved without your explicit confirmation.
        </AppText>
        <Pressable
          onPress={() => (blocked ? Linking.openSettings() : requestPermission())}
          style={({ pressed }) => [
            styles.gateBtn,
            { backgroundColor: c.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <AppText variant="headline" color={c.onAccent}>
            {blocked ? 'Open Settings' : 'Allow Access'}
          </AppText>
        </Pressable>
      </View>
    );
  }

  if (!albums) {
    return <Centered c={c} />;
  }

  const limited = permission.accessPrivileges === 'limited';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={albums}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: H_PAD }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: GAP }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.textSecondary} />
        }
        ListHeaderComponent={
          <Header
            c={c}
            count={trash.count}
            onTrash={() => router.push('/trash')}
            limited={limited}
            insetTop={insets.top}
          />
        }
        renderItem={({ item }) => (
          <AlbumTile
            album={item}
            c={c}
            onPress={() =>
              router.push({
                pathname: '/swipe',
                params: { albumId: item.id, title: item.title, count: String(item.count) },
              })
            }
          />
        )}
      />
    </View>
  );
}

function Header({
  c,
  count,
  onTrash,
  limited,
  insetTop,
}: {
  c: ReturnType<typeof useColors>;
  count: number;
  onTrash: () => void;
  limited: boolean;
  insetTop: number;
}) {
  const stats = useStats();
  return (
    <View style={{ paddingTop: insetTop + Spacing.md, paddingHorizontal: H_PAD }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="footnote" color={c.tint} rounded style={{ letterSpacing: 1 }}>
            PHOTOSLIDE
          </AppText>
          <AppText variant="largeTitle" rounded color={c.text}>
            Albums
          </AppText>
        </View>
        <Pressable
          onPress={onTrash}
          accessibilityRole="button"
          accessibilityLabel={`Trash, ${count} staged`}
          style={({ pressed }) => [
            styles.trashPill,
            { backgroundColor: c.bgGrouped, opacity: pressed ? 0.7 : 1 },
            cardShadow(c.shadow),
          ]}
        >
          <SymbolView name="trash.fill" size={18} tintColor={count > 0 ? c.delete : c.textSecondary} />
          {count > 0 && (
            <View style={[styles.badge, { backgroundColor: c.delete }]}>
              <AppText variant="caption" color="#fff" rounded>
                {count > 99 ? '99+' : count}
              </AppText>
            </View>
          )}
        </Pressable>
      </View>
      <AppText
        variant="subhead"
        color={c.textSecondary}
        style={{ marginTop: 2, marginBottom: Spacing.md }}
      >
        Swipe right to keep, left to stage for deletion.
      </AppText>

      <View
        style={styles.statsRow}
        accessible
        accessibilityLabel={`${stats.clearedPhotos} photos cleared, ${formatBytes(
          stats.freedBytes,
        )} of space freed`}
      >
        <View style={[styles.statCard, { backgroundColor: c.bgGrouped }, cardShadow(c.shadow)]}>
          <View style={[styles.statIcon, { backgroundColor: withAlpha(c.keep, 0.12) }]}>
            <SymbolView name="checkmark.seal.fill" size={20} tintColor={c.keep} />
          </View>
          <AppText variant="title2" rounded color={c.text}>
            {stats.clearedPhotos.toLocaleString()}
          </AppText>
          <AppText variant="footnote" color={c.textSecondary}>
            Photos cleared
          </AppText>
        </View>
        <View style={[styles.statCard, { backgroundColor: c.bgGrouped }, cardShadow(c.shadow)]}>
          <View style={[styles.statIcon, { backgroundColor: withAlpha(c.tint, 0.12) }]}>
            <SymbolView name="internaldrive.fill" size={20} tintColor={c.tint} />
          </View>
          <AppText variant="title2" rounded color={c.text}>
            {formatBytes(stats.freedBytes)}
          </AppText>
          <AppText variant="footnote" color={c.textSecondary}>
            Space freed
          </AppText>
        </View>
      </View>

      {limited && (
        <Pressable
          onPress={() => MediaLibrary.presentPermissionsPickerAsync?.()}
          style={[styles.limitedBanner, { backgroundColor: c.bgGrouped, borderColor: c.separator }]}
        >
          <SymbolView name="exclamationmark.circle.fill" size={18} tintColor={c.tint} />
          <AppText variant="footnote" color={c.text} style={{ flex: 1 }}>
            You've allowed access to only some photos. Tap to select more.
          </AppText>
          <SymbolView name="chevron.right" size={12} tintColor={c.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

function AlbumTile({
  album,
  c,
  onPress,
}: {
  album: AlbumSummary;
  c: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      <View style={[styles.tileInner, { backgroundColor: c.bgGrouped }, cardShadow(c.shadow)]}>
        {album.coverUri ? (
          <Image source={{ uri: album.coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.tileEmpty]}>
            <SymbolView name="photo" size={32} tintColor={c.textTertiary} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)'] as const}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {album.id === ALL_PHOTOS_ID && (
          <View style={[styles.recentsChip, { backgroundColor: c.tint }]}>
            <SymbolView name="clock.fill" size={11} tintColor="#fff" />
            <AppText variant="caption" color="#fff" rounded>
              All
            </AppText>
          </View>
        )}
        <View style={styles.tileMeta}>
          <AppText variant="headline" color="#fff" numberOfLines={1}>
            {album.title}
          </AppText>
          <AppText variant="footnote" color="rgba(255,255,255,0.82)">
            {album.count.toLocaleString()} {album.count === 1 ? 'photo' : 'photos'}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

function Centered({ c }: { c: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.centered, { backgroundColor: c.bg }]}>
      <ActivityIndicator color={c.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  trashPill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  limitedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.lg,
  },
  tile: { flex: 1 },
  tileInner: {
    aspectRatio: 0.82,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tileEmpty: { alignItems: 'center', justifyContent: 'center' },
  tileMeta: { position: 'absolute', left: Spacing.md, right: Spacing.md, bottom: Spacing.md },
  recentsChip: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  // ----- permission gate -----
  gate: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xxl },
  gateIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  gateBtn: {
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: Radius.pill,
  },
});
