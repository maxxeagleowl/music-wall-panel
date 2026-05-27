import { getSonosAdapter } from './sonos/sonosAdapter';
import type { SonosDiagnostics, SonosRoom, SonosQueueItem, SonosPositionInfo, SonosMediaContext } from './sonos/sonosTypes';

export type { SonosRoom, SonosDiagnostics, SonosQueueItem, SonosPositionInfo, SonosMediaContext };

export function rediscover(): Promise<void> {
  return getSonosAdapter().rediscover();
}

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

export function getQueue(): Promise<SonosQueueItem[]> {
  return getSonosAdapter().getQueue();
}

export function getPositionInfo(): Promise<SonosPositionInfo> {
  return getSonosAdapter().getPositionInfo();
}

export function getMediaInfo(): Promise<SonosMediaContext> {
  return getSonosAdapter().getMediaInfo();
}

export function getTransportInfo(): Promise<{ isPlaying: boolean }> {
  return getSonosAdapter().getTransportInfo();
}
