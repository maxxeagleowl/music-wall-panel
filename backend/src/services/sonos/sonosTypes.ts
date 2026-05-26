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

export interface SonosAdapter {
  initialize(): Promise<void>;
  getRooms(): Promise<SonosRoom[]>;
  setVolume(id: string, volume: number): Promise<SonosRoom | null>;
  setMute(id: string, muted: boolean): Promise<SonosRoom | null>;
  setGroup(id: string, groupId: string | null): Promise<SonosRoom | null>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  getDiagnostics(): SonosDiagnostics;
}
