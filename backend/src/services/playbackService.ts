import { albumRegistry } from '../data/albums';
import { mockState } from '../state/mockState';

export interface NowPlayingResponse {
  isPlaying: boolean;
  progress: number;
  totalDuration: number;
  currentAlbumId: string;
  currentTrackIndex: number;
  currentTrack: { title: string; duration: number } | null;
}

let timer: ReturnType<typeof setInterval> | null = null;

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

function tick(): void {
  const pb = mockState.playback;
  if (!pb.isPlaying) return;

  pb.progress += 1;

  if (pb.progress >= pb.totalDuration) {
    const tracks = albumRegistry[pb.currentAlbumId] ?? [];
    const nextIndex = pb.currentTrackIndex + 1;

    if (nextIndex >= tracks.length) {
      pb.isPlaying = false;
      pb.progress = 0;
      stopTimer();
    } else {
      pb.currentTrackIndex = nextIndex;
      pb.totalDuration = tracks[nextIndex].duration;
      pb.progress = 0;
    }
  }
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
  const pb = mockState.playback;
  const tracks = albumRegistry[pb.currentAlbumId] ?? [];
  const nextIndex = pb.currentTrackIndex + 1;

  if (nextIndex < tracks.length) {
    pb.currentTrackIndex = nextIndex;
    pb.totalDuration = tracks[nextIndex].duration;
  }
  pb.progress = 0;
  pb.isPlaying = true;
  startTimer();
  return buildResponse();
}

export function previous(): NowPlayingResponse {
  const pb = mockState.playback;
  const tracks = albumRegistry[pb.currentAlbumId] ?? [];
  const prevIndex = pb.currentTrackIndex - 1;

  if (prevIndex >= 0) {
    pb.currentTrackIndex = prevIndex;
    pb.totalDuration = tracks[prevIndex].duration;
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
