export interface SpotifyUser {
  id: string;
  displayName: string;
  email: string;
  imageUrl: string | null;
}

export interface SpotifySession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix ms
  user: SpotifyUser;
}

let session: SpotifySession | null = null;

export function getSession(): SpotifySession | null {
  return session;
}

export function setSession(s: SpotifySession): void {
  session = s;
}

export function clearSession(): void {
  session = null;
}

// Returns true if session exists and access token is not about to expire
export function isSessionValid(): boolean {
  if (!session) return false;
  const BUFFER_MS = 30_000;
  return Date.now() < session.expiresAt - BUFFER_MS;
}

export function hasSession(): boolean {
  return session !== null;
}
