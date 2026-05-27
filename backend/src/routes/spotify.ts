import { Router, Request, Response } from 'express';
import * as spotifyAuthService from '../services/spotifyAuthService';
import * as spotifyService from '../services/spotifyService';
import { hasSession, isSessionValid, getSession } from '../state/spotifySession';

const router = Router();

// ── Auth status (existing) ────────────────────────────────────────────────────

router.get('/status', (_req: Request, res: Response) => {
  res.json(spotifyAuthService.getStatus());
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function requireAuth(res: Response): boolean {
  if (!spotifyAuthService.getStatus().connected) {
    res.status(401).json({ error: 'Not authenticated with Spotify', connected: false });
    return false;
  }
  return true;
}

async function handle<T>(
  res: Response,
  fn: () => Promise<T>,
  fallback: T,
): Promise<void> {
  try {
    const result = await fn();
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Spotify]', message);
    res.status(502).json({ error: 'Spotify request failed', detail: message, data: fallback });
  }
}

// ── Current user profile ──────────────────────────────────────────────────────

// GET /api/spotify/me
router.get('/me', async (_req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  await handle(res, () => spotifyService.getMe(), null);
});

// ── Albums ────────────────────────────────────────────────────────────────────

// GET /api/spotify/albums
router.get('/albums', async (_req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  await handle(res, () => spotifyService.getSavedAlbums(), []);
});

// GET /api/spotify/albums/:id
router.get('/albums/:id', async (req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'Album id required' });
    return;
  }
  await handle(res, () => spotifyService.getAlbum(id), null);
});

// ── Playlists ─────────────────────────────────────────────────────────────────

// GET /api/spotify/playlists
router.get('/playlists', async (_req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  await handle(res, () => spotifyService.getPlaylists(), []);
});

// GET /api/spotify/playlists/:id
router.get('/playlists/:id', async (req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: 'Playlist id required' });
    return;
  }
  await handle(res, () => spotifyService.getPlaylist(id), null);
});

// ── Recently played ───────────────────────────────────────────────────────────

// GET /api/spotify/recent
router.get('/recent', async (_req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  await handle(res, () => spotifyService.getRecentlyPlayed(), []);
});

// ── Search ────────────────────────────────────────────────────────────────────

// GET /api/spotify/search?q=...
router.get('/search', async (req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  const q = req.query['q'];
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    res.status(400).json({ error: 'Query parameter q is required' });
    return;
  }
  await handle(
    res,
    () => spotifyService.search(q),
    { albums: [], tracks: [], artists: [], playlists: [] },
  );
});

// ── Devices ───────────────────────────────────────────────────────────────────

// GET /api/spotify/devices
router.get('/devices', async (_req: Request, res: Response) => {
  if (!requireAuth(res)) return;
  await handle(res, () => spotifyService.getDevices(), []);
});

// ── Debug ─────────────────────────────────────────────────────────────────────

const SPOTIFY_API = 'https://api.spotify.com/v1';
const REQUIRED_SCOPES = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
];

async function probeSpotifyEndpoint(
  token: string,
  path: string,
): Promise<{ status: number; body: unknown }> {
  try {
    const r = await fetch(`${SPOTIFY_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status === 204) return { status: 204, body: null };
    const text = await r.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text || null; }
    return { status: r.status, body };
  } catch (err) {
    return { status: -1, body: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * GET /api/spotify/debug
 * Returns a full diagnostic snapshot of the Spotify session and player state.
 * Use this to diagnose why context resolution fails.
 */
router.get('/debug', async (_req: Request, res: Response) => {
  const sessionExists  = hasSession();
  const sessionValid   = isSessionValid();
  const session        = getSession();

  const auth = {
    connected:           sessionExists,
    tokenAvailable:      sessionExists,
    tokenExpired:        sessionExists && !sessionValid,
    expiresAt:           session ? new Date(session.expiresAt).toISOString() : null,
    expiresInSeconds:    session ? Math.round((session.expiresAt - Date.now()) / 1000) : null,
    refreshTokenPresent: session ? Boolean(session.refreshToken) : false,
    user:                session?.user?.displayName ?? null,
    requiredScopes:      REQUIRED_SCOPES,
    note:                'Scopes are granted at login — if any are missing, logout and re-login at /api/auth/spotify/login',
  };

  if (!sessionExists) {
    return res.json({ auth, refreshAttempt: null, player: null, currentlyPlaying: null });
  }

  // ── Token: attempt to get a valid token (refreshes if expired) ───────────────
  let token: string | null = null;
  let refreshAttempt: { attempted: boolean; success: boolean; error: string | null } | null = null;

  if (!sessionValid) {
    refreshAttempt = { attempted: true, success: false, error: null };
    try {
      await spotifyAuthService.forceRefreshToken();
      token = getSession()?.accessToken ?? null;
      refreshAttempt.success = token !== null;
    } catch (err) {
      refreshAttempt.error = err instanceof Error ? err.message : String(err);
    }
  } else {
    refreshAttempt = { attempted: false, success: false, error: null };
    token = session?.accessToken ?? null;
  }

  if (!token) {
    return res.json({ auth, refreshAttempt, player: null, currentlyPlaying: null });
  }

  // ── Live API probes ──────────────────────────────────────────────────────────
  const [player, currentlyPlaying] = await Promise.all([
    probeSpotifyEndpoint(token, '/me/player?additional_types=track'),
    probeSpotifyEndpoint(token, '/me/player/currently-playing?additional_types=track'),
  ]);

  return res.json({ auth, refreshAttempt, player, currentlyPlaying });
});

export default router;
