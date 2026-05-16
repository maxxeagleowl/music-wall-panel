import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { rgba, themeColors, themeEffects } from '../theme/colors';

type PlaybackControlsProps = {
  isPlaying: boolean;
  onPrevious: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
};

const sideButtonClass =
  'grid h-12 w-12 place-items-center rounded-full transition hover:scale-[1.02] active:scale-95';

export function PlaybackControls({ isPlaying, onPrevious, onTogglePlay, onNext }: PlaybackControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        className={sideButtonClass}
        style={{
          border: themeEffects.neutral.border.soft,
          backgroundColor: themeEffects.neutral.surface.elevated,
          color: themeColors.neutral.text.secondary
        }}
        onClick={onPrevious}
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        className="grid h-[58px] w-[58px] place-items-center rounded-full transition hover:scale-[1.04] active:scale-95"
        style={{
          border: themeEffects.border.active,
          backgroundImage: themeEffects.gradient.accent,
          color: themeColors.neutral.text.inverse,
          boxShadow: themeEffects.glow.medium
        }}
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>
      <button
        type="button"
        className={sideButtonClass}
        style={{
          border: `1px solid ${rgba(themeColors.accent.goldSoft, 0.22)}`,
          background: `
            linear-gradient(
              180deg,
              ${rgba(themeColors.accent.goldSoft, 0.42)} 0%,
              ${rgba(themeColors.accent.bronzeSoft, 0.58)} 42%,
              ${rgba(themeColors.panelDeep, 0.96)} 100%
            )
          `,
          color: themeColors.neutral.text.inverse,
          boxShadow: `
            inset 0 1px 0 ${rgba(themeColors.text.primary, 0.08)},
            0 10px 22px ${rgba(themeColors.overlay, 0.28)},
            0 0 18px ${rgba(themeColors.accent.goldSoft, 0.12)}
          `
        }}
        onClick={onNext}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
