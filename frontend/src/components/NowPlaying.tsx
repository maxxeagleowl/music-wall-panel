import { motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
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
  const currentIndex = album.tracks.findIndex(t => t.id === track.id);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const queueTracks = [1, 2, 3].map(offset => {
    const idx = (safeIndex + offset) % album.tracks.length;
    return album.tracks[idx];
  });

  return (
    <section
      className={[
        'glass-panel h-full rounded-[2rem] border transition duration-300',
        highlighted
          ? 'border-white/[0.22] bg-white/[0.09] shadow-[0_0_0_1px_rgba(255,255,255,0.10),0_0_52px_rgba(255,255,255,0.06),0_26px_80px_rgba(0,0,0,0.3)]'
          : 'border-white/[0.06] bg-white/[0.035]'
      ].join(' ')}
    >
      <div
        className="grid h-full items-center px-6 py-4"
        style={{ gridTemplateColumns: '1.0fr 1fr 1.7fr 1.6fr' }}
      >

        {/* Zone 1 — Metadata */}
        <div className="flex items-center pl-2">
          <div className="max-w-[20ch] space-y-1.5 overflow-hidden">
            <p className="truncate text-[0.6rem] tracking-[0.26em] uppercase text-white/38">
              {album.artist}
            </p>
            <h2 className="truncate font-display text-[1.15rem] leading-snug tracking-tight text-white">
              {track.title}
            </h2>
            <p className="truncate text-[0.67rem] tracking-wide text-white/28">{album.title}</p>
          </div>
        </div>

        {/* Zone 2 — Cover */}
        <div className="flex items-center justify-center pl-2 pr-0">
          <motion.div
            initial={{ rotate: 0 }}
            animate={isPlaying ? { scale: [1, 1.025, 1], rotate: 0 } : { scale: 1, rotate: 0 }}
            transition={
              isPlaying
                ? { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.5, ease: 'easeOut' }
            }
            className="relative aspect-square w-[128px] rounded-2xl border border-white/[0.07] bg-panel-850 p-1.5 shadow-[0_10px_36px_rgba(0,0,0,0.38)]"
          >
            <div
              className="relative h-full w-full overflow-hidden rounded-xl"
              style={{ background: `${album.accentSoft}, ${album.accent}` }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.3))]" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="rounded-full border border-white/[0.12] bg-black/[0.14] px-3 py-2 text-center">
                  <div className="font-display text-[0.7rem] tracking-[0.2em] text-white">
                    {album.coverText}
                  </div>
                </div>
              </div>
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
            <span className="text-[0.57rem] tracking-[0.28em] uppercase text-white/28">
              Warteschlange
            </span>
            <MoreHorizontal size={13} className="text-white/18 shrink-0" />
          </div>
          <div className="space-y-2.5">
            {queueTracks.map(qTrack => (
              <div key={qTrack.id} className="group flex items-center gap-2.5">
                <span className="w-[1.4rem] shrink-0 text-[0.57rem] tabular-nums text-white/18">
                  {String(qTrack.number).padStart(2, '0')}
                </span>
                <span className="flex-1 truncate text-[0.7rem] tracking-wide text-white/44 transition-colors group-hover:text-white/62">
                  {qTrack.title}
                </span>
                <span className="shrink-0 pl-2 text-[0.58rem] tabular-nums text-white/22">
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
