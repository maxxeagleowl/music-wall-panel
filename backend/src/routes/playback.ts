import { Router } from 'express';
import * as playbackService from '../services/playbackService';
import type { QueueItem, CurrentTrack } from '../services/playbackService';
import * as sonosService from '../services/sonosService';
import type { SonosQueueItem } from '../services/sonosService';
import * as spotifyService from '../services/spotifyService';
import { hasSession, isSessionValid, getSession } from '../state/spotifySession';
import { forceRefreshToken } from '../services/spotifyAuthService';
import { albumRegistry } from '../data/albums';

const router = Router();

let lastLoggedTrackUri = '';
let lastLoggedContextId = '';
// Last Sonos track URI seen — used to detect track changes and invalidate the Spotify context cache
let lastSonosTrackUriForCtx = '';

// Cache for resolved human-readable context names (playlist titles) by Spotify ID.
// Keyed by Spotify context ID; TTL 5 min since playlist names rarely change.
const contextNameCache = new Map<string, { name: string; fetchedAt: number }>();
const CONTEXT_NAME_TTL = 5 * 60 * 1000;

async function resolveContextName(contextId: string, contextType: string): Promise<string> {
  const cached = contextNameCache.get(contextId);
  if (cached && Date.now() - cached.fetchedAt < CONTEXT_NAME_TTL) {
    console.log(`[Context] Name cache hit: id="${contextId}" name="${cached.name}"`);
    return cached.name;
  }
  try {
    const type = contextType === 'album' ? 'album' : 'playlist';
    const name = await spotifyService.getContextName(contextId, type);
    contextNameCache.set(contextId, { name, fetchedAt: Date.now() });
    console.log(`[Context] Resolved context name (${type}): id="${contextId}" name="${name}"`);
    return name;
  } catch (err) {
    console.warn(
      `[Context] Failed to resolve name for "${contextId}" (${contextType}):`,
      err instanceof Error ? err.message : String(err),
    );
    return '';
  }
}

// Spotify playback context cache — avoids hitting the API on every 1s poll
const SPOTIFY_CTX_TTL = 5_000;
let spotifyCtxCache: { type: string; uri: string; trackId: string | null } | null = null;
let spotifyCtxFetchedAt = 0;
// Shared in-flight promise — concurrent callers await the same fetch instead of getting stale null
let spotifyCtxInFlight: Promise<{ type: string; uri: string; trackId: string | null } | null> | null = null;

async function getSpotifyContext(): Promise<{ type: string; uri: string; trackId: string | null } | null> {
  const now = Date.now();
  // Only serve cache when result is non-null (null = no player / error — retry sooner)
  if (spotifyCtxCache !== null && now - spotifyCtxFetchedAt < SPOTIFY_CTX_TTL) return spotifyCtxCache;
  // If a fetch is already in-flight, await it instead of returning stale null
  if (spotifyCtxInFlight) return spotifyCtxInFlight;

  // ── Auth diagnostics ────────────────────────────────────────────────────────
  const sessionExists = hasSession();
  const sessionValid  = isSessionValid();
  const session       = getSession();
  console.log(
    `[Context/Auth] connected=${sessionExists}` +
    ` tokenAvailable=${sessionExists}` +
    ` tokenExpired=${sessionExists && !sessionValid}` +
    ` expiresAt=${session ? new Date(session.expiresAt).toISOString() : 'n/a'}`,
  );

  if (!sessionExists) {
    console.log(`[Context/Auth] reason=auth_disconnected — no Spotify session`);
    // Do not update spotifyCtxFetchedAt — retry next poll in case user logs in
    return spotifyCtxCache;
  }

  spotifyCtxInFlight = (async () => {
    try {
      let player = await spotifyService.getPlayerContext();

      // ── 401: token may have been revoked — force refresh and retry once ──────
      if (player.httpStatus === 401) {
        console.warn(`[Context/Spotify] httpStatus=401 — attempting force token refresh`);
        let refreshSuccess = false;
        try {
          await forceRefreshToken();
          refreshSuccess = true;
        } catch (refreshErr) {
          console.warn(
            `[Context/Spotify] refreshAttempt=true refreshSuccess=false —`,
            refreshErr instanceof Error ? refreshErr.message : String(refreshErr),
          );
        }
        console.log(`[Context/Spotify] refreshAttempt=true refreshSuccess=${refreshSuccess}`);
        if (refreshSuccess) {
          player = await spotifyService.getPlayerContext();
        } else {
          spotifyCtxCache = null;
          spotifyCtxFetchedAt = Date.now();
          return spotifyCtxCache;
        }
      }

      // ── 403: missing OAuth scope ──────────────────────────────────────────────
      if (player.httpStatus === 403) {
        console.warn(
          `[Context/Spotify] reason=missing_scope_or_forbidden httpStatus=403` +
          ` — re-login required to grant user-read-playback-state scope` +
          ` body="${player.errorBody?.slice(0, 200) ?? ''}"`,
        );
        spotifyCtxCache = null;
        spotifyCtxFetchedAt = Date.now();
        return spotifyCtxCache;
      }

      console.log(
        `[Context/Spotify] httpStatus=${player.httpStatus}` +
        ` deviceName="${player.deviceName ?? 'null'}"` +
        ` deviceId="${player.deviceId ?? 'null'}"` +
        ` deviceIsActive=${player.deviceIsActive}` +
        ` spotifyPlayerTrackId="${player.trackId ?? 'null'}"` +
        ` spotifyPlayerContextUri="${player.contextUri ?? 'null'}"` +
        ` spotifyPlayerContextType="${player.contextType ?? 'null'}"`,
      );

      if (player.httpStatus === 204) {
        console.log(`[Context/Spotify] reason=player_204 — no active Spotify player`);
        spotifyCtxCache = null;
      } else if (!player.contextUri) {
        console.log(`[Context/Spotify] reason=no_context_uri — Spotify playing without playlist/album context`);
        spotifyCtxCache = null;
      } else {
        spotifyCtxCache = {
          type: player.contextType ?? 'unknown',
          uri: player.contextUri,
          trackId: player.trackId,
        };
      }
      spotifyCtxFetchedAt = Date.now();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Context/Spotify] reason=spotify_api_error — ${msg}`);
    } finally {
      spotifyCtxInFlight = null;
    }
    return spotifyCtxCache;
  })();

  return spotifyCtxInFlight;
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

  // Invalidate Spotify context cache immediately when the Sonos track URI changes.
  // Without this, a stale cached context from a previous track can bleed into the next
  // poll and cause the wrong playlist name to resolve.
  if (posInfo.trackUri && posInfo.trackUri !== lastSonosTrackUriForCtx) {
    if (lastSonosTrackUriForCtx !== '') {
      console.log(
        `[Context] Track changed — cache invalidated` +
        ` prev="${lastSonosTrackUriForCtx.slice(0, 60)}"` +
        ` next="${posInfo.trackUri.slice(0, 60)}"`,
      );
      spotifyCtxCache = null;
      spotifyCtxFetchedAt = 0;
    }
    lastSonosTrackUriForCtx = posInfo.trackUri;
  }

  console.log(
    `[Context] Sonos contextUri="${mediaInfo.contextUri.slice(0, 80)}"` +
    ` type="${mediaInfo.contextType}" id="${mediaInfo.contextId}"`,
  );

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
    // Sonos URL-encodes the embedded Spotify URI (spotify%3atrack%3aID).
    // Extract the Spotify track ID, then ask Spotify /me/player for the parent context.
    // A spotify:track URI is only a track identifier, not a playback context.
    // Sonos remains the playback authority; Spotify resolves metadata only.
    const rawSonosTrackUri = posInfo.trackUri;
    const decodedTrackUri  = decodeURIComponent(rawSonosTrackUri);
    const sonosTrackIdMatch = decodedTrackUri.match(/spotify:track:([A-Za-z0-9]+)/);
    const sonosTrackId = sonosTrackIdMatch?.[1] ?? null;

    console.log(`[Context] rawSonosTrackUri="${rawSonosTrackUri.slice(0, 100)}"`);
    console.log(`[Context] decodedSonosTrackUri="${decodedTrackUri.slice(0, 100)}"`);
    console.log(`[Context] extractedSonosTrackId="${sonosTrackId ?? 'null'}"`);

    const spotifyCtx = await getSpotifyContext();

    // Determine match reason
    let noMatchReason = '';
    const contextMatch = !!(sonosTrackId && spotifyCtx?.trackId === sonosTrackId);

    if (!sonosTrackId) {
      noMatchReason = 'no_sonos_track_id';
    } else if (!spotifyCtx) {
      noMatchReason = 'spotify_unavailable';
    } else if (spotifyCtx.trackId !== sonosTrackId) {
      noMatchReason = 'track_mismatch';
    }

    console.log(
      `[Context] sonosTrackId="${sonosTrackId ?? 'null'}"` +
      ` spotifyPlayerTrackId="${spotifyCtx?.trackId ?? 'null'}"` +
      ` contextMatch=${contextMatch}` +
      (noMatchReason ? ` reason=${noMatchReason}` : ''),
    );

    if (contextMatch && spotifyCtx) {
      // Parse context ID from Spotify URI: spotify:<type>:<id>
      const uriParts = spotifyCtx.uri.split(':');
      const extractedId = uriParts.length >= 3 ? (uriParts[uriParts.length - 1] ?? '') : '';

      if (extractedId && (spotifyCtx.type === 'playlist' || spotifyCtx.type === 'album')) {
        resolvedContextId    = extractedId;
        resolvedContextType  = spotifyCtx.type;
        resolvedContextTitle = '';
        console.log(`[Context] Resolved via Spotify player: type="${spotifyCtx.type}" id="${extractedId}"`);
      } else {
        console.log(
          `[Context] reason=unsupported_context_type type="${spotifyCtx.type}" uri="${spotifyCtx.uri.slice(0, 60)}"`,
        );
        resolvedContextId    = '';
        resolvedContextTitle = '';
        resolvedContextType  = 'unknown';
      }
    } else {
      // No match or Spotify unavailable — clear any Sonos-derived contextType so the UI
      // never shows a stale or meaningless label.
      resolvedContextId    = '';
      resolvedContextTitle = '';
      resolvedContextType  = 'unknown';
    }
  }

  // Resolve human-readable name for any context that has an ID but no title yet.
  if (resolvedContextId && !resolvedContextTitle) {
    resolvedContextTitle = await resolveContextName(resolvedContextId, resolvedContextType);
  }
  console.log(`[Context] resolvedContextTitle="${resolvedContextTitle}"`);

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

  if (current) {
    if (current.contextId !== lastLoggedContextId) {
      lastLoggedContextId = current.contextId;
      console.log(
        `[Context] Context changed: type="${current.contextType}"` +
        ` id="${current.contextId || '(none)'}` +
        `" title="${current.contextTitle || '(none)'}"`,
      );
    }
    if (current.uri !== lastLoggedTrackUri) {
      lastLoggedTrackUri = current.uri;
      console.log(`[NowPlaying] source=sonos title="${current.title}" artist="${current.artist}"`);
    }
  } else if (lastLoggedContextId !== '') {
    lastLoggedContextId = '';
    console.log(`[Context] Context cleared — Sonos returned no position info`);
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

      // Hard-resolve context directly from Spotify /me/player — same source as /api/spotify/debug.
      // This bypasses any caching or pending-guard that could return stale null.
      let resolvedContextType  = current?.contextType  ?? '';
      let resolvedContextId    = current?.contextId    ?? '';
      let resolvedContextTitle = current?.contextTitle ?? '';

      try {
        const spotifyCtx = await spotifyService.getPlayerContext();
        const spotifyContextUri  = spotifyCtx.contextUri;
        const spotifyContextType = spotifyCtx.contextType;

        if (spotifyContextUri && spotifyContextType) {
          const parts = spotifyContextUri.split(':');
          const spotifyContextId = parts[2] ?? '';

          if (spotifyContextId && ['playlist', 'album'].includes(spotifyContextType)) {
            resolvedContextType  = spotifyContextType;
            resolvedContextId    = spotifyContextId;
            resolvedContextTitle = await resolveContextName(spotifyContextId, spotifyContextType);
          }
        }
      } catch (spotifyErr) {
        console.warn('[FINAL_CONTEXT] Spotify player call failed:', spotifyErr instanceof Error ? spotifyErr.message : String(spotifyErr));
      }

      console.log('[FINAL_CONTEXT_STATE]', {
        resolvedContextType,
        resolvedContextId,
        resolvedContextTitle,
      });

      const finalCurrent = current
        ? {
            ...current,
            contextType:  resolvedContextType,
            contextId:    resolvedContextId,
            contextTitle: resolvedContextTitle,
            playlistName: resolvedContextTitle,
            contextName:  resolvedContextTitle,
          }
        : null;

      // TEMP BOUNDARY 1 — remove after confirming contextTitle reaches frontend
      console.log('[BOUNDARY 1] /api/now-playing finalCurrent:', JSON.stringify({
        source:       finalCurrent?.source       ?? '(null)',
        contextType:  finalCurrent?.contextType  ?? '(null)',
        contextId:    finalCurrent?.contextId    ?? '(null)',
        contextTitle: finalCurrent?.contextTitle ?? '(null)',
        playlistName: (finalCurrent as Record<string, unknown>)?.['playlistName'] ?? '(null)',
        contextName:  (finalCurrent as Record<string, unknown>)?.['contextName']  ?? '(null)',
      }));

      res.json({
        ...state,
        isPlaying,
        progress,
        totalDuration: totalDuration > 0 ? totalDuration : state.totalDuration,
        queue: upcomingQueue,
        current: finalCurrent,
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
