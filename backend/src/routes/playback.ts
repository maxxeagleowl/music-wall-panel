import { Router } from 'express';
import * as playbackService from '../services/playbackService';
import type { QueueItem, CurrentTrack } from '../services/playbackService';
import * as sonosService from '../services/sonosService';
import type { SonosQueueItem } from '../services/sonosService';
import * as spotifyService from '../services/spotifyService';
import { albumRegistry } from '../data/albums';

const router = Router();

let lastLoggedTrackUri = '';

// Spotify playback context cache — avoids hitting the API on every 1s poll
const SPOTIFY_CTX_TTL = 5_000;
let spotifyCtxCache: { type: string; uri: string; trackId: string | null } | null = null;
let spotifyCtxFetchedAt = 0;
let spotifyCtxPending = false;

async function getSpotifyContext(): Promise<{ type: string; uri: string; trackId: string | null } | null> {
  const now = Date.now();
  if (now - spotifyCtxFetchedAt < SPOTIFY_CTX_TTL) return spotifyCtxCache;
  if (spotifyCtxPending) return spotifyCtxCache;
  spotifyCtxPending = true;
  try {
    spotifyCtxCache = await spotifyService.getCurrentPlaybackContext();
    spotifyCtxFetchedAt = Date.now();
  } catch {
    // Spotify not connected or rate limited — keep old cache
  } finally {
    spotifyCtxPending = false;
  }
  return spotifyCtxCache;
}

function isRealMode(): boolean {
  return sonosService.getDiagnostics().mode === 'real';
}

// Map Sonos queue items to the frontend QueueItem shape.
function mapSonosQueue(items: SonosQueueItem[]): QueueItem[] {
  return items.map((item) => ({
    id: item.id,
    albumId: item.uri,
    trackId: item.uri,
    trackIndex: item.trackIndex,
    title: item.title,
    artist: item.artist,
    albumTitle: item.albumTitle,
    durationSeconds: item.durationSeconds,
    durationFormatted: item.durationFormatted,
    coverUrl: item.coverUrl,
    source: 'album' as const,
  }));
}

// Read Sonos queue + position together and return position-aligned upcoming items.
// Both getQueue() and getPositionInfo() fire in parallel for minimum latency.
async function getSonosAlignedState(): Promise<{
  progress: number;
  totalDuration: number;
  upcomingQueue: QueueItem[];
  current: CurrentTrack | null;
  isPlaying: boolean;
}> {
  const [sonosItems, posInfo, mediaInfo, transportInfo] = await Promise.all([
    sonosService.getQueue(),
    sonosService.getPositionInfo(),
    sonosService.getMediaInfo(),
    sonosService.getTransportInfo(),
  ]);

  // Resolve current position in queue.
  // Primary: Sonos Track (1-based) → convert to 0-based index.
  // Fallback: match TrackURI against queue item URIs (strip query params for Spotify URIs).
  let currentIndex = -1;

  if (posInfo.trackNumber > 0 && posInfo.trackNumber <= sonosItems.length) {
    currentIndex = posInfo.trackNumber - 1;
  } else if (posInfo.trackUri) {
    const baseUri = posInfo.trackUri.split('?')[0] ?? posInfo.trackUri;
    currentIndex = sonosItems.findIndex((item) => {
      const itemBase = item.uri.split('?')[0] ?? item.uri;
      return itemBase === baseUri;
    });
    if (currentIndex === -1) {
      console.warn(
        `[Queue] Cannot resolve Sonos queue index by URI — ` +
        `trackNumber=${posInfo.trackNumber} uri="${posInfo.trackUri.slice(0, 80)}" ` +
        `returning full queue`,
      );
    }
  } else {
    if (sonosItems.length > 0) {
      console.warn(
        `[Queue] GetPositionInfo returned no track info (trackNumber=${posInfo.trackNumber}) — returning full queue`,
      );
    }
  }

  // Only show items AFTER the current track (upcoming queue).
  const upcoming = currentIndex >= 0 ? sonosItems.slice(currentIndex + 1) : sonosItems;

  console.log(
    `[Queue] source=sonos totalItems=${sonosItems.length} currentIndex=${currentIndex} upcomingItems=${upcoming.length}`,
  );

  // When Sonos plays from its local queue (x-rincon-queue:), the playlist URI
  // is not available from GetMediaInfo. Use Spotify /me/player as fallback.
  let resolvedContextType = mediaInfo.contextType;
  let resolvedContextId   = mediaInfo.contextId;
  let resolvedContextTitle = mediaInfo.contextTitle;

  if (!resolvedContextId && posInfo.trackUri) {
    // Extract Spotify track ID from the Sonos playback URI.
    // Sonos encodes it as: x-sonos-spotify:spotify:track:TRACKID?sid=...
    const sonosTrackIdMatch = posInfo.trackUri.match(/spotify:track:([A-Za-z0-9]+)/);
    const sonosTrackId = sonosTrackIdMatch?.[1] ?? null;

    const spotifyCtx = await getSpotifyContext();
    // Only trust Spotify context if the track Spotify reports matches what Sonos is playing.
    // This ensures we're not using stale context from a different device (e.g. the user's phone).
    if (
      sonosTrackId &&
      spotifyCtx?.trackId === sonosTrackId &&
      spotifyCtx.type === 'playlist' &&
      spotifyCtx.uri.includes('spotify:playlist:')
    ) {
      const after = spotifyCtx.uri.split('spotify:playlist:')[1] ?? '';
      resolvedContextId    = after.split(/[?&#\s]/)[0] ?? '';
      resolvedContextType  = 'playlist';
      resolvedContextTitle = '';
    }
  }

  const current: CurrentTrack | null = posInfo.trackUri
    ? {
        title: posInfo.trackTitle,
        artist: posInfo.trackArtist,
        album: posInfo.trackAlbum,
        durationSeconds: posInfo.trackDurationSeconds,
        progressSeconds: posInfo.progressSeconds,
        coverUrl: posInfo.trackCoverUrl,
        uri: posInfo.trackUri,
        contextType: resolvedContextType,
        contextId: resolvedContextId,
        contextTitle: resolvedContextTitle,
        source: 'sonos',
      }
    : null;

  if (current && current.uri !== lastLoggedTrackUri) {
    lastLoggedTrackUri = current.uri;
    console.log(`[NowPlaying] source=sonos title="${current.title}" artist="${current.artist}"`);
  }

  return {
    progress: posInfo.progressSeconds,
    totalDuration: posInfo.trackDurationSeconds,
    upcomingQueue: mapSonosQueue(upcoming),
    current,
    isPlaying: transportInfo.isPlaying,
  };
}

router.get('/now-playing', async (_req, res) => {
  const state = playbackService.getNowPlaying();

  if (isRealMode()) {
    try {
      const { progress, totalDuration, upcomingQueue, current, isPlaying } = await getSonosAlignedState();
      res.json({
        ...state,
        isPlaying,
        progress,
        totalDuration: totalDuration > 0 ? totalDuration : state.totalDuration,
        queue: upcomingQueue,
        current,
      });
    } catch (err) {
      console.warn('[Sonos] now-playing state fetch failed:', err instanceof Error ? err.message : String(err));
      res.json({ ...state, queue: [], current: null });
    }
    return;
  }

  console.log(`[Queue] source=mock items=${state.queue.length}`);
  res.json(state);
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

  // In real Sonos mode, only mock albums (known to albumRegistry) can be played
  // via the mock timer. Spotify albums require Phase 14 URI playback.
  if (isRealMode() && !(albumId in albumRegistry)) {
    console.log(
      `[Playback Route] play-album REAL MODE: albumId=${albumId} — not in albumRegistry ` +
      `(Spotify URI playback not yet implemented, Phase 14)`,
    );
    res.status(501).json({
      ok: false,
      mode: 'real',
      action: 'play-album',
      error: 'Spotify album playback on Sonos requires Phase 14 (x-sonos-spotify URI). Currently unsupported.',
    });
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

router.post('/seek', async (req, res) => {
  const { position } = req.body as { position?: number };
  if (position === undefined) {
    res.status(400).json({ error: 'position required' });
    return;
  }
  if (isRealMode()) {
    try {
      await sonosService.seekPosition(position);
      res.json({ ok: true, mode: 'real', action: 'seek', position });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, mode: 'real', action: 'seek', error });
    }
    return;
  }
  res.json(playbackService.seek(position));
});

// ── Queue endpoints ───────────────────────────────────────────────────────────

// Play a specific item in the Sonos queue by its 0-based trackIndex.
// In real mode: AVTransport Seek TRACK_NR (1-based) + Play.
// In mock mode: delegates to playTrack using the albumId/trackIndex from the request body.
router.post('/queue/play-index', async (req, res) => {
  const { trackIndex, albumId } = req.body as { trackIndex?: number; albumId?: string };
  if (trackIndex === undefined) {
    res.status(400).json({ error: 'trackIndex required' });
    return;
  }

  if (isRealMode()) {
    try {
      // Sonos queue is 1-based; trackIndex from the frontend is 0-based (full queue position)
      await sonosService.seekToTrackNr(trackIndex + 1);
      await sonosService.play();
      res.json({ ok: true, mode: 'real', action: 'play-index', trackNr: trackIndex + 1 });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, mode: 'real', action: 'play-index', error });
    }
    return;
  }

  // Mock mode: use albumId + trackIndex to play the right track
  if (!albumId) {
    res.status(400).json({ error: 'albumId required in mock mode' });
    return;
  }
  res.json(playbackService.playTrack(albumId, trackIndex));
});

router.get('/queue', async (_req, res) => {
  if (isRealMode()) {
    try {
      const { upcomingQueue } = await getSonosAlignedState();
      res.json({ queue: upcomingQueue });
    } catch (err) {
      console.warn('[Queue] Sonos queue fetch failed (GET /queue):', err instanceof Error ? err.message : String(err));
      res.json({ queue: [] });
    }
    return;
  }
  console.log(`[Queue] source=mock items=${playbackService.getQueue().length} (GET /queue)`);
  res.json({ queue: playbackService.getQueue() });
});

router.post('/queue/add', (req, res) => {
  const { mode, ...itemData } = req.body as { mode?: 'next' | 'append' } & Partial<Omit<QueueItem, 'id' | 'source'>>;
  if (!mode || !itemData.albumId || !itemData.trackId || !itemData.title) {
    res.status(400).json({ error: 'mode, albumId, trackId, and title are required' });
    return;
  }
  const queue = playbackService.addToQueue(itemData as Omit<QueueItem, 'id' | 'source'>, mode);
  res.json({ queue });
});

router.delete('/queue/:queueItemId', (req, res) => {
  const queue = playbackService.removeFromQueue(req.params.queueItemId);
  res.json({ queue });
});

router.post('/queue/reorder', (req, res) => {
  const { itemId, newIndex } = req.body as { itemId?: string; newIndex?: number };
  if (!itemId || newIndex === undefined) {
    res.status(400).json({ error: 'itemId and newIndex required' });
    return;
  }
  const queue = playbackService.reorderQueue(itemId, newIndex);
  res.json({ queue });
});

export default router;
