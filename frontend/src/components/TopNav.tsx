import { motion } from 'framer-motion';
import { rgba, themeColors } from '../theme/colors';
import type { SpotifyStatus } from '../api/spotifyAuthApi';

type TopNavProps = {
  active: string;
  onSelect: (item: string) => void;
  spotifyStatus: SpotifyStatus;
  onSpotifyLogout: () => void;
};

const items = ['Auswahl', 'Playlists', 'Favoriten', 'Suche'];

function SpotifyControl({
  status,
  onLogout,
}: {
  status: SpotifyStatus;
  onLogout: () => void;
}) {
  if (status.connected) {
    return (
      <button
        type="button"
        title="Spotify abmelden"
        onClick={onLogout}
        className="group flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors"
        style={{
          backgroundColor: rgba(themeColors.accent.goldSoft, 0.06),
          border: `1px solid ${rgba(themeColors.accent.goldSoft, 0.12)}`,
        }}
      >
        {/* Pulsing green dot */}
        <motion.span
          className="block h-1.5 w-1.5 shrink-0 rounded-full"
          animate={{ opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{ backgroundColor: '#5ecf7e' }}
        />
        <span
          className="max-w-[9rem] truncate font-display text-[0.7rem] tracking-[0.18em] transition-colors"
          style={{ color: themeColors.neutral.text.muted }}
        >
          {status.user?.displayName ?? 'Verbunden'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = '/api/auth/spotify/login';
      }}
      className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors"
      style={{
        backgroundColor: rgba(themeColors.neutral.surface.elevated, 1),
        border: `1px solid ${rgba(themeColors.neutral.border.soft, 1)}`,
      }}
    >
      <span
        className="block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: themeColors.neutral.text.subtle }}
      />
      <span
        className="font-display text-[0.7rem] tracking-[0.18em]"
        style={{ color: themeColors.neutral.text.faint }}
      >
        Spotify verbinden
      </span>
    </button>
  );
}

export function TopNav({ active, onSelect, spotifyStatus, onSpotifyLogout }: TopNavProps) {
  return (
    <nav
      className="flex h-full items-center rounded-[1.4rem] border-b px-4 py-2 backdrop-blur-2xl"
      style={{
        borderBottomColor: rgba(themeColors.accent.goldSoft, 0.08),
        backgroundColor: rgba(themeColors.text.primary, 0.02),
      }}
    >
      {/* Left spacer — mirrors the spotify control width to keep nav items centered */}
      <div className="w-36 shrink-0" />

      {/* Nav items */}
      <div className="flex flex-1 items-center justify-center gap-3 sm:gap-6">
        {items.map((item) => {
          const isActive = active === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className="relative min-h-12 min-w-0 flex-1 px-2 py-2 text-center font-display text-[0.88rem] tracking-[0.26em] transition-colors"
              style={{ color: isActive ? themeColors.neutral.text.primary : themeColors.neutral.text.faint }}
            >
              <span className="relative z-10">{item}</span>
              <motion.span
                layout
                className="absolute inset-x-3 bottom-1 h-px origin-center rounded-full"
                animate={{
                  backgroundColor: isActive
                    ? rgba(themeColors.accent.goldSoft, 0.88)
                    : themeColors.neutral.border.strong,
                  opacity: isActive ? 1 : 0.55,
                  scaleX: isActive ? 1 : 0.35,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 1 }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
                animate={{
                  opacity: isActive ? 0.9 : 0.15,
                  scale: isActive ? 1 : 0.7,
                  backgroundColor: isActive
                    ? themeColors.accent.goldSoft
                    : themeColors.neutral.text.subtle,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              />
            </button>
          );
        })}
      </div>

      {/* Spotify status control — right side */}
      <div className="flex w-36 shrink-0 justify-end">
        <SpotifyControl status={spotifyStatus} onLogout={onSpotifyLogout} />
      </div>
    </nav>
  );
}
