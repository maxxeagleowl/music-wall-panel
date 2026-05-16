import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import type { Album, Track } from '../types/music';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
import { createMockAlbumTheme } from '../theme/musicTheme';
import { rgba, themeColors, themeEffects } from '../theme/colors';

type NowPlayingProps = {
  album: Album;
  track: Track;
  isPlaying: boolean;
  progress: number;
  total: number;
  highlighted: boolean;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onSeek: (nextSeconds: number) => void;
};

export function NowPlaying({
  album,
  track,
  isPlaying,
  progress,
  total,
  highlighted,
  onPrevious,
  onTogglePlay,
  onNext,
  onSeek
}: NowPlayingProps) {
  const visualTheme = createMockAlbumTheme(album);
  const currentIndex = album.tracks.findIndex(t => t.id === track.id);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const queueTracks = [1, 2, 3, 4].map(offset => {
    const idx = (safeIndex + offset) % album.tracks.length;
    return album.tracks[idx];
  });
  const coverLabel = album.coverText.trim() || visualTheme.textOnCover;

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
            <p
              className="truncate text-[0.56rem] uppercase tracking-[0.34em]"
              style={{
                color: themeColors.neutral.text.faint
              }}
            >
              {album.artist}
            </p>

            <h2
              className="mt-2 truncate font-display text-[1.34rem] leading-[1.02] tracking-[-0.03em]"
              style={{
                color: themeColors.neutral.text.primary
              }}
            >
              {track.title}
            </h2>

            <p
              className="mt-2 truncate text-[0.7rem] tracking-[0.08em]"
              style={{
                color: themeColors.neutral.text.soft
              }}
            >
              {album.title}
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
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: [
                    `radial-gradient(circle at 30% 22%, ${rgba(themeColors.text.primary, 0.11)}, transparent 44%)`,
                    `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.04)}, transparent)`
                  ].join(', ')
                }}
              />

              <div className="relative flex h-full items-center justify-center p-4">
                <span
                  className="inline-flex items-center rounded-full border px-3 py-1 font-display text-[0.7rem] leading-none tracking-[0.2em]"
                  style={{
                    color: visualTheme.textOnCover,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(0, 0, 0, 0.28)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                  }}
                >
                  {coverLabel}
                </span>
              </div>
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

            <div className="space-y-2.5">
              {queueTracks.map((qTrack, index) => (
                <div
                  key={qTrack.id}
                  className="grid items-center gap-3"
                  style={{
                    gridTemplateColumns: '1.7rem 1fr 2.4rem'
                  }}
                >
                  <span
                    className="text-[0.58rem] tabular-nums"
                    style={{
                      color:
                        index === 0
                          ? themeColors.neutral.text.soft
                          : themeColors.neutral.text.subtle
                    }}
                  >
                    {String(qTrack.number).padStart(2, '0')}
                  </span>

                  <span
                    className="truncate text-[0.72rem] tracking-[0.02em]"
                    style={{
                      color:
                        index === 0
                          ? themeColors.neutral.text.secondary
                          : themeColors.neutral.text.faint
                    }}
                  >
                    {qTrack.title}
                  </span>

                  <span
                    className="text-right text-[0.58rem] tabular-nums"
                    style={{
                      color:
                        index === 0
                          ? themeColors.neutral.text.soft
                          : themeColors.neutral.text.subtle
                      }}
                    >
                    {qTrack.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>

      </div>
    </section>
  );
}
