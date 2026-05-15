import { motion } from 'framer-motion';
import { Group, Volume2, VolumeX, Waves } from 'lucide-react';
import type { SonosRoom } from '../types/sonos';

type SonosRoomCardProps = {
  room: SonosRoom;
  onVolumeChange: (roomId: string, volume: number) => void;
  onToggleMute: (roomId: string) => void;
  onToggleGroup: (roomId: string) => void;
};

export function SonosRoomCard({
  room,
  onVolumeChange,
  onToggleMute,
  onToggleGroup
}: SonosRoomCardProps) {

  const isGrouped = Boolean(room.groupId);

  const isInactive = !room.active;
  const isAudible = room.active && room.volume > 0;
  const isSilenced = room.active && room.volume === 0;

  const volumeWidth = room.active ? room.volume : 0;

  return (
    <motion.article
      layout
      whileTap={{ scale: 0.985 }}
      animate={{ opacity: room.active ? 1 : 0.55 }}
      transition={{ type: 'spring', stiffness: 170, damping: 24 }}
      className="relative h-full rounded-[1.8rem] border border-white/[0.06] bg-gradient-to-b from-white/[0.045] to-white/[0.02] shadow-[0_14px_40px_rgba(0,0,0,0.32)]"
    >
      <div
        className="grid h-full w-full"
        style={{
           gridTemplateColumns: `
            0.12fr   /* A */
            1.1fr    /* B */
            2.3fr    /* C */
            0.08fr   /* D */
            0.9fr    /* E */
            0.05fr   /* F */
          `,
          gridTemplateRows: `
            0.08fr   /* 1 top spacer */
            1.2fr    /* 2 main */
            0.18fr   /* 3 middle spacer */
            3.2rem   /* 4 fixed volume */
            0.3fr    /* 5 bottom spacer */
          `
        }}
      >

        {/* SPEAKER B2 */}
        <div style={{ gridColumn: '2', gridRow: '2' }} className="flex items-center">
          <div
            className={[
              'grid h-[6.2rem] w-[6.2rem] place-items-center rounded-[1.3rem] border transition',
              isInactive
                ? 'border-white/[0.04] bg-black/[0.18] text-white/25'
                : 'border-white/[0.06] bg-black/[0.22] text-white/70'
            ].join(' ')}
          >
            <Waves size={42} />
          </div>
        </div>

        {/* STATUS + ROOM C2 */}
        <div style={{ gridColumn: '3', gridRow: '2' }} className="flex flex-col justify-center gap-3">
          <div className="flex items-center gap-3">
            <span
              className={[
                'h-3 w-3 rounded-full transition',
                isInactive
                  ? 'bg-white/[0.18]'
                  : 'bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.95)]'
              ].join(' ')}
            />
            <span className="text-[0.6rem] uppercase tracking-[0.32em] text-white/55">
              {room.active ? 'Online' : 'Standby'}
            </span>
          </div>

          <h3 className="font-display text-[1.5rem] leading-none tracking-[0.03em] text-white/95">
            {room.name}
          </h3>
        </div>

        {/* GROUP E2 */}
        <div style={{ gridColumn: '5', gridRow: '2' }} className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onToggleGroup(room.id)}
            className={[
              'grid h-[3.6rem] w-[3.6rem] place-items-center rounded-full border transition active:scale-95',
              isGrouped && room.active
                ? 'border-sky-300/[0.35] bg-sky-300/[0.14] text-sky-100'
                : 'border-white/[0.08] bg-white/[0.04] text-white/60'
            ].join(' ')}
          >
            <Group size={22} />
          </button>
        </div>

        {/* VOLUME B4 + C4 */}
        <div style={{ gridColumn: '2 / 4', gridRow: '4' }} className="flex flex-col justify-center gap-2">

          <span className="text-[0.6rem] uppercase tracking-[0.34em] text-white/40">
            Volume
          </span>

          <div className="relative h-5 w-full">
            <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/[0.18]" />

            <motion.div
              className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-300/90 to-white"
              animate={{ width: `${volumeWidth}%` }}
              transition={{ duration: 0.25 }}
            />

            <motion.div
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white"
              animate={{ left: `calc(${volumeWidth}% - 8px)` }}
              transition={{ duration: 0.25 }}
            />

            <input
              type="range"
              min={0}
              max={100}
              value={room.volume}
              onChange={(event) =>
                onVolumeChange(room.id, Number(event.target.value))
              }
              className="absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent opacity-0"
            />
          </div>
        </div>

        {/* MUTE E4 */}
        <div style={{ gridColumn: '5', gridRow: '4' }} className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onToggleMute(room.id)}
            className={[
              'grid h-[3.6rem] w-[3.6rem] place-items-center rounded-full border transition active:scale-95',
              isInactive
                ? 'border-white/[0.04] bg-white/[0.02] text-white/25'
                : isSilenced
                  ? 'border-sky-300/[0.35] bg-sky-300/[0.14] text-sky-100'
                  : isAudible
                    ? 'border-sky-300/[0.35] bg-sky-300/[0.14] text-sky-100'
                    : 'border-white/[0.08] bg-white/[0.04] text-white/50'
            ].join(' ')}
          >
            {room.volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
        </div>

      </div>
    </motion.article>
  );
}