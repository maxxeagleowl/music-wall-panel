import { mockState, Room } from '../state/mockState';

export function getRooms(): Room[] {
  return mockState.rooms;
}

export function setVolume(id: string, volume: number): Room | null {
  const room = mockState.rooms.find(r => r.id === id);
  if (!room) return null;
  room.volume = Math.max(0, Math.min(100, volume));
  return room;
}

export function setMute(id: string, muted: boolean): Room | null {
  const room = mockState.rooms.find(r => r.id === id);
  if (!room) return null;
  room.muted = muted;
  return room;
}

export function setGroup(id: string, groupId: string | null): Room | null {
  const room = mockState.rooms.find(r => r.id === id);
  if (!room) return null;
  room.groupId = groupId;
  return room;
}
