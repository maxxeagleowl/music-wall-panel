import { Router } from 'express';
import * as playbackService from '../services/playbackService';
import * as sonosService from '../services/sonosService';

const router = Router();

// Fire-and-forget Sonos transport — never blocks the response
function sonosTransport(fn: () => Promise<void>): void {
  fn().catch((err: unknown) => {
    console.warn('[Sonos] transport command failed:', err instanceof Error ? err.message : err);
  });
}

router.get('/now-playing', (_req, res) => {
  res.json(playbackService.getNowPlaying());
});

router.post('/play', (_req, res) => {
  sonosTransport(() => sonosService.play());
  res.json(playbackService.play());
});

router.post('/pause', (_req, res) => {
  sonosTransport(() => sonosService.pause());
  res.json(playbackService.pause());
});

router.post('/next', (_req, res) => {
  sonosTransport(() => sonosService.next());
  res.json(playbackService.next());
});

router.post('/previous', (_req, res) => {
  sonosTransport(() => sonosService.previous());
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
