export type SonosRoom = {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  active: boolean;
  groupId: string | null;
  leader: boolean;
  available?: boolean;
  previousVolume?: number;
};
