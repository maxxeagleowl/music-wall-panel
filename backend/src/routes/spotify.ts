import { Router } from 'express';
import * as spotifyService from '../services/spotifyService';

const router = Router();

router.get('/status', (_req, res) => {
  res.json(spotifyService.getStatus());
});

export default router;
