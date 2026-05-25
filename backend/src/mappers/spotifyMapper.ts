import type {
  SpotifyAlbumSimple,
  SpotifyAlbumFull,
  SpotifyTrackSimple,
  SpotifyPlaylist,
  SpotifyDevice,
  SpotifyRecentlyPlayedItem,
  SpotifySearchResult,
} from '../types/spotify';

// Shared internal model types — these are the stable shapes the frontend receives

export interface AppTrack {
  id: string;
  number: number;
  title: string;
  duration: string;
}

export interface AppAlbum {
  id: string;
  artist: string;
  title: string;
  year: number;
  genre: string;
  mood: string;
  label: string;
  accent: string;
  accentSoft: string;
  coverTag: string;
  coverPattern: string;
  coverText: string;
  coverUrl: string | null;
  tracks: AppTrack[];
}

export interface AppPlaylist {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  trackCount: number;
  owner: string;
}

export interface AppDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent: number | null;
}

export interface AppRecentTrack {
  track: {
    id: string;
    title: string;
    artist: string;
    durationMs: number;
    durationFormatted: string;
    albumId: string;
  };
  albumTitle: string;
  albumCoverUrl: string | null;
  playedAt: string;
}

export interface AppSearchTrack {
  id: string;
  title: string;
  artist: string;
  durationFormatted: string;
  albumTitle: string;
  albumCoverUrl: string | null;
}

export interface AppSearchResults {
  albums: AppAlbum[];
  tracks: AppSearchTrack[];
  artists: Array<{ id: string; name: string }>;
  playlists: AppPlaylist[];
}

// ── helpers ──────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseYear(releaseDate: string): number {
  const y = parseInt(releaseDate.slice(0, 4), 10);
  return Number.isNaN(y) ? new Date().getFullYear() : y;
}

function artistNames(artists: { name: string }[]): string {
  return artists.map((a) => a.name).join(', ');
}

// A subtle dark gradient fallback used for all Spotify albums (no local cover art)
const SPOTIFY_ACCENT =
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 48%, #0d0d18 100%)';
const SPOTIFY_ACCENT_SOFT =
  'linear-gradient(180deg, rgba(80, 80, 130, 0.18), rgba(13, 13, 24, 0.92))';
const COVER_PATTERN =
  'repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 18px)';

// ── mappers ───────────────────────────────────────────────────────────────────

export function mapAlbum(
  album: SpotifyAlbumSimple,
  tracks: SpotifyTrackSimple[] = [],
): AppAlbum {
  const full = album as SpotifyAlbumFull;
  return {
    id: album.id,
    artist: artistNames(album.artists),
    title: album.name,
    year: parseYear(album.release_date),
    genre: full.genres?.[0] ?? '',
    mood: '',
    label: full.label ?? '',
    accent: SPOTIFY_ACCENT,
    accentSoft: SPOTIFY_ACCENT_SOFT,
    coverTag: album.name.slice(0, 2).toUpperCase(),
    coverPattern: COVER_PATTERN,
    coverText: album.name.slice(0, 2).toUpperCase(),
    coverUrl: album.images[0]?.url ?? null,
    tracks: tracks.map((t) => ({
      id: t.id,
      number: t.track_number,
      title: t.name,
      duration: formatMs(t.duration_ms),
    })),
  };
}

export function mapPlaylist(p: SpotifyPlaylist): AppPlaylist {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    coverUrl: p.images[0]?.url ?? null,
    trackCount: p.tracks.total,
    owner: p.owner.display_name ?? '',
  };
}

export function mapDevice(d: SpotifyDevice): AppDevice {
  return {
    id: d.id ?? '',
    name: d.name,
    type: d.type,
    isActive: d.is_active,
    volumePercent: d.volume_percent,
  };
}

export function mapRecentTrack(item: SpotifyRecentlyPlayedItem): AppRecentTrack {
  return {
    track: {
      id: item.track.id,
      title: item.track.name,
      artist: artistNames(item.track.artists),
      durationMs: item.track.duration_ms,
      durationFormatted: formatMs(item.track.duration_ms),
      albumId: item.track.album.id,
    },
    albumTitle: item.track.album.name,
    albumCoverUrl: item.track.album.images[0]?.url ?? null,
    playedAt: item.played_at,
  };
}

export function mapSearchResults(raw: SpotifySearchResult): AppSearchResults {
  const albums = (raw.albums?.items ?? []).map((a) => mapAlbum(a));
  const tracks = (raw.tracks?.items ?? []).map((t) => ({
    id: t.id,
    title: t.name,
    artist: artistNames(t.artists),
    durationFormatted: formatMs(t.duration_ms),
    albumTitle: t.album.name,
    albumCoverUrl: t.album.images[0]?.url ?? null,
  }));
  const artists = (raw.artists?.items ?? []).map((a) => ({
    id: a.id,
    name: a.name,
  }));
  const playlists = (raw.playlists?.items ?? []).map(mapPlaylist);
  return { albums, tracks, artists, playlists };
}
