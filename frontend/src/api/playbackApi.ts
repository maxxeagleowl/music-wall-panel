import { get, post, del } from './client';
import type { QueueItem } from '../types/music';

export type { QueueItem };

export interface CurrentTrack {
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  progressSeconds: number;
  coverUrl: string | null;
  uri: string;
  contextType: 'playlist' | 'album' | 'track' | 'unknown';
  contextId: string;
  contextTitle: string;
  source: 'sonos' | 'mock';
}

export interface NowPlayingResponse {
  isPlaying: boolean;
  progress: number;
  totalDuration: number;
  currentAlbumId: string;
  currentTrackIndex: number;
  currentTrack: { title: string; duration: number } | null;
  current: CurrentTrack | null;
  queue: QueueItem[];
}

interface QueueResponse { queue: QueueItem[] }

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

export async function playQueueItem(trackIndex: number, albumId?: string): Promise<NowPlayingResponse | null> {
  const raw = await post<NowPlayingResponse | RealModeResponse>('/api/queue/play-index', { trackIndex, albumId });
  return isRealModeResponse(raw) ? null : raw;
}

// ── Queue API ─────────────────────────────────────────────────────────────────

export const getQueue = () => get<QueueResponse>('/api/queue');

export const addToQueue = (
  item: Omit<QueueItem, 'id' | 'source'>,
  mode: 'next' | 'append'
) => post<QueueResponse>('/api/queue/add', { ...item, mode });

export const removeQueueItem = (queueItemId: string) =>
  del<QueueResponse>(`/api/queue/${encodeURIComponent(queueItemId)}`);

export const reorderQueue = (itemId: string, newIndex: number) =>
  post<QueueResponse>('/api/queue/reorder', { itemId, newIndex });
