import { useEffect, useState } from 'react';
import * as spotifyApi from '../api/spotifyApi';
import type { Album, Playlist, RecentTrack, SpotifyDevice } from '../types/music';

export interface SpotifyLibraryState {
  albums: Album[];
  playlists: Playlist[];
  recentTracks: RecentTrack[];
  devices: SpotifyDevice[];
  loading: boolean;
  error: string | null;
}

const INITIAL: SpotifyLibraryState = {
  albums: [],
  playlists: [],
  recentTracks: [],
  devices: [],
  loading: false,
  error: null,
};

export function useSpotifyLibrary(connected: boolean): SpotifyLibraryState {
  const [state, setState] = useState<SpotifyLibraryState>(INITIAL);

  useEffect(() => {
    if (!connected) {
      setState(INITIAL);
      return;
    }

    let cancelled = false;

    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      spotifyApi.getAlbums(),
      spotifyApi.getPlaylists(),
      spotifyApi.getRecentlyPlayed(),
      spotifyApi.getDevices(),
    ])
      .then(([albums, playlists, recentTracks, devices]) => {
        if (cancelled) return;
        setState({ albums, playlists, recentTracks, devices, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load Spotify library';
        setState((s) => ({ ...s, loading: false, error: message }));
      });

    return () => {
      cancelled = true;
    };
  }, [connected]);

  return state;
}
