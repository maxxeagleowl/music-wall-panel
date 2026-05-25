import { get } from './client';
import type { Album, Playlist, SpotifyDevice, RecentTrack, SearchResults } from '../types/music';

// ── Auth status ───────────────────────────────────────────────────────────────

export interface SpotifyStatus {
  connected: boolean;
  user: string | null;
}

export const getStatus = () => get<SpotifyStatus>('/api/spotify/status');

// ── Library ───────────────────────────────────────────────────────────────────

export async function getAlbums(): Promise<Album[]> {
  try {
    return await get<Album[]>('/api/spotify/albums');
  } catch {
    return [];
  }
}

export async function getAlbum(id: string): Promise<Album | null> {
  try {
    return await get<Album>(`/api/spotify/albums/${id}`);
  } catch {
    return null;
  }
}

export async function getPlaylist(id: string): Promise<Album | null> {
  try {
    return await get<Album>(`/api/spotify/playlists/${id}`);
  } catch {
    return null;
  }
}

export async function getPlaylists(): Promise<Playlist[]> {
  try {
    return await get<Playlist[]>('/api/spotify/playlists');
  } catch {
    return [];
  }
}

// ── Recently played ───────────────────────────────────────────────────────────

export async function getRecentlyPlayed(): Promise<RecentTrack[]> {
  try {
    return await get<RecentTrack[]>('/api/spotify/recent');
  } catch {
    return [];
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function search(query: string): Promise<SearchResults> {
  const empty: SearchResults = { albums: [], tracks: [], artists: [], playlists: [] };
  if (!query.trim()) return empty;
  try {
    const params = new URLSearchParams({ q: query });
    return await get<SearchResults>(`/api/spotify/search?${params}`);
  } catch {
    return empty;
  }
}

// ── Devices ───────────────────────────────────────────────────────────────────

export async function getDevices(): Promise<SpotifyDevice[]> {
  try {
    return await get<SpotifyDevice[]>('/api/spotify/devices');
  } catch {
    return [];
  }
}

// ── User profile ──────────────────────────────────────────────────────────────

export interface SpotifyMe {
  id: string;
  displayName: string;
  email: string;
  imageUrl: string | null;
}

export async function getMe(): Promise<SpotifyMe | null> {
  try {
    return await get<SpotifyMe>('/api/spotify/me');
  } catch {
    return null;
  }
}
