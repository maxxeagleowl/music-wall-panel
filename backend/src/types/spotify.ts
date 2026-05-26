export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyArtistSimple {
  id: string;
  name: string;
}

export interface SpotifyAlbumSimple {
  id: string;
  name: string;
  artists: SpotifyArtistSimple[];
  images: SpotifyImage[];
  release_date: string;
  album_type: string;
  total_tracks: number;
}

export interface SpotifyTrackSimple {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: SpotifyArtistSimple[];
}

export interface SpotifyAlbumFull extends SpotifyAlbumSimple {
  genres: string[];
  label: string;
  tracks: {
    items: SpotifyTrackSimple[];
    total: number;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  /** Spotify renamed tracks→items in 2024 */
  items?: { href: string; total: number } | null;
  /** Legacy field name — keep for fallback */
  tracks?: { href: string; total: number } | null;
  owner: { display_name: string | null };
}

export interface SpotifyPlaylistTrackItem {
  /** Spotify renamed track→item in 2024 */
  item?: (SpotifyTrackSimple & { album: SpotifyAlbumSimple }) | null;
  /** Legacy field name — keep for fallback */
  track?: (SpotifyTrackSimple & { album: SpotifyAlbumSimple }) | null;
  is_local: boolean;
}

export interface SpotifyPlaylistFull {
  id: string;
  name: string;
  description: string | null;
  images: SpotifyImage[];
  owner: { display_name: string | null };
  /** Spotify renamed tracks→items in 2024; paging object with nested items array */
  items?: {
    href: string;
    items: SpotifyPlaylistTrackItem[];
    total: number;
  } | null;
  /** Legacy field name — keep for fallback */
  tracks?: {
    href: string;
    items: SpotifyPlaylistTrackItem[];
    total: number;
  } | null;
}

export interface SpotifyDevice {
  id: string | null;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number | null;
}

export interface SpotifyRecentlyPlayedItem {
  track: SpotifyTrackSimple & { album: SpotifyAlbumSimple };
  played_at: string;
  context: {
    type: 'album' | 'playlist' | 'artist';
    uri: string;
  } | null;
}

export interface SpotifySearchResult {
  albums?: { items: (SpotifyAlbumSimple | null)[]; total: number };
  tracks?: { items: Array<(SpotifyTrackSimple & { album: SpotifyAlbumSimple }) | null>; total: number };
  artists?: { items: (SpotifyArtistSimple | null)[]; total: number };
  playlists?: { items: (SpotifyPlaylist | null)[]; total: number };
}

export interface SpotifySavedAlbum {
  added_at: string;
  album: SpotifyAlbumSimple;
}

export interface SpotifyPlaylistTracksPage {
  href: string;
  items: SpotifyPlaylistTrackItem[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}
