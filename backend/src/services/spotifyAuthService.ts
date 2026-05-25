import * as crypto from 'crypto';
import {
  SpotifySession,
  getSession,
  setSession,
  clearSession,
  isSessionValid,
  hasSession,
} from '../state/spotifySession';

const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-library-read',
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'playlist-read-private',
].join(' ');

// CSRF state for pending OAuth flow
let pendingOAuthState: string | null = null;

function clientId(): string {
  const id = process.env.SPOTIFY_CLIENT_ID;
  if (!id) throw new Error('SPOTIFY_CLIENT_ID not set');
  return id;
}

function clientSecret(): string {
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!secret) throw new Error('SPOTIFY_CLIENT_SECRET not set');
  return secret;
}

function redirectUri(): string {
  const uri = process.env.SPOTIFY_REDIRECT_URI;
  if (!uri) throw new Error('SPOTIFY_REDIRECT_URI not set');
  return uri;
}

function basicAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${clientId()}:${clientSecret()}`).toString('base64');
}

export function getLoginUrl(): string {
  const state = crypto.randomBytes(16).toString('hex');
  pendingOAuthState = state;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId(),
    scope: SCOPES,
    redirect_uri: redirectUri(),
    state,
  });

  return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params}`;
}

export function validateOAuthState(state: string): boolean {
  if (!pendingOAuthState || pendingOAuthState !== state) return false;
  pendingOAuthState = null;
  return true;
}

export async function exchangeCode(code: string): Promise<void> {
  const tokenRes = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Spotify token exchange failed (${tokenRes.status}): ${body}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const userRes = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error(`Failed to fetch Spotify user profile (${userRes.status})`);
  }

  const userData = (await userRes.json()) as {
    id: string;
    display_name: string;
    email: string;
    images?: { url: string }[];
  };

  setSession({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    user: {
      id: userData.id,
      displayName: userData.display_name ?? userData.id,
      email: userData.email,
      imageUrl: userData.images?.[0]?.url ?? null,
    },
  });
}

async function doRefresh(): Promise<void> {
  const session = getSession();
  if (!session) throw new Error('No session to refresh');

  const tokenRes = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Spotify token refresh failed (${tokenRes.status}): ${body}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const updated: SpotifySession = {
    ...session,
    accessToken: tokenData.access_token,
    // Spotify may or may not return a new refresh_token
    refreshToken: tokenData.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  };

  setSession(updated);
}

// Returns a valid access token, refreshing if necessary. Throws if no session.
export async function getValidAccessToken(): Promise<string> {
  if (!hasSession()) throw new Error('Not authenticated with Spotify');
  if (!isSessionValid()) {
    await doRefresh();
  }
  const session = getSession();
  if (!session) throw new Error('Session lost after refresh');
  return session.accessToken;
}

export function logout(): void {
  clearSession();
}

export function getStatus(): {
  connected: boolean;
  user?: { displayName: string; email: string; imageUrl: string | null };
} {
  const session = getSession();
  if (!session) return { connected: false };
  return {
    connected: true,
    user: {
      displayName: session.user.displayName,
      email: session.user.email,
      imageUrl: session.user.imageUrl,
    },
  };
}
