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
      <div className="flex w-full items-center justify-between text-[0.6rem] tracking-[0.2em] text-white/30">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(total)}</span>
      </div>

      <div className="relative h-7 w-full overflow-hidden">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-white/[0.12]">
          <div
            className="h-px rounded-full bg-gradient-to-r from-white/40 to-white/70"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(total, 1)}
          value={progress}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="absolute inset-0 h-7 w-full cursor-pointer appearance-none bg-transparent opacity-0"
        />
      </div>
    </div>
  );
}