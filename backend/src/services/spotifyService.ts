import { getValidAccessToken } from './spotifyAuthService';
import type {
  SpotifyAlbumFull,
  SpotifyDevice,
  SpotifyPlaylist,
  SpotifyPlaylistFull,
  SpotifyPlaylistTracksPage,
  SpotifyRecentlyPlayedItem,
  SpotifySearchResult,
  SpotifySavedAlbum,
} from '../types/spotify';
import {
  mapAlbum,
  mapDevice,
  mapPlaylist,
  mapPlaylistFull,
  mapRecentTrack,
  mapSearchResults,
  type AppAlbum,
  type AppDevice,
  type AppPlaylist,
  type AppRecentTrack,
  type AppSearchResults,
} from '../mappers/spotifyMapper';

const API = 'https://api.spotify.com/v1';

// Generic authenticated GET with response validation
async function spotifyGet<T>(path: string): Promise<T> {
  const token = await getValidAccessToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After') ?? '1';
    throw new Error(`Spotify rate limit hit — retry after ${retryAfter}s`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Spotify API ${res.status} for ${path}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Public service functions ──────────────────────────────────────────────────

/** Returns the authenticated user's saved albums (up to 50). */
export async function getSavedAlbums(): Promise<AppAlbum[]> {
  const data = await spotifyGet<{ items: SpotifySavedAlbum[] }>(
    '/me/albums?limit=50',
  );
  return data.items.map((item) => mapAlbum(item.album));
}

/** Returns a single album with full track list. */
export async function getAlbum(id: string): Promise<AppAlbum> {
  const data = await spotifyGet<SpotifyAlbumFull>(`/albums/${id}`);
  return mapAlbum(data, data.tracks.items);
}

/** Returns the authenticated user's playlists (up to 50). */
export async function getPlaylists(): Promise<AppPlaylist[]> {
  const data = await spotifyGet<{ items: (SpotifyPlaylist | null)[] }>(
    '/me/playlists?limit=50',
  );
  return data.items
    .filter((item): item is SpotifyPlaylist => item != null)
    .map(mapPlaylist);
}

/** Returns a single playlist with its tracks (up to 100). */
export async function getPlaylist(id: string): Promise<AppAlbum> {
  const data = await spotifyGet<SpotifyPlaylistFull>(
    `/playlists/${id}?market=from_token`,
  );
  const raw = data as unknown as Record<string, unknown>;

  if (!raw['items'] && !raw['tracks']) {
    // Spotify 2024: /playlists/{id}/items replaced /playlists/{id}/tracks
    try {
      const tracksPage = await spotifyGet<SpotifyPlaylistTracksPage>(
        `/playlists/${id}/items?limit=100&market=from_token`,
      );
      raw['items'] = tracksPage;
    } catch {
      // 403 = Spotify API restricts track access for non-owned playlists in Development Mode
    }
  }

  return mapPlaylistFull(data);
}

/** Returns the authenticated user's recently played tracks (up to 20). */
export async function getRecentlyPlayed(): Promise<AppRecentTrack[]> {
  const data = await spotifyGet<{ items: SpotifyRecentlyPlayedItem[] }>(
    '/me/player/recently-played?limit=50',
  );
  return data.items.map(mapRecentTrack);
}

/** Searches Spotify for albums, tracks, artists, and playlists. */
export async function search(query: string): Promise<AppSearchResults> {
  const q = encodeURIComponent(query.trim());
  const types = 'album,track,artist,playlist';
  const data = await spotifyGet<SpotifySearchResult>(
    `/search?q=${q}&type=${types}&limit=10`,
  );
  return mapSearchResults(data);
}

/** Returns the current user's Spotify profile. */
export async function getMe(): Promise<{
  id: string;
  displayName: string;
  email: string;
  imageUrl: string | null;
}> {
  const data = await spotifyGet<{
    id: string;
    display_name: string;
    email: string;
    images?: { url: string }[];
  }>('/me');
  return {
    id: data.id,
    displayName: data.display_name ?? data.id,
    email: data.email,
    imageUrl: data.images?.[0]?.url ?? null,
  };
}

/** Returns available Spotify Connect devices. */
export async function getDevices(): Promise<AppDevice[]> {
  const data = await spotifyGet<{ devices: SpotifyDevice[] }>('/me/player/devices');
  return data.devices.map(mapDevice);
}

/** Returns just the display name of a Spotify playlist by ID. */
export async function getPlaylistName(id: string): Promise<string> {
  const data = await spotifyGet<{ name: string }>(`/playlists/${id}?fields=name`);
  return data.name ?? '';
}

/** Returns just the display name of a Spotify album by ID. */
export async function getAlbumName(id: string): Promise<string> {
  const data = await spotifyGet<{ name: string }>(`/albums/${id}?fields=name`);
  return data.name ?? '';
}

/** Returns the display name of any Spotify context (playlist or album) by ID and type. */
export async function getContextName(id: string, type: 'playlist' | 'album'): Promise<string> {
  return type === 'album' ? getAlbumName(id) : getPlaylistName(id);
}

/** Returns the current Spotify playback context (playlist/album URI + type), or null. */
export async function getCurrentPlaybackContext(): Promise<{
  type: string;
  uri: string;
  trackId: string | null;
} | null> {
  const data = await spotifyGet<{
    context: { type: string; uri: string } | null;
    item: { id: string } | null;
  } | null>('/me/player?additional_types=track');
  if (!data?.context) return null;
  return { ...data.context, trackId: data.item?.id ?? null };
}

export interface SpotifyPlayerContext {
  httpStatus: number;
  trackId: string | null;
  contextUri: string | null;
  contextType: string | null;
  deviceName: string | null;
  deviceId: string | null;
  deviceIsActive: boolean;
  errorBody?: string;
}

/**
 * Full Spotify /me/player response with HTTP status and device info.
 * 204 (no active player), 401 (token invalid), 403 (missing scope) are returned
 * in the result object instead of throwing — the caller decides how to react.
 * Rate-limit (429) and other network errors still throw.
 */
export async function getPlayerContext(): Promise<SpotifyPlayerContext> {
  const token = await getValidAccessToken();
  const res = await fetch(`${API}/me/player?additional_types=track`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) {
    return {
      httpStatus: 204,
      trackId: null, contextUri: null, contextType: null,
      deviceName: null, deviceId: null, deviceIsActive: false,
    };
  }

  if (res.status === 401 || res.status === 403) {
    const errorBody = await res.text().catch(() => '');
    return {
      httpStatus: res.status,
      trackId: null, contextUri: null, contextType: null,
      deviceName: null, deviceId: null, deviceIsActive: false,
      errorBody,
    };
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After') ?? '1';
    throw new Error(`Spotify rate limit — retry after ${retryAfter}s`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Spotify API ${res.status} for /me/player: ${body}`);
  }

  const data = await res.json() as {
    context: { type: string; uri: string } | null;
    item: { id: string } | null;
    device: { id: string; name: string; is_active: boolean } | null;
  };

  return {
    httpStatus: res.status,
    trackId: data.item?.id ?? null,
    contextUri: data.context?.uri ?? null,
    contextType: data.context?.type ?? null,
    deviceName: data.device?.name ?? null,
    deviceId: data.device?.id ?? null,
    deviceIsActive: data.device?.is_active ?? false,
  };
}
