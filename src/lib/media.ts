import { File } from 'expo-file-system';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

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
export async function loadAlbums(limited = false): Promise<AlbumSummary[]> {
  const total = await MediaLibrary.getAssetsAsync({ first: 1, mediaType: [PHOTO] });
  const recents: AlbumSummary = {
    id: ALL_PHOTOS_ID,
    title: limited ? 'Selected Photos' : 'Recents',
    count: total.totalCount,
    coverUri: total.assets[0]?.uri,
  };

  // Under iOS "limited" access, getAlbumsAsync throws ("MEDIA_LIBRARY permission is
  // required") and album-scoped queries return nothing — the only photos we can show are
  // the ones the user explicitly granted, which the album-less query above already returns.
  if (limited) return [recents];

  let albums: MediaLibrary.Album[];
  try {
    albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  } catch {
    return [recents];
  }

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

// Reverse-geocoded place names cached per asset id so the deck never refetches. `null`
// means "resolved, but no location" — distinct from "not yet resolved" (absent key).
const placeCache = new Map<string, string | null>();

/**
 * Synchronously returns an already-resolved place name (or undefined if the photo has no
 * location, or hasn't been resolved yet). Lets the UI render a known place immediately —
 * without the async undefined→value flash — once resolveAssetPlace has primed the cache.
 */
export function peekAssetPlace(assetId: string): string | undefined {
  return placeCache.get(assetId) ?? undefined;
}

type Coords = { latitude: number; longitude: number };

/**
 * Pulls GPS coordinates out of an asset's metadata. Prefers the normalized `location` field,
 * then falls back to the EXIF GPS block (iOS exposes it under "{GPS}", which `location`
 * occasionally misses for imported/edited photos).
 */
function coordsFromInfo(info: MediaLibrary.AssetInfo): Coords | undefined {
  const loc = info.location;
  if (loc && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) return loc;

  const exif = info.exif as Record<string, any> | undefined;
  const gps = exif?.['{GPS}'] ?? exif;
  if (!gps) return undefined;
  const lat = Number(gps.Latitude ?? gps.GPSLatitude);
  const lon = Number(gps.Longitude ?? gps.GPSLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return undefined;
  const latRef = gps.LatitudeRef ?? gps.GPSLatitudeRef;
  const lonRef = gps.LongitudeRef ?? gps.GPSLongitudeRef;
  return {
    latitude: latRef === 'S' ? -Math.abs(lat) : lat,
    longitude: lonRef === 'W' ? -Math.abs(lon) : lon,
  };
}

/**
 * Resolves an iPhone Photos-style place name ("City, Region") for an asset from its EXIF GPS,
 * or undefined if the photo has no location / it can't be resolved. Cached per asset id.
 * Uses only the OS geocoder on coordinates already embedded in the photo — it never reads the
 * device's location, so it does not require (or request) location permission.
 */
export async function resolveAssetPlace(assetId: string): Promise<string | undefined> {
  const cached = placeCache.get(assetId);
  if (cached !== undefined) return cached ?? undefined;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId, {
      shouldDownloadFromNetwork: false,
    });
    const coords = coordsFromInfo(info);
    if (!coords) {
      placeCache.set(assetId, null);
      return undefined;
    }
    const [place] = await Location.reverseGeocodeAsync(coords);
    const label = place
      ? [
          place.city || place.subregion || place.district || place.name,
          place.region || place.country,
        ]
          .filter(Boolean)
          .join(', ')
      : '';
    const result = label || null;
    placeCache.set(assetId, result);
    return result ?? undefined;
  } catch {
    return undefined;
  }
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

// Rough on-disk size estimate (no native file I/O, so it stays instant). Tuned for typical
// iPhone HEIC photos (~2.7 MB for a 12 MP image); videos fall back to a per-second rate.
// Used only for the "space freed" cleanup stat, which the UI shows as an approximation (~).
const PHOTO_BYTES_PER_PIXEL = 0.22;
const VIDEO_BYTES_PER_SECOND = 3_500_000;
const UNKNOWN_PHOTO_BYTES = 2_500_000;

export function estimateAssetBytes(a: {
  width?: number;
  height?: number;
  duration?: number;
  mediaType?: string;
}): number {
  if (a.mediaType === 'video' && a.duration && a.duration > 0) {
    return Math.round(a.duration * VIDEO_BYTES_PER_SECOND);
  }
  if (a.width && a.height) {
    return Math.round(a.width * a.height * PHOTO_BYTES_PER_PIXEL);
  }
  return UNKNOWN_PHOTO_BYTES;
}

/**
 * Real on-disk byte size of an asset, read from its local file. Returns 0 if it can't be
 * read (e.g. an iCloud-only photo not downloaded to the device) — callers fall back to
 * estimateAssetBytes. `shouldDownloadFromNetwork: false` keeps this fast (never fetches).
 */
export async function getAssetBytes(assetId: string): Promise<number> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(assetId, {
      shouldDownloadFromNetwork: false,
    });
    if (!info.localUri) return 0;
    const size = new File(info.localUri).size;
    return typeof size === 'number' && size > 0 ? size : 0;
  } catch {
    return 0;
  }
}
