import { Router } from 'express';
import * as sonosService from '../services/sonosService';

const router = Router();

router.get('/rooms', async (_req, res) => {
  try {
    res.json(await sonosService.getRooms());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to get rooms', detail: msg });
  }
});

router.post('/rooms/:id/volume', async (req, res) => {
  const { volume } = req.body as { volume: unknown };
  if (typeof volume !== 'number') {
    res.status(400).json({ error: 'volume must be a number' });
    return;
  }
  try {
    const room = await sonosService.setVolume(req.params.id, volume);
    if (!room) { res.status(404).json({ error: 'room not found' }); return; }
    res.json(room);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'setVolume failed', detail: msg });
  }
});

router.post('/rooms/:id/mute', async (req, res) => {
  const { muted } = req.body as { muted: unknown };
  if (typeof muted !== 'boolean') {
    res.status(400).json({ error: 'muted must be a boolean' });
    return;
  }
  try {
    const room = await sonosService.setMute(req.params.id, muted);
    if (!room) { res.status(404).json({ error: 'room not found' }); return; }
    res.json(room);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'setMute failed', detail: msg });
  }
});

router.post('/rooms/:id/group', async (req, res) => {
  const { groupId } = req.body as { groupId: unknown };
  try {
    const room = await sonosService.setGroup(
      req.params.id,
      typeof groupId === 'string' ? groupId : null,
    );
    if (!room) { res.status(404).json({ error: 'room not found' }); return; }
    res.json(room);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'setGroup failed', detail: msg });
  }
});

router.get('/diagnostics', (_req, res) => {
  try {
    res.json(sonosService.getDiagnostics());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'diagnostics unavailable', detail: msg });
  }
});

export default router;
