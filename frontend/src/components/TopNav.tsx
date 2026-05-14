import { motion } from 'framer-motion';

type TopNavProps = {
  active: string;
  onSelect: (item: string) => void;
};

const items = ['Auswahl', 'Playlists', 'Favoriten', 'Suche'];

export function TopNav({ active, onSelect }: TopNavProps) {
  return (
    <nav className="flex h-full items-center justify-center rounded-[1.4rem] border-b border-white/[0.08] bg-white/[0.02] px-3 py-2 backdrop-blur-2xl">
      <div className="flex w-full max-w-2xl items-center justify-center gap-3 sm:gap-6">
        {items.map((item) => {
          const isActive = active === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={[
                'relative min-h-12 min-w-0 flex-1 px-2 py-2 text-center font-display text-[0.88rem] tracking-[0.26em] transition-colors',
                isActive ? 'text-white' : 'text-white/55'
              ].join(' ')}
            >
              <span className="relative z-10">{item}</span>
              <motion.span
                layout
                className="absolute inset-x-3 bottom-1 h-px origin-center rounded-full"
                animate={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.14)',
                  opacity: isActive ? 1 : 0.55,
                  scaleX: isActive ? 1 : 0.35
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
                animate={{ opacity: isActive ? 0.9 : 0.15, scale: isActive ? 1 : 0.7 }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
