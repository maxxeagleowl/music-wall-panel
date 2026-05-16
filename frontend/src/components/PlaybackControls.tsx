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
          border: `1px solid ${rgba(themeColors.accent.bronzeSoft, 0.16)}`,
          background: `
            radial-gradient(
              circle at 50% 24%,
              ${rgba(themeColors.text.primary, 0.08)} 0%,
              ${rgba(themeColors.accent.bronzeSoft, 0.16)} 28%,
              transparent 62%
            ),
            linear-gradient(
              180deg,
              ${rgba(themeColors.accent.bronzeSoft, 0.42)} 0%,
              ${rgba(themeColors.accent.bronze, 0.54)} 46%,
              ${rgba(themeColors.accent.bronze, 0.32)} 72%,
              ${rgba(themeColors.panelDeep, 0.05)} 100%
            )
          `,
          color: themeColors.neutral.text.inverse,
          boxShadow: `
            inset 0 1px 0 ${rgba(themeColors.text.primary, 0.07)},
            inset 0 -10px 18px ${rgba(themeColors.overlay, 0.08)},
            0 10px 20px ${rgba(themeColors.overlay, 0.24)}
          `
        }}
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
      </button>

      <button
        type="button"
        className={sideButtonClass}
        style={{
          border: themeEffects.neutral.border.soft,
          backgroundColor: themeEffects.neutral.surface.elevated,
          color: themeColors.neutral.text.secondary
        }}
        onClick={onNext}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}