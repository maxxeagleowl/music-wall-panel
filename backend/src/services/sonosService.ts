import { getSonosAdapter } from './sonos/sonosAdapter';
import type { SonosDiagnostics, SonosRoom } from './sonos/sonosTypes';

export type { SonosRoom, SonosDiagnostics };

export function getRooms(): Promise<SonosRoom[]> {
  return getSonosAdapter().getRooms();
}

export function setVolume(id: string, volume: number): Promise<SonosRoom | null> {
  return getSonosAdapter().setVolume(id, volume);
}

export function setMute(id: string, muted: boolean): Promise<SonosRoom | null> {
  return getSonosAdapter().setMute(id, muted);
}

export function setGroup(id: string, groupId: string | null): Promise<SonosRoom | null> {
  return getSonosAdapter().setGroup(id, groupId);
}

export function play(): Promise<void> {
  return getSonosAdapter().play();
}

export function pause(): Promise<void> {
  return getSonosAdapter().pause();
}

export function next(): Promise<void> {
  return getSonosAdapter().next();
}

export function previous(): Promise<void> {
  return getSonosAdapter().previous();
}

export function getDiagnostics(): SonosDiagnostics {
  return getSonosAdapter().getDiagnostics();
}
