import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

type PlaybackControlsProps = {
  isPlaying: boolean;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
};

const sideButtonClass =
  'grid h-12 w-12 place-items-center rounded-full border border-white/[0.06] bg-white/[0.04] text-white/65 transition hover:bg-white/[0.08] hover:text-white active:scale-95';

export function PlaybackControls({ isPlaying, onPrevious, onTogglePlay, onNext }: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button type="button" className={sideButtonClass} onClick={onPrevious}>
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        className="grid h-[58px] w-[58px] place-items-center rounded-full border border-white/[0.10] bg-white/[0.12] text-white shadow-[0_0_20px_rgba(255,255,255,0.07)] transition hover:bg-white/[0.16] hover:scale-[1.04] active:scale-95"
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>
      <button type="button" className={sideButtonClass} onClick={onNext}>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
