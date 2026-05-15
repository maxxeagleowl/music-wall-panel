import { motion } from 'framer-motion';
import type { SonosRoom } from '../types/sonos';
import { SonosRoomCard } from './SonosRoomCard';

type SonosPanelProps = {
  rooms: SonosRoom[];
  onVolumeChange: (roomId: string, volume: number) => void;
  onToggleMute: (roomId: string) => void;
  onToggleGroup: (roomId: string) => void;
};

export function SonosPanel({
  rooms,
  onVolumeChange,
  onToggleMute,
  onToggleGroup
}: SonosPanelProps) {
  const groupedRooms = rooms.filter((room) => room.groupId);
  const activeGroupLabel =
    groupedRooms.length > 1
      ? groupedRooms.map((room) => room.name).join('  ')
      : 'Keine aktive Gruppe';

  return (
    <section className="glass-panel relative h-full min-h-0 overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-2xl">
      <div className="relative grid h-full min-h-0 grid-cols-[0.62fr_4fr] gap-4">
        <div className="flex min-h-0 flex-col justify-between rounded-[1.55rem] border border-white/[0.055] bg-black/[0.18] px-4 py-4">
          <p className="font-display text-[0.9rem] uppercase tracking-[0.55rem] text-white/46">
            Sonos
          </p>

          <div>
            <p className="mb-3 text-[0.6rem] uppercase tracking-[0.28em] text-white/30">
              Aktive Gruppe
            </p>

            <motion.p
              key={activeGroupLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[1.1rem] leading-snug tracking-wide text-white/66"
            >
              {activeGroupLabel}
            </motion.p>

            <p className="mt-3 text-[0.9rem] tracking-wide text-white/34">
              {groupedRooms.length > 1 ? `${groupedRooms.length} Lautsprecher` : ''}
            </p>
          </div>
        </div>

        <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-3">
          {rooms.map((room) => (
            <SonosRoomCard
              key={room.id}
              room={room}
              onVolumeChange={onVolumeChange}
              onToggleMute={onToggleMute}
              onToggleGroup={onToggleGroup}
            />
          ))}
        </div>
      </div>
    </section>
  );
}