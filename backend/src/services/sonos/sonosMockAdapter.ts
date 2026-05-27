import type { SonosAdapter, SonosDiagnostics, SonosRoom, SonosQueueItem, SonosPositionInfo, SonosMediaContext } from './sonosTypes';

const INITIAL_ROOMS: SonosRoom[] = [
  { id: 'room-001', name: 'Wohnzimmer',   volume: 45, muted: false, groupId: 'group-001', available: true },
  { id: 'room-002', name: 'Küche',         volume: 30, muted: false, groupId: 'group-001', available: true },
  { id: 'room-003', name: 'Schlafzimmer', volume: 20, muted: true,  groupId: null,         available: true },
  { id: 'room-004', name: 'Badezimmer',   volume: 35, muted: false, groupId: null,         available: true },
];

export class SonosMockAdapter implements SonosAdapter {
  private rooms: SonosRoom[] = INITIAL_ROOMS.map(r => ({ ...r }));

  async initialize(): Promise<void> {
    console.log('[Sonos] Mode: mock — simulated rooms active');
  }

  async rediscover(): Promise<void> { /* mock — no-op */ }

  async getRooms(): Promise<SonosRoom[]> {
    return this.rooms;
  }

  async setVolume(id: string, volume: number): Promise<SonosRoom | null> {
    const room = this.rooms.find(r => r.id === id);
    if (!room) return null;
    room.volume = Math.max(0, Math.min(100, volume));
    return { ...room };
  }

  async setMute(id: string, muted: boolean): Promise<SonosRoom | null> {
    const room = this.rooms.find(r => r.id === id);
    if (!room) return null;
    room.muted = muted;
    return { ...room };
  }

  async setGroup(id: string, groupId: string | null): Promise<SonosRoom | null> {
    const room = this.rooms.find(r => r.id === id);
    if (!room) return null;
    room.groupId = groupId;
    return { ...room };
  }

  async play(): Promise<void> { /* mock — no-op */ }
  async pause(): Promise<void> { /* mock — no-op */ }
  async next(): Promise<void> { /* mock — no-op */ }
  async previous(): Promise<void> { /* mock — no-op */ }
  async seekToTrackNr(_trackNr: number): Promise<void> { /* mock — no-op */ }
  async seekPosition(_seconds: number): Promise<void> { /* mock — no-op */ }

  async getQueue(): Promise<SonosQueueItem[]> {
    // Mock queue comes from mockState — real queue read handled by playbackService
    return [];
  }

  async getPositionInfo(): Promise<SonosPositionInfo> {
    // Mock progress is tracked by playbackService timer, not the adapter
    return {
      trackNumber: 0,
      trackDurationSeconds: 0,
      progressSeconds: 0,
      trackUri: '',
      trackTitle: '',
      trackArtist: '',
      trackAlbum: '',
      trackCoverUrl: null,
    };
  }

  async getTransportInfo(): Promise<{ isPlaying: boolean }> {
    return { isPlaying: false };
  }

  async getMediaInfo(): Promise<SonosMediaContext> {
    return { contextType: 'unknown', contextId: '', contextUri: '', contextTitle: '' };
  }

  getDiagnostics(): SonosDiagnostics {
    return {
      mode: 'mock',
      discoveredDevices: [],
      mappedRooms: this.rooms.map(r => r.name),
      unavailableRooms: [],
      lastError: null,
    };
  }
}
