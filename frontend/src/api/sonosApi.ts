import { get, post } from './client';

export interface BackendRoom {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  groupId: string | null;
}

export const getRooms  = () => get<BackendRoom[]>('/api/sonos/rooms');
export const setVolume = (id: string, volume: number) =>
  post<BackendRoom>(`/api/sonos/rooms/${id}/volume`, { volume });
export const setMute   = (id: string, muted: boolean) =>
  post<BackendRoom>(`/api/sonos/rooms/${id}/mute`, { muted });
export const setGroup  = (id: string, groupId: string | null) =>
  post<BackendRoom>(`/api/sonos/rooms/${id}/group`, { groupId });
