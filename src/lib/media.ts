import * as MediaLibrary from 'expo-media-library/legacy';

/** Sentinel album representing the whole library ("Recents"). */
export const ALL_PHOTOS_ID = '__all_photos__';

export type AlbumSummary = {
  id: string;
  title: string;
  count: number;
  coverUri?: string;
};

const PHOTO = MediaLibrary.MediaType.photo;

async function coverForAlbum(albumId: string | undefined): Promise<string | undefined> {
  try {
    const page = await MediaLibrary.getAssetsAsync({
      first: 1,
      mediaType: [PHOTO],
      sortBy: [MediaLibrary.SortBy.creationTime],
      ...(albumId ? { album: albumId } : {}),
    });
    return page.assets[0]?.uri;
  } catch {
    return undefined;
  }
}

/**
 * Returns albums to browse: a synthetic "Recents" (whole library) entry first,
 * followed by user albums and smart albums that actually contain photos, each
 * with a freshly fetched cover thumbnail. Sorted by photo count, largest first.
 */
export async function loadAlbums(): Promise<AlbumSummary[]> {
  const total = await MediaLibrary.getAssetsAsync({ first: 1, mediaType: [PHOTO] });
  const recents: AlbumSummary = {
    id: ALL_PHOTOS_ID,
    title: 'Recents',
    count: total.totalCount,
    coverUri: total.assets[0]?.uri,
  };

  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });

  const summaries = await Promise.all(
    albums.map(async (album): Promise<AlbumSummary | null> => {
      const count = album.assetCount ?? 0;
      if (count <= 0) return null;
      const coverUri = await coverForAlbum(album.id);
      if (!coverUri) return null; // skip albums with no photos (e.g. videos-only)
      return { id: album.id, title: album.title, count, coverUri };
    }),
  );

  const userAlbums = (summaries.filter(Boolean) as AlbumSummary[]).sort(
    (a, b) => b.count - a.count,
  );

  return [recents, ...userAlbums];
}

export type AssetPage = {
  assets: MediaLibrary.Asset[];
  endCursor?: string;
  hasNextPage: boolean;
};

/** Loads one page of photos for an album (or the whole library for ALL_PHOTOS_ID). */
export async function loadAssetsPage(
  albumId: string,
  after?: string,
  pageSize = 60,
): Promise<AssetPage> {
  const page = await MediaLibrary.getAssetsAsync({
    first: pageSize,
    mediaType: [PHOTO],
    sortBy: [MediaLibrary.SortBy.creationTime],
    ...(after ? { after } : {}),
    ...(albumId !== ALL_PHOTOS_ID ? { album: albumId } : {}),
  });
  return {
    assets: page.assets,
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
  };
}
