import { motion } from 'framer-motion';
import { Group, Volume2, VolumeX, Waves } from 'lucide-react';
import type { SonosRoom } from '../types/sonos';
import { rgba, themeColors, themeEffects } from '../theme/colors';

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
  const volumeWidth = room.active ? room.volume : 0;

  return (
    <motion.article
      layout
      whileTap={{ scale: 0.985 }}
      animate={{ opacity: room.active ? 1 : 0.55 }}
      transition={{
        type: 'spring',
        stiffness: 110,
        damping: 22,
        mass: 1.25
      }}
      className="relative h-full overflow-hidden rounded-[1.8rem]"
      style={{
        border: themeEffects.border.subtle,
        backgroundImage: [
          `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.06)}, ${rgba(themeColors.text.primary, 0.018)})`,
          `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.02)}, transparent 28%, ${rgba(themeColors.overlay, 0.12)} 100%)`
        ].join(', '),
        boxShadow: `
          0 18px 42px ${rgba(themeColors.overlay, 0.34)},
          inset 0 -18px 30px ${rgba(themeColors.overlay, 0.16)},
          inset 0 1px 0 ${rgba(themeColors.text.primary, 0.04)}
        `
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-[1.2rem] top-[0.9rem] h-px rounded-full"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, ${rgba(themeColors.accent.goldSoft, 0.14)}, transparent)`
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-[1.8rem]"
        style={{
          backgroundImage: `linear-gradient(180deg, transparent, ${rgba(themeColors.overlay, 0.12)})`
        }}
      />

      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `
            0.12fr
            1.1fr
            2.3fr
            0.08fr
            0.9fr
            0.05fr
          `,
          gridTemplateRows: `
            0.08fr
            1.2fr
            0.18fr
            3.2rem
            0.3fr
          `
        }}
      >
        {/* SPEAKER B2 */}
        <div style={{ gridColumn: '2', gridRow: '2' }} className="flex items-center">
          <div
            className="grid h-[6.2rem] w-[6.2rem] place-items-center rounded-[1.3rem] border transition"
            style={{
              border: isInactive
                ? themeEffects.neutral.border.subtle
                : themeEffects.neutral.border.soft,
              background: `
                linear-gradient(
                  180deg,
                  ${rgba(themeColors.text.primary, isInactive ? 0.032 : 0.045)} 0%,
                  ${rgba(themeColors.text.primary, isInactive ? 0.014 : 0.018)} 28%,
                  ${rgba(themeColors.overlay, isInactive ? 0.16 : 0.22)} 100%
                )
              `,
              boxShadow: `
                inset 0 1px 0 ${rgba(themeColors.text.primary, 0.05)},
                inset 0 -12px 18px ${rgba(themeColors.overlay, 0.22)}
              `,
              color: isInactive
                ? themeColors.neutral.text.subtle
                : themeColors.neutral.text.secondary
            }}
          >
            <Waves size={42} />
          </div>
        </div>

        {/* STATUS + ROOM C2 */}
        <div style={{ gridColumn: '3', gridRow: '2' }} className="flex flex-col justify-center gap-3">
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 rounded-full transition"
              style={
                isInactive
                  ? {
                      backgroundColor: themeColors.neutral.text.subtle
                    }
                  : {
                      backgroundColor: themeColors.accent.goldSoft,
                      boxShadow: `0 0 18px ${rgba(themeColors.accent.goldSoft, 0.95)}`
                    }
              }
            />

            <span
              className="text-[0.6rem] uppercase tracking-[0.32em]"
              style={{ color: themeColors.neutral.text.muted }}
            >
              {room.active ? 'Online' : 'Standby'}
            </span>
          </div>

          <h3
            className="font-display text-[1.5rem] leading-none tracking-[0.03em]"
            style={{ color: themeColors.neutral.text.primary }}
          >
            {room.name}
          </h3>
        </div>

        {/* GROUP E2 */}
        <div style={{ gridColumn: '5', gridRow: '2' }} className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onToggleGroup(room.id)}
            className="grid h-[3.6rem] w-[3.6rem] place-items-center rounded-full border transition active:scale-95"
            style={
              isGrouped && room.active
                ? {
                    border: `1px solid ${rgba(themeColors.accent.goldSoft, 0.16)}`,
                    backgroundColor: rgba(themeColors.accent.goldSoft, 0.12),
                    boxShadow: `
                      inset 0 1px 0 ${rgba(themeColors.text.primary, 0.08)},
                      0 8px 22px ${rgba(themeColors.overlay, 0.22)}
                    `,
                    color: themeColors.neutral.text.primary
                  }
                : {
                    border: `1px solid ${rgba(themeColors.accent.goldSoft, 0.08)}`,
                    backgroundImage: `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.05)}, ${rgba(themeColors.overlay, 0.08)})`,
                    boxShadow: `
                      inset 0 1px 0 ${rgba(themeColors.text.primary, 0.08)},
                      0 8px 22px ${rgba(themeColors.overlay, 0.18)}
                    `,
                    color: room.active
                      ? themeColors.neutral.text.secondary
                      : themeColors.neutral.text.subtle
                  }
            }
          >
            <Group size={22} />
          </button>
        </div>

        {/* VOLUME B4 + C4 */}
        <div style={{ gridColumn: '2 / 4', gridRow: '4' }} className="flex flex-col justify-center gap-2">
          <span
            className="text-[0.6rem] uppercase tracking-[0.34em]"
            style={{ color: themeColors.neutral.text.soft }}
          >
            Volume
          </span>

          <div className="relative h-5 w-full">
            <div
              className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
              style={{ backgroundColor: themeColors.neutral.border.strong }}
            />

            <motion.div
              className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
              style={{ backgroundImage: themeEffects.gradient.accent }}
              animate={{ width: `${volumeWidth}%` }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 30,
                mass: 0.45
              }}
            />

            <motion.div
              className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: themeColors.accent.goldSoft }}
              animate={{ left: `calc(${volumeWidth}% - 8px)` }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 30,
                mass: 0.45
              }}
            />

            <input
              type="range"
              min={0}
              max={100}
              value={room.volume}
              onChange={(event) => onVolumeChange(room.id, Number(event.target.value))}
              className="absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent opacity-0"
            />
          </div>
        </div>

        {/* MUTE E4 */}
        <div style={{ gridColumn: '5', gridRow: '4' }} className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => onToggleMute(room.id)}
            className="grid h-[3.6rem] w-[3.6rem] place-items-center rounded-full border transition active:scale-95"
            style={
              !room.active
                ? {
                    border: themeEffects.neutral.border.subtle,
                    backgroundImage: `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.035)}, ${rgba(themeColors.overlay, 0.06)})`,
                    boxShadow: `
                      inset 0 1px 0 ${rgba(themeColors.text.primary, 0.08)},
                      inset 0 -6px 10px ${rgba(themeColors.overlay, 0.1)}
                    `,
                    color: themeColors.neutral.text.subtle
                  }
                : room.volume === 0
                  ? {
                      border: themeEffects.neutral.border.soft,
                      backgroundImage: `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.05)}, ${rgba(themeColors.overlay, 0.08)})`,
                      boxShadow: `
                        inset 0 1px 0 ${rgba(themeColors.text.primary, 0.08)},
                        0 8px 22px ${rgba(themeColors.overlay, 0.2)}
                      `,
                      color: themeColors.neutral.text.soft
                    }
                  : {
                      border: `1px solid ${rgba(themeColors.accent.goldSoft, 0.16)}`,
                      backgroundColor: rgba(themeColors.accent.goldSoft, 0.12),
                      boxShadow: `
                        inset 0 1px 0 ${rgba(themeColors.text.primary, 0.08)},
                        0 8px 22px ${rgba(themeColors.overlay, 0.22)}
                      `,
                      color: themeColors.neutral.text.primary
                    }
            }
          >
            {room.volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
        </div>
      </div>
    </motion.article>
  );
}