import { get, post } from './client';

export interface NowPlayingResponse {
  isPlaying: boolean;
  progress: number;
  totalDuration: number;
  currentAlbumId: string;
  currentTrackIndex: number;
  currentTrack: { title: string; duration: number } | null;
}

interface RealModeResponse { ok: boolean; mode: string; action: string; error?: string }

function isRealModeResponse(r: NowPlayingResponse | RealModeResponse): r is RealModeResponse {
  return 'ok' in r;
}

async function transport(path: string): Promise<NowPlayingResponse | null> {
  const raw = await post<NowPlayingResponse | RealModeResponse>(path);
  return isRealModeResponse(raw) ? null : raw;
}

export const getNowPlaying = () => get<NowPlayingResponse>('/api/now-playing');
export const play          = () => transport('/api/play');
export const pause         = () => transport('/api/pause');
export const next          = () => transport('/api/next');
export const previous      = () => transport('/api/previous');
export const playAlbum     = (albumId: string) =>
  post<NowPlayingResponse>('/api/play-album', { albumId });
export const playTrack     = (albumId: string, trackIndex: number) =>
  post<NowPlayingResponse>('/api/play-track', { albumId, trackIndex });
export const seek          = (position: number) =>
  post<NowPlayingResponse>('/api/seek', { position });
