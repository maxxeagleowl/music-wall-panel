import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import healthRouter from './routes/health';
import playbackRouter from './routes/playback';
import sonosRouter from './routes/sonos';
import spotifyRouter from './routes/spotify';
import spotifyAuthRouter from './routes/spotifyAuth';
import { initializeSonos } from './services/sonos/sonosAdapter';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api', playbackRouter);
app.use('/api/sonos', sonosRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/auth/spotify', spotifyAuthRouter);

async function main(): Promise<void> {
  await initializeSonos();
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('[Startup] Fatal error:', err);
  process.exit(1);
});

export default app;
