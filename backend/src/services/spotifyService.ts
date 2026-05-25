import { mockState } from '../state/mockState';

export function getStatus(): { connected: boolean; user: string | null } {
  return mockState.spotify;
}
