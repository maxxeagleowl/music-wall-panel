export interface SpotifyStatus {
  connected: boolean;
  user?: {
    displayName: string;
    email: string;
    imageUrl: string | null;
  };
}

export async function getSpotifyStatus(): Promise<SpotifyStatus> {
  try {
    const res = await fetch('/api/auth/spotify/status');
    if (!res.ok) return { connected: false };
    return res.json() as Promise<SpotifyStatus>;
  } catch {
    return { connected: false };
  }
}

export async function spotifyLogout(): Promise<void> {
  await fetch('/api/auth/spotify/logout', { method: 'POST' });
}
