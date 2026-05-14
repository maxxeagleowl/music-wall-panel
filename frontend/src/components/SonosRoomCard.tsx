import { motion } from 'framer-motion';
import { Group, Volume2, VolumeX } from 'lucide-react';
import type { SonosRoom } from '../types/sonos';

type SonosRoomCardProps = {
  room: SonosRoom;
  onVolumeChange: (roomId: string, volume: number) => void;
  onToggleMute: (roomId: string) => void;
  onToggleGroup: (roomId: string) => void;
};

export function SonosRoomCard({ room, onVolumeChange, onToggleMute, onToggleGroup }: SonosRoomCardProps) {
  return (
    <motion.div
      layout
      className={[
        'grid gap-3 px-1 py-4 md:grid-cols-[1fr_1.4fr_auto] md:items-center md:gap-4',
        room.active ? 'bg-white/[0.03]' : 'bg-transparent'
      ].join(' ')}
      animate={{
        opacity: room.active ? 1 : 0.86
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className={[
            'h-2.5 w-2.5 rounded-full',
            room.active ? 'bg-emerald-300 shadow-[0_0_16px_rgba(110,255,180,0.45)]' : 'bg-white/[0.18]'
          ].join(' ')}
        />
        <h3 className="font-display text-[1rem] tracking-[0.12em] text-white/[0.88]">{room.name}</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[0.68rem] tracking-[0.22em] text-white/42">
          <span>Volume</span>
          <span>{room.volume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={room.volume}
          onChange={(event) => onVolumeChange(room.id, Number(event.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-white"
        />
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        <button
          type="button"
          onClick={() => onToggleMute(room.id)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.06] bg-white/[0.04] text-white/72 transition hover:bg-white/[0.08] hover:text-white"
        >
          {room.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        <button
          type="button"
          onClick={() => onToggleGroup(room.id)}
          className="flex h-10 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 text-[0.72rem] tracking-[0.18em] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
        >
          <Group size={15} />
          {room.groupId ? 'Ungroup' : 'Group'}
        </button>
      </div>
    </motion.div>
  );
}
