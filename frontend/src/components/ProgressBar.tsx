import { rgba, themeColors, themeEffects } from '../theme/colors';

type ProgressBarProps = {
  progress: number;
  total: number;
  onSeek: (nextSeconds: number) => void;
};

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function ProgressBar({ progress, total, onSeek }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, (progress / total) * 100) : 0;

  return (
    <div className="w-full space-y-1.5">
      <div
        className="flex w-full items-center justify-between text-[0.58rem] tracking-[0.2em]"
        style={{ color: themeColors.neutral.text.muted }}
      >
        <span>{formatTime(progress)}</span>
        <span>{formatTime(total)}</span>
      </div>

      <div className="relative h-8 w-full overflow-visible">
        <div
          className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
          style={{
            backgroundColor: rgba(themeColors.text.primary, 0.08),
            boxShadow: `
              inset 0 1px 0 ${rgba(themeColors.text.primary, 0.035)},
              0 1px 3px ${rgba(themeColors.overlay, 0.45)}
            `
          }}
        />

        <div
          className="absolute left-0 right-0 top-[calc(50%-1px)] h-px rounded-full"
          style={{
            backgroundImage: `linear-gradient(
              90deg,
              transparent,
              ${rgba(themeColors.text.primary, 0.08)},
              transparent
            )`
          }}
        />

        <div
          className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundImage: `linear-gradient(
              90deg,
              ${rgba(themeColors.accent.goldSoft, 0.72)},
              ${rgba(themeColors.text.primary, 0.86)}
            )`,
            boxShadow: `
              0 0 10px ${rgba(themeColors.accent.goldSoft, 0.18)},
              inset 0 1px 0 ${rgba(themeColors.text.primary, 0.22)}
            `
          }}
        />

        <div
          className="absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full"
          style={{
            left: `calc(${percentage}% - 7px)`,
            backgroundImage: `linear-gradient(
              180deg,
              ${rgba(themeColors.text.primary, 0.94)},
              ${rgba(themeColors.accent.goldSoft, 0.82)} 48%,
              ${rgba(themeColors.accent.bronzeSoft, 0.76)}
            )`,
            border: `1px solid ${rgba(themeColors.text.primary, 0.22)}`,
            boxShadow: `
              0 0 0 3px ${rgba(themeColors.accent.goldSoft, 0.055)},
              0 0 16px ${rgba(themeColors.accent.goldSoft, 0.28)},
              0 5px 12px ${rgba(themeColors.overlay, 0.48)},
              inset 0 1px 0 ${rgba(themeColors.text.primary, 0.55)},
              inset 0 -3px 5px ${rgba(themeColors.overlay, 0.26)}
            `
          }}
        >
          <div
            className="absolute left-1/2 top-[3px] h-[3px] w-[5px] -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: rgba(themeColors.text.primary, 0.42)
            }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(total, 1)}
          value={progress}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="absolute inset-x-[-8px] top-0 h-8 cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>
    </div>
  );
}