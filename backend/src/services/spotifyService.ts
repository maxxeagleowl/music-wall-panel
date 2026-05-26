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
  const raw = data as Record<string, unknown>;

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
