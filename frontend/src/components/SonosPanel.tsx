import { motion } from 'framer-motion';
import type { SonosRoom } from '../types/sonos';
import { SonosRoomCard } from './SonosRoomCard';
import { themeColors, themeEffects } from '../theme/colors';

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
    <section
      className="glass-panel relative h-full min-h-0 overflow-hidden rounded-[2rem] px-4 py-3 backdrop-blur-2xl"
      style={{
        border: themeEffects.border.subtle,
        backgroundColor: themeEffects.neutral.surface.soft
      }}
    >
      <div className="relative grid h-full min-h-0 grid-cols-[0.62fr_4fr] gap-4">
        <div
          className="flex min-h-0 flex-col justify-between rounded-[1.55rem] px-4 py-4"
          style={{
            border: themeEffects.neutral.border.subtle,
            backgroundColor: themeEffects.neutral.surface.overlay
          }}
        >
          <p className="font-display text-[0.9rem] uppercase tracking-[0.55rem]" style={{ color: themeColors.neutral.text.faint }}>
            Sonos
          </p>

          <div>
            <p className="mb-3 text-[0.6rem] uppercase tracking-[0.28em]" style={{ color: themeColors.neutral.text.subtle }}>
              Aktive Gruppe
            </p>

            <motion.p
              key={activeGroupLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[1.1rem] leading-snug tracking-wide"
              style={{ color: themeColors.neutral.text.secondary }}
            >
              {activeGroupLabel}
            </motion.p>

            <p className="mt-3 text-[0.9rem] tracking-wide" style={{ color: themeColors.neutral.text.soft }}>
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
