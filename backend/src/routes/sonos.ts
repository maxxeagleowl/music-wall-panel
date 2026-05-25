import { Router } from 'express';
import * as sonosService from '../services/sonosService';

const router = Router();

router.get('/rooms', (_req, res) => {
  res.json(sonosService.getRooms());
});

router.post('/rooms/:id/volume', (req, res) => {
  const { volume } = req.body as { volume: unknown };
  if (typeof volume !== 'number') {
    res.status(400).json({ error: 'volume must be a number' });
    return;
  }
  const room = sonosService.setVolume(req.params.id, volume);
  if (!room) { res.status(404).json({ error: 'room not found' }); return; }
  res.json(room);
});

router.post('/rooms/:id/mute', (req, res) => {
  const { muted } = req.body as { muted: unknown };
  if (typeof muted !== 'boolean') {
    res.status(400).json({ error: 'muted must be a boolean' });
    return;
  }
  const room = sonosService.setMute(req.params.id, muted);
  if (!room) { res.status(404).json({ error: 'room not found' }); return; }
  res.json(room);
});

router.post('/rooms/:id/group', (req, res) => {
  const { groupId } = req.body as { groupId: unknown };
  const room = sonosService.setGroup(
    req.params.id,
    typeof groupId === 'string' ? groupId : null,
  );
  if (!room) { res.status(404).json({ error: 'room not found' }); return; }
  res.json(room);
});

export default router;
