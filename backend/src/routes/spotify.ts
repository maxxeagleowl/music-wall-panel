import { Router, Request, Response } from 'express';
import * as spotifyAuthService from '../services/spotifyAuthService';
import * as spotifyService from '../services/spotifyService';

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

export default router;
