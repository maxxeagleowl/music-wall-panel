import { get, post } from './client';

export interface NowPlayingResponse {
  isPlaying: boolean;
  progress: number;
  totalDuration: number;
  currentAlbumId: string;
  currentTrackIndex: number;
  currentTrack: { title: string; duration: number } | null;
}

export const getNowPlaying = () => get<NowPlayingResponse>('/api/now-playing');
export const play          = () => post<NowPlayingResponse>('/api/play');
export const pause         = () => post<NowPlayingResponse>('/api/pause');
export const next          = () => post<NowPlayingResponse>('/api/next');
export const previous      = () => post<NowPlayingResponse>('/api/previous');
export const playAlbum     = (albumId: string) =>
  post<NowPlayingResponse>('/api/play-album', { albumId });
export const playTrack     = (albumId: string, trackIndex: number) =>
  post<NowPlayingResponse>('/api/play-track', { albumId, trackIndex });
export const seek          = (position: number) =>
  post<NowPlayingResponse>('/api/seek', { position });
