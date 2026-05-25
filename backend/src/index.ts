import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import healthRouter from './routes/health';
import playbackRouter from './routes/playback';
import sonosRouter from './routes/sonos';
import spotifyRouter from './routes/spotify';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api', playbackRouter);
app.use('/api/sonos', sonosRouter);
app.use('/api/spotify', spotifyRouter);

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

export default app;
