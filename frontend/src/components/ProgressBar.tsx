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
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[0.68rem] tracking-[0.22em] text-white/[0.4]">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(total)}</span>
      </div>
      <div className="relative">
        <div className="h-1.5 rounded-full bg-white/[0.08]">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-white/[0.5] to-white/[0.82] shadow-[0_0_14px_rgba(255,255,255,0.16)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(total, 1)}
          value={progress}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="absolute inset-[-16px_0] h-8 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}
