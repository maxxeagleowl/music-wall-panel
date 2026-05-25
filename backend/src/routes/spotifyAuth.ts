import { Router, Request, Response } from 'express';
import * as spotifyAuthService from '../services/spotifyAuthService';

const router = Router();

// GET /api/auth/spotify/login
// Redirects the browser to Spotify's OAuth consent screen
router.get('/login', (_req: Request, res: Response) => {
  const loginUrl = spotifyAuthService.getLoginUrl();
  res.redirect(loginUrl);
});

// GET /api/auth/spotify/callback
// Spotify redirects here after user grants access
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('[SpotifyAuth] OAuth error from Spotify:', error);
    return res.status(400).json({ error: `Spotify denied access: ${error}` });
  }

  if (!state || typeof state !== 'string' || !spotifyAuthService.validateOAuthState(state)) {
    return res.status(400).json({ error: 'Invalid or missing OAuth state' });
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    await spotifyAuthService.exchangeCode(code);
    const status = spotifyAuthService.getStatus();
    console.log(`[SpotifyAuth] Authenticated as: ${status.user?.displayName}`);
    // Redirect to frontend root after successful login
    res.redirect('/');
  } catch (err) {
    console.error('[SpotifyAuth] Callback error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/spotify/status
// Returns whether the backend has an active Spotify session
router.get('/status', (_req: Request, res: Response) => {
  res.json(spotifyAuthService.getStatus());
});

// POST /api/auth/spotify/logout
// Clears the in-memory Spotify session
router.post('/logout', (_req: Request, res: Response) => {
  spotifyAuthService.logout();
  console.log('[SpotifyAuth] Session cleared');
  res.json({ success: true });
});

export default router;
