import { get } from './client';

export interface SpotifyStatus {
  connected: boolean;
  user: string | null;
}

export const getStatus = () => get<SpotifyStatus>('/api/spotify/status');
