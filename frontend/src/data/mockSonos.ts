import type { SonosRoom } from '../types/sonos';

export const mockRooms: SonosRoom[] = [
  {
    id: 'living-room',
    name: 'Wohnzimmer',
    volume: 42,
    muted: false,
    active: true,
    groupId: 'main',
    leader: true
  },
  {
    id: 'kitchen',
    name: 'Kueche',
    volume: 33,
    muted: false,
    active: true,
    groupId: 'main',
    leader: false
  },
  {
    id: 'bathroom',
    name: 'Badezimmer',
    volume: 21,
    muted: true,
    active: false,
    groupId: null,
    leader: false
  },
  {
    id: 'master-bedroom',
    name: 'Schlafzimmer',
    volume: 18,
    muted: false,
    active: false,
    groupId: 'sleep',
    leader: true
  }
];
