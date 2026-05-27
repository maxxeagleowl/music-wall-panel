import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Album, Track, QueueItem } from '../types/music';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { createMockAlbumTheme } from '../theme/musicTheme';
import { rgba, themeColors, themeEffects } from '../theme/colors';

type CurrentOverride = {
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  source: 'sonos' | 'mock';
  contextType?: string;
  contextTitle?: string;   // resolved human-readable context name from backend
  playlistName?: string;   // alias field
  contextName?: string;    // alias field
};

type NowPlayingProps = {
  album: Album;
  track: Track;
  isPlaying: boolean;
  progress: number;
  total: number;
  highlighted: boolean;
  queue: QueueItem[];
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onSeek: (nextSeconds: number) => void;
  onQueueItemSelect?: (item: QueueItem) => void;
  isPlaylist?: boolean;
  currentOverride?: CurrentOverride | null;
};

export function NowPlaying({
  album,
  track,
  isPlaying,
  progress,
  total,
  highlighted,
  queue,
  onPrevious,
  onTogglePlay,
  onNext,
  onSeek,
  onQueueItemSelect,
  isPlaylist,
  currentOverride,
}: NowPlayingProps) {
  const queueScrollRef = useRef<HTMLDivElement>(null);
  const scrollResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollResetTimer.current) clearTimeout(scrollResetTimer.current);
    };
  }, []);

  function handleQueueScroll() {
    if (scrollResetTimer.current) clearTimeout(scrollResetTimer.current);
    scrollResetTimer.current = setTimeout(() => {
      queueScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 4000);
  }

  const visualTheme = createMockAlbumTheme(album);

  const isSonos = currentOverride?.source === 'sonos';
  const displayTitle    = isSonos ? currentOverride!.title  : track.title;
  const displayArtist   = isSonos
    ? (currentOverride!.artist || track.artist || album.artist)
    : (track.artist ?? album.artist);
  const displayAlbum    = isSonos ? currentOverride!.album  : (track.albumTitle ?? album.title);
  const displayCoverUrl = isSonos ? currentOverride!.coverUrl : (track.albumCoverUrl ?? album.coverUrl);
  // Render context label only when backend provides a real resolved name.
  // Never fall back to stale album.title in Sonos mode.
  const hasValidContextLabel =
    Boolean(currentOverride?.contextTitle) ||
    Boolean(currentOverride?.playlistName) ||
    Boolean(currentOverride?.contextName);

  const displayPlaylistName: string | null = isSonos
    ? (currentOverride?.contextTitle ?? currentOverride?.playlistName ?? currentOverride?.contextName ?? null)
    : album.title;

  // TEMP BOUNDARY 4 — remove after confirming label renders
  console.log('[BOUNDARY 4] NowPlaying render:', {
    isSonos,
    contextType:         currentOverride?.contextType  ?? '(null)',
    contextTitle:        currentOverride?.contextTitle ?? '(null)',
    playlistName:        currentOverride?.playlistName ?? '(null)',
    hasValidContextLabel,
    isPlaylist,
    albumTitle:          album.title,
    displayPlaylistName: displayPlaylistName ?? '(null)',
  });

  return (
    <section
      className={[
        'glass-panel h-full rounded-[2rem] border transition duration-300'
      ].join(' ')}
      style={
        highlighted
          ? {
              ...themeEffects.active.surface,
              backgroundColor: rgba(themeColors.accent.goldSoft, 0.09)
            }
          : {
              borderColor: themeColors.neutral.border.soft,
              backgroundColor: themeColors.neutral.surface.soft
            }
      }
    >
      <div
        className="grid h-full items-center px-6 py-4"
        style={{ gridTemplateColumns: '1.0fr 1fr 1.7fr 1.6fr' }}
      >

        {/* Zone 1 — Metadata */}
        <div className="flex items-center pl-3">
          <div className="max-w-[20ch] overflow-hidden">
            {(isSonos ? hasValidContextLabel : isPlaylist) && displayPlaylistName && (
              <p
                className="mb-4 truncate text-[0.56rem] uppercase tracking-[0.34em]"
                style={{ color: themeColors.neutral.text.faint }}
              >
                {displayPlaylistName}
              </p>
            )}
            <p
              className="truncate text-[0.56rem] uppercase tracking-[0.34em]"
              style={{
                color: themeColors.neutral.text.faint
              }}
            >
              {displayArtist}
            </p>

            <h2
              className="mt-2 truncate font-display text-[1.34rem] leading-[1.02] tracking-[-0.03em]"
              style={{
                color: themeColors.neutral.text.primary
              }}
            >
              {displayTitle}
            </h2>

            <p
              className="mt-2 truncate text-[0.7rem] tracking-[0.08em]"
              style={{
                color: themeColors.neutral.text.soft
              }}
            >
              {displayAlbum}
            </p>
          </div>
        </div>

        {/* Zone 2 — Cover */}
        <div className="relative flex items-center justify-center pl-2 pr-0">
          <div
            className="pointer-events-none absolute aspect-square w-[170px] rounded-full blur-2xl"
            style={{
              background: visualTheme.ambientGlow
            }}
          />

          <motion.div
            initial={{ rotate: 0 }}
            animate={
              isPlaying
                ? { scale: [1, 1.025, 1], rotate: 0 }
                : { scale: 1, rotate: 0 }
            }
            transition={
              isPlaying
                ? {
                    duration: 7,
                    repeat: Infinity,
                    ease: [0.42, 0, 0.18, 1]
                  }
                : {
                    duration: 1.2,
                    ease: [0.42, 0, 0.18, 1]
                  }
            }
            className="relative aspect-square w-[168px] overflow-hidden rounded-[1.9rem]"
            style={{
              boxShadow: 'none'
            }}
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-[1.9rem]"
              style={{
                background: visualTheme.ambientGradient
              }}
            >
              {displayCoverUrl && (
                <img
                  src={displayCoverUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              )}

              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: [
                    `radial-gradient(circle at 30% 22%, ${rgba(themeColors.text.primary, 0.11)}, transparent 44%)`,
                    `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.04)}, transparent)`
                  ].join(', ')
                }}
              />
            </div>

            <div
              className="pointer-events-none absolute inset-0 rounded-[1.9rem]"
              style={{
                boxShadow: `inset 0 1px 0 ${rgba(themeColors.text.primary, 0.08)}`
              }}
            />
          </motion.div>
        </div>

       {/* Zone 3 — Controls + Progress */}
        <div className="flex h-full items-center justify-center">
          <div className="flex w-full max-w-[72%] flex-col items-center justify-center gap-4">
            <PlaybackControls
              isPlaying={isPlaying}
              onPrevious={onPrevious}
              onTogglePlay={onTogglePlay}
              onNext={onNext}
            />

            <ProgressBar progress={progress} total={total} onSeek={onSeek} />
          </div>
        </div>

        {/* Zone 4 — Warteschlange */}
          <div className="flex flex-col justify-center pl-6 pr-5">
            <div className="mb-4 flex items-center justify-between">
              <span
                className="text-[0.56rem] uppercase tracking-[0.34em]"
                style={{ color: themeColors.neutral.text.faint }}
              >
                Warteschlange
              </span>

              <MoreHorizontal
                size={14}
                className="shrink-0"
                color={themeColors.neutral.text.subtle}
              />
            </div>

            {queue.length > 0 ? (
              <div style={{ maxHeight: '5.6rem', overflow: 'hidden' }}>
                <div ref={queueScrollRef} className="overflow-y-auto space-y-2.5" style={{ maxHeight: '5.6rem', marginRight: '-20px', paddingRight: '20px' }} onScroll={handleQueueScroll}>
                  {queue.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid cursor-pointer items-center gap-3"
                      style={{ gridTemplateColumns: '1.7rem 1fr 2.4rem' }}
                      onClick={() => onQueueItemSelect?.(item)}
                    >
                      <span
                        className="text-[0.58rem] tabular-nums"
                        style={{
                          color: index === 0 ? themeColors.neutral.text.soft : themeColors.neutral.text.subtle
                        }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="truncate text-[0.72rem] tracking-[0.02em]"
                        style={{
                          color: index === 0 ? themeColors.neutral.text.secondary : themeColors.neutral.text.soft
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        className="text-right text-[0.58rem] tabular-nums"
                        style={{
                          color: index === 0 ? themeColors.neutral.text.soft : themeColors.neutral.text.subtle
                        }}
                      >
                        {item.durationFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p
                className="text-[0.7rem] tracking-[0.08em]"
                style={{ color: themeColors.neutral.text.subtle }}
              >
                —
              </p>
            )}
          </div>

      </div>
    </section>
  );
}
