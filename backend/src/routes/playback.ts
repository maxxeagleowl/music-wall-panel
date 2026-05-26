import { Router } from 'express';
import * as playbackService from '../services/playbackService';
import * as sonosService from '../services/sonosService';

const router = Router();

function isRealMode(): boolean {
  return sonosService.getDiagnostics().mode === 'real';
}

router.get('/now-playing', (_req, res) => {
  res.json(playbackService.getNowPlaying());
});

router.post('/play', async (_req, res) => {
  const real = isRealMode();
  console.log(`[Playback Route] action=play SONOS_MODE=${process.env.SONOS_MODE ?? 'unset'} adapterMode=${real ? 'real' : 'mock'}`);
  if (real) {
    try {
      await sonosService.play();
      res.json({ ok: true, mode: 'real', action: 'play' });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, mode: 'real', action: 'play', error });
    }
    return;
  }
  res.json(playbackService.play());
});

router.post('/pause', async (_req, res) => {
  const real = isRealMode();
  console.log(`[Playback Route] action=pause SONOS_MODE=${process.env.SONOS_MODE ?? 'unset'} adapterMode=${real ? 'real' : 'mock'}`);
  if (real) {
    try {
      await sonosService.pause();
      res.json({ ok: true, mode: 'real', action: 'pause' });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, mode: 'real', action: 'pause', error });
    }
    return;
  }
  res.json(playbackService.pause());
});

router.post('/next', async (_req, res) => {
  const real = isRealMode();
  console.log(`[Playback Route] action=next SONOS_MODE=${process.env.SONOS_MODE ?? 'unset'} adapterMode=${real ? 'real' : 'mock'}`);
  if (real) {
    try {
      await sonosService.next();
      res.json({ ok: true, mode: 'real', action: 'next' });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, mode: 'real', action: 'next', error });
    }
    return;
  }
  res.json(playbackService.next());
});

router.post('/previous', async (_req, res) => {
  const real = isRealMode();
  console.log(`[Playback Route] action=previous SONOS_MODE=${process.env.SONOS_MODE ?? 'unset'} adapterMode=${real ? 'real' : 'mock'}`);
  if (real) {
    try {
      await sonosService.previous();
      res.json({ ok: true, mode: 'real', action: 'previous' });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, mode: 'real', action: 'previous', error });
    }
    return;
  }
  res.json(playbackService.previous());
});

router.post('/play-album', (req, res) => {
  const { albumId } = req.body as { albumId?: string };
  if (!albumId) {
    res.status(400).json({ error: 'albumId required' });
    return;
  }
  res.json(playbackService.playAlbum(albumId));
});

router.post('/play-track', (req, res) => {
  const { albumId, trackIndex } = req.body as { albumId?: string; trackIndex?: number };
  if (!albumId || trackIndex === undefined) {
    res.status(400).json({ error: 'albumId and trackIndex required' });
    return;
  }
  res.json(playbackService.playTrack(albumId, trackIndex));
});

router.post('/seek', (req, res) => {
  const { position } = req.body as { position?: number };
  if (position === undefined) {
    res.status(400).json({ error: 'position required' });
    return;
  }
  res.json(playbackService.seek(position));
});

export default router;
