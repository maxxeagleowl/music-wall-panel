import { AnimatePresence, motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
import type { Track } from '../types/music';

type TrackMenuProps = {
  track: Track;
  onPlayNow: (track: Track) => void;
  onQueueNext: (track: Track) => void;
  onShowDetails: (track: Track) => void;
};

const actions = [
  { key: 'play', label: 'Abspielen' },
  { key: 'queue-next', label: 'Als Naechstes' },
  { key: 'queue', label: 'In Warteschlange' },
  { key: 'details', label: 'Details' }
] as const;

export function TrackMenu({ track, onPlayNow, onQueueNext, onShowDetails }: TrackMenuProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: (typeof actions)[number]['key']) => {
    if (action === 'play') onPlayNow(track);
    if (action === 'queue-next' || action === 'queue') onQueueNext(track);
    if (action === 'details') onShowDetails(track);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.06] bg-white/[0.04] text-white/66 transition hover:bg-white/[0.08] hover:text-white"
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
            className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-2xl border border-white/[0.06] bg-panel-850/[0.94] p-2 backdrop-blur-2xl"
          >
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleAction(action.key);
                }}
                className="flex w-full items-center rounded-xl px-4 py-3 text-left text-sm text-white/[0.74] transition hover:bg-white/[0.08] hover:text-white"
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
