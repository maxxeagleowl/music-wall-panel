import { albumRegistry } from '../data/albums';
import { mockState } from '../state/mockState';
import type { QueueItem } from '../state/mockState';

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

let timer: ReturnType<typeof setInterval> | null = null;
let queueCounter = 0;

function generateQueueId(): string {
  return `q-${Date.now()}-${++queueCounter}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function stopTimer(): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function startTimer(): void {
  stopTimer();
  timer = setInterval(tick, 1000);
}

// Advances to next item: checks explicit queue first, then album continuation.
// Does NOT manage the timer — callers are responsible.
function advanceToNext(): void {
  const pb = mockState.playback;

  if (mockState.queue.length > 0) {
    const item = mockState.queue.shift()!;
    pb.currentAlbumId = item.albumId;
    pb.currentTrackIndex = item.trackIndex;
    pb.totalDuration = item.durationSeconds;
    pb.progress = 0;
    pb.isPlaying = true;
    return;
  }

  const tracks = albumRegistry[pb.currentAlbumId] ?? [];
  const nextIndex = pb.currentTrackIndex + 1;
  if (nextIndex < tracks.length) {
    pb.currentTrackIndex = nextIndex;
    pb.totalDuration = tracks[nextIndex]!.duration;
    pb.progress = 0;
    pb.isPlaying = true;
  } else {
    pb.isPlaying = false;
    pb.progress = 0;
  }
}

function tick(): void {
  const pb = mockState.playback;
  if (!pb.isPlaying) return;

  pb.progress += 1;

  if (pb.progress >= pb.totalDuration) {
    advanceToNext();
    if (!pb.isPlaying) {
      stopTimer();
    }
    // If still playing (advanced to queue item or next album track), timer keeps running
  }
}

// Unified queue for NowPlaying display: explicit items + upcoming album tracks.
function buildQueue(): QueueItem[] {
  const pb = mockState.playback;
  const result: QueueItem[] = [...mockState.queue];

  // Append upcoming album tracks for mock albums (backend knows their track list)
  const tracks = albumRegistry[pb.currentAlbumId];
  if (tracks) {
    for (let i = pb.currentTrackIndex + 1; i < tracks.length; i++) {
      const t = tracks[i]!;
      result.push({
        id: `album-${pb.currentAlbumId}-${i}`,
        albumId: pb.currentAlbumId,
        trackId: `${pb.currentAlbumId}-t${i + 1}`,
        trackIndex: i,
        title: t.title,
        artist: '',
        albumTitle: '',
        durationSeconds: t.duration,
        durationFormatted: formatDuration(t.duration),
        coverUrl: null,
        source: 'album',
      });
    }
  }

  return result;
}

function buildResponse(): NowPlayingResponse {
  const pb = mockState.playback;
  const tracks = albumRegistry[pb.currentAlbumId] ?? [];
  const track = tracks[pb.currentTrackIndex] ?? null;
  return {
    isPlaying: pb.isPlaying,
    progress: pb.progress,
    totalDuration: pb.totalDuration,
    currentAlbumId: pb.currentAlbumId,
    currentTrackIndex: pb.currentTrackIndex,
    currentTrack: track ? { title: track.title, duration: track.duration } : null,
    current: null,
    queue: buildQueue(),
  };
}

// Start simulation on module load (initial state is isPlaying: true)
startTimer();

export function getNowPlaying(): NowPlayingResponse {
  return buildResponse();
}

export function play(): NowPlayingResponse {
  mockState.playback.isPlaying = true;
  startTimer();
  return buildResponse();
}

export function pause(): NowPlayingResponse {
  mockState.playback.isPlaying = false;
  stopTimer();
  return buildResponse();
}

export function next(): NowPlayingResponse {
  advanceToNext();
  if (mockState.playback.isPlaying) {
    startTimer();
  } else {
    stopTimer();
  }
  return buildResponse();
}

export function previous(): NowPlayingResponse {
  const pb = mockState.playback;
  const tracks = albumRegistry[pb.currentAlbumId] ?? [];
  const prevIndex = pb.currentTrackIndex - 1;

  if (prevIndex >= 0) {
    pb.currentTrackIndex = prevIndex;
    pb.totalDuration = tracks[prevIndex]!.duration;
  }
  pb.progress = 0;
  pb.isPlaying = true;
  startTimer();
  return buildResponse();
}

export function playAlbum(albumId: string): NowPlayingResponse {
  const pb = mockState.playback;
  const tracks = albumRegistry[albumId] ?? [];
  pb.currentAlbumId = albumId;
  pb.currentTrackIndex = 0;
  pb.totalDuration = tracks[0]?.duration ?? 0;
  pb.progress = 0;
  pb.isPlaying = true;
  mockState.queue = [];
  startTimer();
  return buildResponse();
}

export function playTrack(albumId: string, trackIndex: number): NowPlayingResponse {
  const pb = mockState.playback;
  const tracks = albumRegistry[albumId] ?? [];
  const clampedIndex = Math.max(0, Math.min(trackIndex, tracks.length - 1));
  pb.currentAlbumId = albumId;
  pb.currentTrackIndex = clampedIndex;
  pb.totalDuration = tracks[clampedIndex]?.duration ?? 0;
  pb.progress = 0;
  pb.isPlaying = true;
  startTimer();
  return buildResponse();
}

export function seek(position: number): NowPlayingResponse {
  const pb = mockState.playback;
  pb.progress = Math.max(0, Math.min(position, pb.totalDuration));
  return buildResponse();
}

// ── Queue management ──────────────────────────────────────────────────────────

export function getQueue(): QueueItem[] {
  return [...mockState.queue];
}

export function addToQueue(
  item: Omit<QueueItem, 'id' | 'source'>,
  mode: 'next' | 'append'
): QueueItem[] {
  const newItem: QueueItem = { ...item, id: generateQueueId(), source: 'queue' };
  if (mode === 'next') {
    mockState.queue.unshift(newItem);
  } else {
    mockState.queue.push(newItem);
  }
  return [...mockState.queue];
}

export function removeFromQueue(queueItemId: string): QueueItem[] {
  mockState.queue = mockState.queue.filter((item) => item.id !== queueItemId);
  return [...mockState.queue];
}

export function reorderQueue(itemId: string, newIndex: number): QueueItem[] {
  const currentIndex = mockState.queue.findIndex((item) => item.id === itemId);
  if (currentIndex === -1) return [...mockState.queue];
  const [item] = mockState.queue.splice(currentIndex, 1);
  const clampedIndex = Math.max(0, Math.min(newIndex, mockState.queue.length));
  mockState.queue.splice(clampedIndex, 0, item!);
  return [...mockState.queue];
}
