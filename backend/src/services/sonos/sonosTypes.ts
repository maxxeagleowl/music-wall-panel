export interface SonosRoom {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  groupId: string | null;
  available: boolean;
}

export interface DiscoveredDevice {
  name: string;
  ip: string;
  model: string;
}

export interface SonosDiagnostics {
  mode: 'mock' | 'real';
  discoveredDevices: DiscoveredDevice[];
  mappedRooms: string[];
  unavailableRooms: string[];
  lastError: string | null;
}

export interface SonosQueueItem {
  id: string;
  trackIndex: number;
  title: string;
  artist: string;
  albumTitle: string;
  durationSeconds: number;
  durationFormatted: string;
  coverUrl: string | null;
  uri: string;
}

export interface SonosPositionInfo {
  trackNumber: number;          // 1-based Sonos queue position (0 = unavailable)
  trackDurationSeconds: number;
  progressSeconds: number;
  trackUri: string;
  trackTitle: string;
  trackArtist: string;
  trackAlbum: string;
  trackCoverUrl: string | null;
}

export interface SonosMediaContext {
  contextType: 'playlist' | 'album' | 'track' | 'unknown';
  contextId: string;
  contextUri: string;
  contextTitle: string;
}

export interface SonosAdapter {
  initialize(): Promise<void>;
  rediscover(): Promise<void>;
  getRooms(): Promise<SonosRoom[]>;
  setVolume(id: string, volume: number): Promise<SonosRoom | null>;
  setMute(id: string, muted: boolean): Promise<SonosRoom | null>;
  setGroup(id: string, groupId: string | null): Promise<SonosRoom | null>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  getDiagnostics(): SonosDiagnostics;
  seekToTrackNr(trackNr: number): Promise<void>;
  getQueue(): Promise<SonosQueueItem[]>;
  getPositionInfo(): Promise<SonosPositionInfo>;
  getMediaInfo(): Promise<SonosMediaContext>;
  getTransportInfo(): Promise<{ isPlaying: boolean }>;
}
