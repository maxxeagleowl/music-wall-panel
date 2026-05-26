export type Track = {
  id: string;
  number: number;
  title: string;
  duration: string;
  artist?: string;
  albumTitle?: string;
  albumCoverUrl?: string | null;
};

export type Album = {
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
  /** Real cover image URL from Spotify; null/undefined falls back to gradient */
  coverUrl?: string | null;
  tracks: Track[];
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  trackCount: number;
  owner: string;
};

export type SpotifyDevice = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent: number | null;
};

export type RecentTrack = {
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
  context: {
    type: 'album' | 'playlist' | 'artist';
    id: string;
  } | null;
};

export type SearchTrack = {
  id: string;
  title: string;
  artist: string;
  durationFormatted: string;
  albumTitle: string;
  albumId: string;
  albumCoverUrl: string | null;
};

export type SearchResults = {
  albums: Album[];
  tracks: SearchTrack[];
  artists: Array<{ id: string; name: string }>;
  playlists: Playlist[];
};
