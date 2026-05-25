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
  tracks: { total: number };
  owner: { display_name: string | null };
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
}

export interface SpotifySearchResult {
  albums?: { items: SpotifyAlbumSimple[]; total: number };
  tracks?: { items: Array<SpotifyTrackSimple & { album: SpotifyAlbumSimple }>; total: number };
  artists?: { items: SpotifyArtistSimple[]; total: number };
  playlists?: { items: SpotifyPlaylist[]; total: number };
}

export interface SpotifySavedAlbum {
  added_at: string;
  album: SpotifyAlbumSimple;
}
