import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, useMemo, useRef } from 'react';
import { mockAlbums, getAlbumById } from './data/mockMusic';
import * as playbackApi from './api/playbackApi';
import * as sonosApi from './api/sonosApi';
import { getSpotifyStatus, spotifyLogout, type SpotifyStatus } from './api/spotifyAuthApi';
import * as spotifyApi from './api/spotifyApi';
import { useSpotifyLibrary } from './hooks/useSpotifyLibrary';
import type { Album, Track } from './types/music';
import type { SonosRoom } from './types/sonos';
import { CoverFlow } from './components/CoverFlow';
import { NowPlaying } from './components/NowPlaying';
import { SonosPanel } from './components/SonosPanel';
import { TopNav } from './components/TopNav';
import { SearchOverlay } from './components/SearchOverlay';
import { rgba, themeColors, themeEffects } from './theme/colors';

// ── Constants ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = ['Auswahl', 'Playlists', 'Favoriten', 'Suche'] as const;
type NavItem = (typeof NAV_ITEMS)[number];

const SPOTIFY_ACCENT = 'linear-gradient(135deg, #1a1a2e 0%, #0d0d18 100%)';
const SPOTIFY_ACCENT_SOFT = 'linear-gradient(180deg, rgba(80, 80, 130, 0.15), rgba(13, 13, 24, 0.92))';
const SPOTIFY_COVER_PATTERN = 'repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 18px)';

const PLACEHOLDER_TRACK: Track = {
  id: 'placeholder-track',
  number: 1,
  title: '—',
  duration: '0:00',
};

const EMPTY_PLAYLISTS: Album = {
  id: '__empty-playlists__',
  artist: '',
  title: 'Keine Playlists',
  year: new Date().getFullYear(),
  genre: '',
  mood: 'Erstelle Playlists in Spotify',
  label: '',
  accent: SPOTIFY_ACCENT,
  accentSoft: SPOTIFY_ACCENT_SOFT,
  coverTag: '—',
  coverPattern: SPOTIFY_COVER_PATTERN,
  coverText: '—',
  coverUrl: null,
  tracks: [],
};

const EMPTY_FAVORITEN: Album = {
  id: '__empty-favoriten__',
  artist: '',
  title: 'Keine Verlauf',
  year: new Date().getFullYear(),
  genre: '',
  mood: 'Höre etwas in Spotify ab',
  label: '',
  accent: SPOTIFY_ACCENT,
  accentSoft: SPOTIFY_ACCENT_SOFT,
  coverTag: '—',
  coverPattern: SPOTIFY_COVER_PATTERN,
  coverText: '—',
  coverUrl: null,
  tracks: [],
};

// ── App ────────────────────────────────────────────────────────────────────────

export default function App() {
  // Nav: 'Suche' never written to activeNav — handled via searchOpen instead
  const [activeNav, setActiveNav] = useState<Exclude<NavItem, 'Suche'>>('Auswahl');
  const [searchOpen, setSearchOpen] = useState(false);

  const [selectedAlbumId, setSelectedAlbumId] = useState(mockAlbums[0].id);
  const [flippedAlbumId, setFlippedAlbumId] = useState<string | null>(null);
  const [isDraggingAlbum, setIsDraggingAlbum] = useState(false);
  const [queueTrackId, setQueueTrackId] = useState<string | null>(null);
  const [detailsTrack, setDetailsTrack] = useState<{ album: Album; track: Track } | null>(null);
  const [rooms, setRooms] = useState<SonosRoom[]>([]);
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus>({ connected: false });
  const [enrichedAlbumsById, setEnrichedAlbumsById] = useState<Record<string, Album>>({});
  const [loadingTrackMap, setLoadingTrackMap] = useState<Record<string, boolean>>({});
  const pendingFetches = useRef<Set<string>>(new Set());

  // ── Playback state ──────────────────────────────────────────────────────────
  // Backend is the authority for timing; these are render copies kept in sync by polling.
  // nowPlayingDisplayAlbumId is the album shown in NowPlaying — set by user drag/play actions,
  // NOT overridden by backend polling (which only knows mock album IDs).
  const [nowPlayingDisplayAlbumId, setNowPlayingDisplayAlbumId] = useState<string>(mockAlbums[0].id);
  // Ref kept in sync so polling closure (empty-dep effect) can read the current album ID
  const nowPlayingAlbumIdRef = useRef(mockAlbums[0].id);
  function setNowPlayingAlbum(id: string) {
    nowPlayingAlbumIdRef.current = id;
    setNowPlayingDisplayAlbumId(id);
  }
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(252);

  // ── Spotify library ─────────────────────────────────────────────────────────
  const spotifyLibrary = useSpotifyLibrary(spotifyStatus.connected);

  // Active Spotify device name for TopNav
  const activeDeviceName = useMemo(() => {
    return spotifyLibrary.devices.find((d) => d.isActive)?.name ?? null;
  }, [spotifyLibrary.devices]);

  // ── ensureAlbumDetails: lazy-fetch full album/playlist tracks on demand ────
  async function ensureAlbumDetails(albumId: string) {
    if (mockAlbums.some((a) => a.id === albumId) || albumId.startsWith('__')) return;
    if (pendingFetches.current.has(albumId)) return;
    if ((enrichedAlbumsById[albumId]?.tracks.length ?? 0) > 0) return;

    pendingFetches.current.add(albumId);
    setLoadingTrackMap((prev) => ({ ...prev, [albumId]: true }));

    try {
      const isPlaylist = spotifyLibrary.playlists.some((p) => p.id === albumId);
      const album = isPlaylist
        ? await spotifyApi.getPlaylist(albumId)
        : await spotifyApi.getAlbum(albumId);
      if (album) {
        setEnrichedAlbumsById((prev) => ({ ...prev, [albumId]: album }));
      }
    } catch (err) {
      console.error('[ensureAlbumDetails]', err);
    } finally {
      pendingFetches.current.delete(albumId);
      setLoadingTrackMap((prev) => {
        const next = { ...prev };
        delete next[albumId];
        return next;
      });
    }
  }

  // ── displayAlbums: nav-aware, Spotify-first, no mock fallback when connected ─
  const displayAlbums = useMemo<Album[]>(() => {
    const { albums: spotifyAlbums, playlists, recentTracks, loading } = spotifyLibrary;

    // Unauthenticated or still loading first batch → show mocks as placeholder
    if (!spotifyStatus.connected || loading) {
      return mockAlbums;
    }

    if (activeNav === 'Playlists') {
      if (playlists.length > 0) {
        return playlists.map((p) => {
          const base: Album = {
            id: p.id,
            artist: p.owner || 'Playlist',
            title: p.name,
            year: new Date().getFullYear(),
            genre: `${p.trackCount} Tracks`,
            mood: p.description,
            label: '',
            accent: SPOTIFY_ACCENT,
            accentSoft: SPOTIFY_ACCENT_SOFT,
            coverTag: p.name.slice(0, 2).toUpperCase(),
            coverPattern: SPOTIFY_COVER_PATTERN,
            coverText: p.name.slice(0, 2).toUpperCase(),
            coverUrl: p.coverUrl,
            tracks: [],
          };
          return enrichedAlbumsById[p.id] ?? base;
        });
      }
      // Connected but no playlists — show clear empty state, not mocks
      return [EMPTY_PLAYLISTS];
    }

    if (activeNav === 'Favoriten') {
      // Build from recently played unique albums (different from saved library)
      const seenIds = new Set<string>();
      const recentAlbums: Album[] = [];
      for (const item of recentTracks) {
        const albumId = item.track.albumId;
        if (seenIds.has(albumId)) continue;
        seenIds.add(albumId);
        recentAlbums.push(
          enrichedAlbumsById[albumId] ?? {
            id: albumId,
            artist: item.track.artist,
            title: item.albumTitle,
            year: new Date(item.playedAt).getFullYear(),
            genre: 'Zuletzt gespielt',
            mood: new Date(item.playedAt).toLocaleDateString('de-DE'),
            label: '',
            accent: SPOTIFY_ACCENT,
            accentSoft: SPOTIFY_ACCENT_SOFT,
            coverTag: item.albumTitle.slice(0, 2).toUpperCase(),
            coverPattern: SPOTIFY_COVER_PATTERN,
            coverText: item.albumTitle.slice(0, 2).toUpperCase(),
            coverUrl: item.albumCoverUrl,
            tracks: [],
          },
        );
      }
      return recentAlbums.length > 0 ? recentAlbums : [EMPTY_FAVORITEN];
    }

    // 'Auswahl' — saved library
    if (spotifyAlbums.length > 0) {
      return spotifyAlbums.map((a) => enrichedAlbumsById[a.id] ?? a);
    }
    // Connected but no saved albums — fall back to mocks so the UI is never empty
    return mockAlbums;
  }, [activeNav, spotifyStatus.connected, spotifyLibrary, enrichedAlbumsById]);

  // Reset selection when switching to a list that doesn't contain the current selection
  const prevDisplayRef = useRef(displayAlbums);
  useEffect(() => {
    if (prevDisplayRef.current === displayAlbums) return;
    prevDisplayRef.current = displayAlbums;
    if (displayAlbums.length === 0) return;
    setSelectedAlbumId((cur) => {
      const stillPresent = displayAlbums.some((a) => a.id === cur);
      return stillPresent ? cur : displayAlbums[0].id;
    });
    // Only unflip if the flipped album is no longer in the list (e.g. tab switch),
    // not when the same album gets enriched with track data.
    setFlippedAlbumId((cur) => {
      if (!cur) return null;
      return displayAlbums.some((a) => a.id === cur) ? cur : null;
    });
  }, [displayAlbums]);

  // ── Safety helpers ──────────────────────────────────────────────────────────

  function getDisplayedAlbumById(id: string): Album {
    return (
      enrichedAlbumsById[id] ??
      displayAlbums.find((a) => a.id === id) ??
      spotifyLibrary.albums.find((a) => a.id === id) ??
      mockAlbums.find((a) => a.id === id) ??
      mockAlbums[0]
    );
  }

  function getSafeTrack(album: Album, index: number): Track {
    if (album.tracks.length === 0) return PLACEHOLDER_TRACK;
    return album.tracks[Math.min(index, album.tracks.length - 1)] ?? album.tracks[0] ?? PLACEHOLDER_TRACK;
  }

  // ── NowPlaying data ─────────────────────────────────────────────────────────
  const nowPlayingAlbum = getDisplayedAlbumById(nowPlayingDisplayAlbumId);
  const currentTrack = getSafeTrack(nowPlayingAlbum, currentTrackIndex);
  const highlighted = isDraggingAlbum;

  // ── Playback polling ────────────────────────────────────────────────────────
  function applyBackendState(state: playbackApi.NowPlayingResponse) {
    setIsPlaying(state.isPlaying);
    setProgress(state.progress);
    setTotal(state.totalDuration);
    // Only sync track index from backend for mock albums — Spotify content manages its own index
    if (mockAlbums.some((a) => a.id === nowPlayingAlbumIdRef.current)) {
      setCurrentTrackIndex(state.currentTrackIndex);
    }
    // Note: state.currentAlbumId is a mock ID — we keep our own nowPlayingDisplayAlbumId
    // so real Spotify album metadata is not overridden by polling
  }

  useEffect(() => {
    // Initial fetch also seeds the display album from backend
    playbackApi.getNowPlaying()
      .then((state) => {
        applyBackendState(state);
        // Only set from backend on first load (when still at default mock)
        if (nowPlayingAlbumIdRef.current === mockAlbums[0].id) {
          setNowPlayingAlbum(state.currentAlbumId);
        }
      })
      .catch(console.error);

    const sync = () =>
      playbackApi.getNowPlaying().then(applyBackendState).catch(console.error);
    const id = window.setInterval(sync, 1000);
    return () => window.clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync progress bar total to actual Spotify track duration when track changes
  useEffect(() => {
    if (mockAlbums.some((a) => a.id === nowPlayingDisplayAlbumId)) return;
    const album = enrichedAlbumsById[nowPlayingDisplayAlbumId];
    const track = album?.tracks[currentTrackIndex];
    if (!track?.duration) return;
    const [m, s] = track.duration.split(':').map(Number);
    setTotal((m ?? 0) * 60 + (s ?? 0));
  }, [currentTrackIndex, nowPlayingDisplayAlbumId, enrichedAlbumsById]);

  // ── Bootstrap effects ───────────────────────────────────────────────────────

  useEffect(() => {
    sonosApi.getRooms()
      .then((backendRooms) => {
        setRooms(backendRooms.map((r) => ({
          id: r.id,
          name: r.name,
          volume: r.volume,
          muted: r.muted,
          active: r.groupId !== null,
          groupId: r.groupId,
          leader: false,
        })));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    getSpotifyStatus().then(setSpotifyStatus).catch(console.error);
  }, []);

  const handleSpotifyLogout = () => {
    spotifyLogout()
      .then(() => setSpotifyStatus({ connected: false }))
      .catch(console.error);
  };

  useEffect(() => {
    if (!queueTrackId) return undefined;
    const timeout = window.setTimeout(() => setQueueTrackId(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [queueTrackId]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  function handleNavSelect(item: string) {
    if (item === 'Suche') {
      setSearchOpen(true);
      return;
    }
    setActiveNav(item as Exclude<NavItem, 'Suche'>);
  }

  function handleSearchClose() {
    setSearchOpen(false);
  }

  function handleSearchAlbumSelect(album: Album) {
    // If the found album is not in the current displayAlbums list, switch to Auswahl
    if (!displayAlbums.some((a) => a.id === album.id)) {
      setActiveNav('Auswahl');
    }
    setSelectedAlbumId(album.id);
    setFlippedAlbumId(null);
    setSearchOpen(false);
    // Pre-fetch details so backside is ready immediately on flip
    if (!mockAlbums.some((a) => a.id === album.id)) {
      ensureAlbumDetails(album.id);
    }
  }

  // ── CoverFlow handlers ──────────────────────────────────────────────────────

  const handleSelectAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setFlippedAlbumId(null);
  };

  const handleFlipAlbum = (albumId: string) => {
    setFlippedAlbumId((current) => (current === albumId ? null : albumId));
    const isMock = mockAlbums.some((a) => a.id === albumId);
    if (!isMock && !albumId.startsWith('__')) {
      ensureAlbumDetails(albumId);
    }
  };

  const handleDropToNowPlaying = (albumId: string) => {
    const isMock = mockAlbums.some((a) => a.id === albumId);
    const isPlaceholder = albumId.startsWith('__');

    // Placeholders are not real albums — ignore drag
    if (isPlaceholder) return;

    // Immediately update display state so NowPlaying shows the dropped album
    setSelectedAlbumId(albumId);
    setNowPlayingAlbum(albumId);
    setCurrentTrackIndex(0);
    setProgress(0);
    setIsPlaying(true);
    setFlippedAlbumId(null);

    if (isMock) {
      playbackApi.playAlbum(albumId).then(applyBackendState).catch(console.error);
    } else {
      // Spotify album: fetch details so queue populates, keep simulated backend running
      ensureAlbumDetails(albumId);
      playbackApi.play().then(applyBackendState).catch(console.error);
    }
  };

  const handlePlayTrack = (albumId: string, track: Track) => {
    const isMock = mockAlbums.some((a) => a.id === albumId);

    setSelectedAlbumId(albumId);
    setNowPlayingAlbum(albumId);
    setFlippedAlbumId(null);

    if (isMock) {
      const album = getAlbumById(albumId);
      const trackIndex = Math.max(0, album.tracks.findIndex((t) => t.id === track.id));
      playbackApi.playTrack(albumId, trackIndex).then(applyBackendState).catch(console.error);
    } else {
      // Spotify album: set track index locally by position in Spotify track list
      const album = getDisplayedAlbumById(albumId);
      const trackIndex = Math.max(0, album.tracks.findIndex((t) => t.id === track.id));
      setCurrentTrackIndex(trackIndex);
      setProgress(0);
      setIsPlaying(true);
      playbackApi.play().catch(console.error);
    }
  };

  const handleQueueTrack = (_albumId: string, track: Track) => {
    setQueueTrackId(track.id);
  };

  const handleShowTrackDetails = (albumId: string, track: Track) => {
    const album = getDisplayedAlbumById(albumId);
    setDetailsTrack({ album, track });
  };

  const handleSwipePrev = () => {
    setSelectedAlbumId((current) => {
      const index = displayAlbums.findIndex((a) => a.id === current);
      const next = Math.max(0, index - 1);
      return displayAlbums[next]?.id ?? current;
    });
    setFlippedAlbumId(null);
  };

  const handleSwipeNext = () => {
    setSelectedAlbumId((current) => {
      const index = displayAlbums.findIndex((a) => a.id === current);
      const next = Math.min(displayAlbums.length - 1, index + 1);
      return displayAlbums[next]?.id ?? current;
    });
    setFlippedAlbumId(null);
  };

  // ── Playback controls ───────────────────────────────────────────────────────

  const handlePrevious = () => {
    if (mockAlbums.some((a) => a.id === nowPlayingAlbumIdRef.current)) {
      playbackApi.previous().then(applyBackendState).catch(console.error);
    } else {
      const album = enrichedAlbumsById[nowPlayingAlbumIdRef.current];
      const count = album?.tracks.length ?? 0;
      setCurrentTrackIndex((i) => (count > 0 ? (i - 1 + count) % count : i));
      setProgress(0);
      playbackApi.play().catch(console.error);
    }
  };

  const handleNext = () => {
    if (mockAlbums.some((a) => a.id === nowPlayingAlbumIdRef.current)) {
      playbackApi.next().then(applyBackendState).catch(console.error);
    } else {
      const album = enrichedAlbumsById[nowPlayingAlbumIdRef.current];
      const count = album?.tracks.length ?? 0;
      setCurrentTrackIndex((i) => (count > 0 ? (i + 1) % count : i));
      setProgress(0);
      playbackApi.play().catch(console.error);
    }
  };

  const handleTogglePlay = () => {
    const action = isPlaying ? playbackApi.pause : playbackApi.play;
    action().then(applyBackendState).catch(console.error);
  };

  const handleSeek = (nextSeconds: number) => {
    playbackApi.seek(nextSeconds).then(applyBackendState).catch(console.error);
  };

  // ── Sonos handlers ──────────────────────────────────────────────────────────

  const handleVolumeChange = (roomId: string, volume: number) => {
    sonosApi.setVolume(roomId, volume).catch(console.error);
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId ? { ...room, volume, muted: volume === 0 } : room
      )
    );
  };

  const handleToggleMute = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) sonosApi.setMute(roomId, room.volume > 0).catch(console.error);
    setRooms((current) =>
      current.map((r) => {
        if (r.id !== roomId) return r;
        if (r.volume > 0) return { ...r, previousVolume: r.volume, volume: 0, muted: true };
        const restored = r.previousVolume ?? 40;
        return { ...r, volume: restored, muted: false };
      })
    );
  };

  const handleToggleGroup = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (room) sonosApi.setGroup(roomId, room.groupId ? null : 'main').catch(console.error);
    setRooms((current) =>
      current.map((r) => {
        if (r.id !== roomId) return r;
        if (r.groupId) return { ...r, groupId: null, active: false };
        return { ...r, groupId: 'main', active: true };
      })
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: themeColors.page, color: themeColors.neutral.text.primary }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            `radial-gradient(circle at top left, ${rgba(themeColors.accent.goldSoft, 0.18)}, transparent 30%)`,
            `radial-gradient(circle at right, ${rgba(themeColors.accent.bronzeSoft, 0.08)}, transparent 24%)`,
            `linear-gradient(180deg, ${themeColors.pageTop} 0%, ${themeColors.page} 56%, ${themeColors.pageBottom} 100%)`,
          ].join(', '),
        }}
      />
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-[8%] top-[14%] h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: rgba(themeColors.accent.goldSoft, 0.05) }}
      />
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-[6%] top-[22%] h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: rgba(themeColors.accent.bronzeSoft, 0.09) }}
      />

      <div
        className="relative mx-auto grid min-h-screen w-full max-w-[1920px] gap-3 p-3 lg:p-4"
        style={{ gridTemplateRows: '0.07fr 0.49fr 0.22fr 0.22fr' }}
      >
        <header className="min-h-0">
          <TopNav
            active={searchOpen ? 'Suche' : activeNav}
            onSelect={handleNavSelect}
            spotifyStatus={spotifyStatus}
            onSpotifyLogout={handleSpotifyLogout}
            activeDeviceName={activeDeviceName}
          />
        </header>

        <main className="contents">
          {/* ── CoverFlow ── */}
          <section className="relative min-h-0">
            <CoverFlow
              albums={displayAlbums}
              selectedAlbumId={selectedAlbumId}
              flippedAlbumId={flippedAlbumId}
              loadingTrackMap={loadingTrackMap}
              onSelectAlbum={handleSelectAlbum}
              onFlipAlbum={handleFlipAlbum}
              onSwipePrev={handleSwipePrev}
              onSwipeNext={handleSwipeNext}
              onDropToNowPlaying={handleDropToNowPlaying}
              onPlayTrack={handlePlayTrack}
              onQueueTrack={handleQueueTrack}
              onShowTrackDetails={handleShowTrackDetails}
              onDragStateChange={setIsDraggingAlbum}
            />

            {/* Recently played strip — non-disruptive, only when data exists */}
            <AnimatePresence>
              {spotifyLibrary.recentTracks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center gap-2"
                >
                  <span
                    className="shrink-0 font-display text-[0.55rem] uppercase tracking-[0.3em]"
                    style={{ color: themeColors.neutral.text.subtle }}
                  >
                    Zuletzt
                  </span>
                  <div className="flex gap-1.5 overflow-hidden">
                    {spotifyLibrary.recentTracks.slice(0, 6).map((item, i) => (
                      <div
                        key={`${item.track.id}-${i}`}
                        className="h-6 w-6 shrink-0 overflow-hidden rounded"
                        style={{
                          border: themeEffects.neutral.border.subtle,
                          backgroundColor: rgba(themeColors.panel, 0.6),
                        }}
                        title={`${item.track.title} · ${item.albumTitle}`}
                      >
                        {item.albumCoverUrl ? (
                          <img
                            src={item.albumCoverUrl}
                            alt={item.albumTitle}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-[0.4rem]"
                            style={{ color: themeColors.neutral.text.subtle }}
                          >
                            {item.albumTitle.slice(0, 1)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── NowPlaying ── */}
          <section className="min-h-0">
            <NowPlaying
              album={nowPlayingAlbum}
              track={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              total={total}
              highlighted={highlighted}
              onPrevious={handlePrevious}
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onSeek={handleSeek}
            />
          </section>

          {/* ── Sonos ── */}
          <section className="min-h-0">
            <SonosPanel
              rooms={rooms}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
              onToggleGroup={handleToggleGroup}
            />
          </section>
        </main>

        {/* ── Search overlay — triggered by 'Suche' nav tap ── */}
        <SearchOverlay
          open={searchOpen}
          connected={spotifyStatus.connected}
          onClose={handleSearchClose}
          onSelectAlbum={handleSearchAlbumSelect}
        />

        {/* ── Queue toast ── */}
        <AnimatePresence>
          {queueTrackId && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute bottom-5 right-5 rounded-full px-4 py-3 text-sm backdrop-blur-2xl"
              style={{
                border: themeEffects.neutral.border.soft,
                backgroundColor: themeEffects.neutral.surface.panel,
                color: themeColors.neutral.text.secondary,
              }}
            >
              Queue ready
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Track details modal ── */}
        <AnimatePresence>
          {detailsTrack && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 grid place-items-center p-4"
              style={{ backgroundColor: rgba(themeColors.overlay, 0.55) }}
              onClick={() => setDetailsTrack(null)}
            >
              <motion.div
                initial={{ y: 16, scale: 0.97 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 16, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-xl rounded-[2rem] p-6 text-left"
                style={{
                  border: themeEffects.neutral.border.soft,
                  backgroundColor: themeColors.panel,
                }}
              >
                <p
                  className="font-display text-xs uppercase tracking-[0.34em]"
                  style={{ color: themeColors.neutral.text.soft }}
                >
                  Track Details
                </p>
                <h3
                  className="mt-3 font-display text-3xl"
                  style={{ color: themeColors.neutral.text.primary }}
                >
                  {detailsTrack.track.title}
                </h3>
                <p className="mt-2" style={{ color: themeColors.neutral.text.muted }}>
                  {detailsTrack.album.artist} — {detailsTrack.album.title}
                </p>
                <div
                  className="mt-6 grid grid-cols-2 gap-3 text-sm"
                  style={{ color: themeColors.neutral.text.secondary }}
                >
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      border: themeEffects.neutral.border.medium,
                      backgroundColor: themeEffects.neutral.surface.elevated,
                    }}
                  >
                    Track {detailsTrack.track.number}
                  </div>
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      border: themeEffects.neutral.border.medium,
                      backgroundColor: themeEffects.neutral.surface.elevated,
                    }}
                  >
                    {detailsTrack.track.duration}
                  </div>
                </div>
                <div
                  className="mt-6 rounded-2xl p-4"
                  style={{
                    border: themeEffects.neutral.border.medium,
                    backgroundColor: themeEffects.neutral.surface.elevated,
                    color: themeColors.neutral.text.soft,
                  }}
                >
                  Real playback integration in Phase 13.
                </div>
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
