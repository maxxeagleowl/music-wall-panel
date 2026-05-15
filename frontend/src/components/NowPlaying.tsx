import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import type { Album, Track } from '../types/music';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';
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
  const currentIndex = album.tracks.findIndex(t => t.id === track.id);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const queueTracks = [1, 2, 3, 4].map(offset => {
    const idx = (safeIndex + offset) % album.tracks.length;
    return album.tracks[idx];
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
        <div className="flex items-center pl-2">
          <div className="max-w-[20ch] space-y-1.5 overflow-hidden">
            <p className="truncate text-[0.6rem] tracking-[0.26em] uppercase" style={{ color: themeColors.neutral.text.subtle }}>
              {album.artist}
            </p>
            <h2 className="truncate font-display text-[1.15rem] leading-snug tracking-tight" style={{ color: themeColors.neutral.text.primary }}>
              {track.title}
            </h2>
            <p className="truncate text-[0.67rem] tracking-wide" style={{ color: themeColors.neutral.text.soft }}>{album.title}</p>
          </div>
        </div>

        {/* Zone 2 — Cover */}
        <div className="relative items-center justify-center pl-2 pr-0">
          <div
            className="pointer-events-none absolute aspect-square w-[170px] rounded-full blur-2xl"
            style={{
              background: `radial-gradient(circle, ${rgba(themeColors.accent.bronzeSoft, 0.10)} 0%, transparent 35%)`
            }}
          />
          
          <motion.div
            
            initial={{ rotate: 0 }}
            animate={isPlaying ? { scale: [1, 1.025, 1], rotate: 0 } : { scale: 1, rotate: 0 }}
            transition={
              isPlaying
                ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.5, ease: 'easeOut' }
            }
            className="relative aspect-square w-[168px] overflow-hidden rounded-[1.9rem]"
            style={{
              boxShadow: `none`
            }}
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-xl"
              style={{ background: `${album.accentSoft}, ${album.accent}` }}
            >              
            </div>
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
        <div className="flex flex-col justify-center pl-6 pr-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.57rem] tracking-[0.28em] uppercase" style={{ color: themeColors.neutral.text.soft }}>
              Warteschlange
            </span>
            <MoreHorizontal size={13} className="shrink-0" color={themeColors.neutral.text.subtle} />
          </div>
          <div className="space-y-2.5">
            {queueTracks.map(qTrack => (
              <div key={qTrack.id} className="group flex items-center gap-2.5">
                <span className="w-[1.4rem] shrink-0 text-[0.57rem] tabular-nums" style={{ color: themeColors.neutral.text.subtle }}>
                  {String(qTrack.number).padStart(2, '0')}
                </span>
                <span className="flex-1 truncate text-[0.7rem] tracking-wide transition-colors" style={{ color: themeColors.neutral.text.faint }}>
                  {qTrack.title}
                </span>
                <span className="shrink-0 pl-2 text-[0.58rem] tabular-nums" style={{ color: themeColors.neutral.text.subtle }}>
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
