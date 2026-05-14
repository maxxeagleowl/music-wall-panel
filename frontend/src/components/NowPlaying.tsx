import { motion } from 'framer-motion';
import type { Album, Track } from '../types/music';
import { PlaybackControls } from './PlaybackControls';
import { ProgressBar } from './ProgressBar';

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
  return (
    <section
      className={[
        'glass-panel h-full rounded-[2rem] border transition',
        highlighted
          ? 'border-white/[0.18] bg-white/[0.07] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_26px_80px_rgba(0,0,0,0.3)]'
          : 'border-white/[0.06] bg-white/[0.035]'
      ].join(' ')}
    >
      <div className="grid h-full grid-cols-1 gap-4 px-5 py-4 md:grid-cols-[1.05fr_0.95fr_1.05fr]">
        <div className="flex items-center">
          <div className="space-y-2">
            <h2 className="max-w-[11ch] font-display text-[clamp(1.9rem,2.4vw,3rem)] leading-[0.92] tracking-tight text-white">
              {track.title}
            </h2>
            <p className="font-display text-[1rem] tracking-[0.2em] text-white/70">{album.artist}</p>
            <p className="text-sm text-white/[0.46]">{album.title}</p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <motion.div
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={isPlaying ? { duration: 32, repeat: Infinity, ease: 'linear' } : { duration: 0.4 }}
            className="relative aspect-square w-[clamp(11rem,14vw,15rem)] rounded-[2rem] border border-white/[0.08] bg-panel-850 p-2 shadow-[0_18px_54px_rgba(0,0,0,0.3)]"
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-[1.55rem]"
              style={{ background: `${album.accentSoft}, ${album.accent}` }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.3))]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-full border border-white/[0.12] bg-black/[0.14] px-4 py-3 text-center">
                  <div className="font-display text-[clamp(1.4rem,1.8vw,2rem)] tracking-[0.28em] text-white">
                    {album.coverText}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex h-full flex-col justify-center gap-4">
          <PlaybackControls isPlaying={isPlaying} onPrevious={onPrevious} onTogglePlay={onTogglePlay} onNext={onNext} />
          <ProgressBar progress={progress} total={total} onSeek={onSeek} />
        </div>
      </div>
    </section>
  );
}
