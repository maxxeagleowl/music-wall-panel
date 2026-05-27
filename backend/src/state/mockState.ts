export interface Room {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  groupId: string | null;
}

export interface QueueItem {
  id: string;
  albumId: string;
  trackId: string;
  trackIndex: number;
  title: string;
  artist: string;
  albumTitle: string;
  durationSeconds: number;
  durationFormatted: string;
  coverUrl: string | null;
  source: 'queue' | 'album';
}

export interface PlaybackState {
  isPlaying: boolean;
  currentAlbumId: string;
  currentTrackIndex: number;
  progress: number;
  totalDuration: number;
}

export const mockState = {
  playback: {
    isPlaying: true,
    currentAlbumId: 'AN-01',
    currentTrackIndex: 0,
    progress: 0,
    totalDuration: 252,
  } as PlaybackState,

  queue: [] as QueueItem[],

  rooms: [
    { id: 'room-001', name: 'Wohnzimmer',   volume: 45, muted: false, groupId: 'group-001' },
    { id: 'room-002', name: 'Küche',         volume: 30, muted: false, groupId: 'group-001' },
    { id: 'room-003', name: 'Schlafzimmer', volume: 20, muted: true,  groupId: null },
    { id: 'room-004', name: 'Badezimmer',   volume: 35, muted: false, groupId: null },
  ] as Room[],

  spotify: {
    connected: false,
    user: null as string | null,
  },
};
