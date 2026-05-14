import type { SonosRoom } from '../types/sonos';
import { SonosRoomCard } from './SonosRoomCard';

type SonosPanelProps = {
  rooms: SonosRoom[];
  onVolumeChange: (roomId: string, volume: number) => void;
  onToggleMute: (roomId: string) => void;
  onToggleGroup: (roomId: string) => void;
};

export function SonosPanel({ rooms, onVolumeChange, onToggleMute, onToggleGroup }: SonosPanelProps) {
  return (
    <section className="glass-panel h-full rounded-[2rem] border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-2xl">
      <div className="divide-y divide-white/[0.05]">
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
    </section>
  );
}
