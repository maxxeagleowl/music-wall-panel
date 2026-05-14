import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { mockAlbums, getAlbumById } from './data/mockMusic';
import { mockRooms } from './data/mockSonos';
import type { Album, Track } from './types/music';
import type { SonosRoom } from './types/sonos';
import { CoverFlow } from './components/CoverFlow';
import { NowPlaying } from './components/NowPlaying';
import { SonosPanel } from './components/SonosPanel';
import { TopNav } from './components/TopNav';

const navItems = ['Auswahl', 'Playlists', 'Favoriten', 'Suche'];

function parseDuration(duration: string) {
  const [minutes, seconds] = duration.split(':').map(Number);
  return minutes * 60 + seconds;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function App() {
  const [activeNav, setActiveNav] = useState(navItems[0]);
  const [selectedAlbumId, setSelectedAlbumId] = useState(mockAlbums[0].id);
  const [flippedAlbumId, setFlippedAlbumId] = useState<string | null>(null);
  const [nowPlayingAlbumId, setNowPlayingAlbumId] = useState(mockAlbums[0].id);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isDraggingAlbum, setIsDraggingAlbum] = useState(false);
  const [queueTrackId, setQueueTrackId] = useState<string | null>(null);
  const [detailsTrack, setDetailsTrack] = useState<{ album: Album; track: Track } | null>(null);
  const [rooms, setRooms] = useState<SonosRoom[]>(mockRooms);

  const nowPlayingAlbum = getAlbumById(nowPlayingAlbumId);
  const currentTrack = nowPlayingAlbum.tracks[currentTrackIndex] ?? nowPlayingAlbum.tracks[0];
  const total = useMemo(() => parseDuration(currentTrack.duration), [currentTrack.duration]);
  const highlighted = isDraggingAlbum;

  useEffect(() => {
    setProgress(0);
    setCurrentTrackIndex(0);
  }, [nowPlayingAlbumId]);

  useEffect(() => {
    if (!isPlaying) return undefined;

    const interval = window.setInterval(() => {
      setProgress((value) => {
        const next = value + 1;
        if (next >= total) {
          setCurrentTrackIndex((index) => {
            const nextTrackIndex = index + 1;
            if (nextTrackIndex >= nowPlayingAlbum.tracks.length) {
              setIsPlaying(false);
              return index;
            }
            return nextTrackIndex;
          });
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPlaying, total, nowPlayingAlbum.tracks.length]);

  useEffect(() => {
    if (!queueTrackId) return undefined;

    const timeout = window.setTimeout(() => setQueueTrackId(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [queueTrackId]);

  const handleSelectAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setFlippedAlbumId(null);
  };

  const handleFlipAlbum = (albumId: string) => {
    setFlippedAlbumId((current) => (current === albumId ? null : albumId));
  };

  const handleDropToNowPlaying = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setNowPlayingAlbumId(albumId);
    setIsPlaying(true);
    setProgress(0);
  };

  const handlePlayTrack = (albumId: string, track: Track) => {
    const album = getAlbumById(albumId);
    const nextTrackIndex = Math.max(0, album.tracks.findIndex((entry) => entry.id === track.id));
    setSelectedAlbumId(albumId);
    setNowPlayingAlbumId(albumId);
    setCurrentTrackIndex(nextTrackIndex);
    setProgress(0);
    setIsPlaying(true);
    setFlippedAlbumId(null);
  };

  const handleQueueTrack = (_albumId: string, track: Track) => {
    setQueueTrackId(track.id);
  };

  const handleShowTrackDetails = (albumId: string, track: Track) => {
    setDetailsTrack({ album: getAlbumById(albumId), track });
  };

  const handlePrevious = () => {
    setCurrentTrackIndex((index) => {
      const next = index - 1;
      return next < 0 ? 0 : next;
    });
    setProgress(0);
    setIsPlaying(true);
  };

  const handleNext = () => {
    setCurrentTrackIndex((index) => {
      const next = index + 1;
      return next >= nowPlayingAlbum.tracks.length ? nowPlayingAlbum.tracks.length - 1 : next;
    });
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSwipePrev = () => {
    setSelectedAlbumId((current) => {
      const index = mockAlbums.findIndex((album) => album.id === current);
      const next = Math.max(0, index - 1);
      return mockAlbums[next]?.id ?? current;
    });
    setFlippedAlbumId(null);
  };

  const handleSwipeNext = () => {
    setSelectedAlbumId((current) => {
      const index = mockAlbums.findIndex((album) => album.id === current);
      const next = Math.min(mockAlbums.length - 1, index + 1);
      return mockAlbums[next]?.id ?? current;
    });
    setFlippedAlbumId(null);
  };

  const handleSeek = (nextSeconds: number) => {
    setProgress(clamp(nextSeconds, 0, total));
  };

  const handleVolumeChange = (roomId: string, volume: number) => {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? {
              ...room,
              volume,
              muted: volume === 0 ? true : false
            }
          : room
      )
    );
  };

  const handleToggleMute = (roomId: string) => {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? {
              ...room,
              muted: !room.muted
            }
          : room
      )
    );
  };

  const handleToggleGroup = (roomId: string) => {
    setRooms((current) =>
      current.map((room) => {
        if (room.id !== roomId) return room;
        if (room.groupId) {
          return { ...room, groupId: null, active: false };
        }
        return { ...room, groupId: 'main', active: true };
      })
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04060a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(121,146,191,0.18),transparent_30%),radial-gradient(circle_at_right,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,#05070b_0%,#04050a_56%,#030406_100%)]" />
      <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute left-[8%] top-[14%] h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} className="pointer-events-none absolute right-[6%] top-[22%] h-80 w-80 rounded-full bg-slate-400/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1920px] flex-col gap-3 p-3 lg:p-4">
        <header className="grid h-[10%] min-h-[84px] items-center">
          <TopNav active={activeNav} onSelect={setActiveNav} />
        </header>

        <main className="grid flex-1 grid-rows-[52%_20%_18%] gap-3">
          <section className="min-h-[280px]">
            <CoverFlow
              albums={mockAlbums}
              selectedAlbumId={selectedAlbumId}
              flippedAlbumId={flippedAlbumId}
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
          </section>

          <section className="min-h-[220px]">
            <NowPlaying
              album={nowPlayingAlbum}
              track={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              total={total}
              highlighted={highlighted}
              onPrevious={handlePrevious}
              onTogglePlay={() => setIsPlaying((value) => !value)}
              onNext={handleNext}
              onSeek={handleSeek}
            />
          </section>

          <section className="min-h-[200px]">
            <SonosPanel rooms={rooms} onVolumeChange={handleVolumeChange} onToggleMute={handleToggleMute} onToggleGroup={handleToggleGroup} />
          </section>
        </main>

        <AnimatePresence>
          {queueTrackId ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute bottom-5 right-5 rounded-full border border-white/[0.06] bg-panel-850/88 px-4 py-3 text-sm text-white/78 backdrop-blur-2xl"
            >
              Queue ready
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {detailsTrack ? (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 grid place-items-center bg-black/[0.55] p-4"
              onClick={() => setDetailsTrack(null)}
            >
              <motion.div
                initial={{ y: 16, scale: 0.97 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 16, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-xl rounded-[2rem] border border-white/[0.06] bg-panel-850 p-6 text-left"
              >
                <p className="font-display text-xs uppercase tracking-[0.34em] text-white/40">Track Details</p>
                <h3 className="mt-3 font-display text-3xl text-white">{detailsTrack.track.title}</h3>
                <p className="mt-2 text-white/60">
                  {detailsTrack.album.artist} - {detailsTrack.album.title}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-white/70">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">Track {detailsTrack.track.number}</div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">Duration {detailsTrack.track.duration}</div>
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white/[0.55]">
                  Premium mock view only. Real playback integration comes later.
                </div>
              </motion.div>
            </motion.button>
          ) : null}
        </AnimatePresence>

      </div>
    </div>
  );
}
