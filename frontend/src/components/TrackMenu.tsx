import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Track } from '../types/music';
import { themeColors, themeEffects } from '../theme/colors';

type TrackMenuProps = {
  track: Track;
  onPlayNow: (track: Track) => void;
  onQueueNext: (track: Track) => void;
  onQueueAppend: (track: Track) => void;
  onShowDetails: (track: Track) => void;
};

const actions = [
  { key: 'play',         label: 'Abspielen' },
  { key: 'queue-next',   label: 'Als Naechstes' },
  { key: 'queue-append', label: 'In Warteschlange' },
  { key: 'details',      label: 'Details' }
] as const;

export function TrackMenu({ track, onPlayNow, onQueueNext, onQueueAppend, onShowDetails }: TrackMenuProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: (typeof actions)[number]['key']) => {
    if (action === 'play')         onPlayNow(track);
    if (action === 'queue-next')   onQueueNext(track);
    if (action === 'queue-append') onQueueAppend(track);
    if (action === 'details')      onShowDetails(track);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full transition hover:text-[var(--menu-hover-text)]"
        style={{
          border: themeEffects.neutral.border.soft,
          backgroundColor: themeEffects.neutral.surface.elevated,
          color: themeColors.neutral.text.secondary,
          '--menu-hover-text': themeColors.neutral.text.primary
        } as CSSProperties & Record<string, string>}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreVertical size={18} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl p-2 backdrop-blur-2xl"
            style={{
              border: themeEffects.neutral.border.soft,
              backgroundColor: themeEffects.neutral.surface.panelStrong
            }}
          >
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleAction(action.key);
                }}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm transition hover:bg-[var(--menu-hover-bg)] hover:text-[var(--menu-hover-text)]"
                style={{
                  color: themeColors.neutral.text.secondary,
                  '--menu-hover-bg': themeEffects.neutral.surface.elevated,
                  '--menu-hover-text': themeColors.neutral.text.primary
                } as CSSProperties & Record<string, string>}
              >
                {action.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
