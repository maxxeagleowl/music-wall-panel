import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

type PlaybackControlsProps = {
  isPlaying: boolean;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
};

const buttonClass =
  'grid h-14 w-14 place-items-center rounded-full border border-white/[0.06] bg-white/[0.04] text-white/76 transition hover:bg-white/[0.08] hover:text-white';

export function PlaybackControls({ isPlaying, onPrevious, onTogglePlay, onNext }: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button type="button" className={buttonClass} onClick={onPrevious}>
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        className="grid h-16 w-16 place-items-center rounded-full border border-white/[0.1] bg-white/[0.12] text-white shadow-[0_0_24px_rgba(255,255,255,0.08)] transition hover:bg-white/[0.16] hover:scale-[1.02]"
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
      </button>
      <button type="button" className={buttonClass} onClick={onNext}>
        <ChevronRight size={24} />
      </button>
    </div>
  );
}
