import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { rgba, themeColors, themeEffects } from '../theme/colors';
import { useSpotifySearch } from '../hooks/useSpotifySearch';
import { SearchResults } from './SearchResults';
import type { Album, Playlist, SearchTrack } from '../types/music';

type Props = {
  open: boolean;
  connected: boolean;
  onClose: () => void;
  onSelectAlbum?: (album: Album) => void;
  onSelectTrack?: (track: SearchTrack) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
};

export function SearchOverlay({ open, connected, onClose, onSelectAlbum, onSelectTrack, onSelectPlaylist }: Props) {
  const { query, setQuery, results, loading, clearSearch } = useSpotifySearch(connected);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when overlay opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSearch();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, clearSearch, onClose]);

  function handleClose() {
    clearSearch();
    onClose();
  }

  function handleAlbumSelect(album: Album) {
    onSelectAlbum?.(album);
    handleClose();
  }

  function handleTrackSelect(track: import('../types/music').SearchTrack) {
    onSelectTrack?.(track);
    handleClose();
  }

  function handlePlaylistSelect(playlist: Playlist) {
    onSelectPlaylist?.(playlist);
    handleClose();
  }

  function handleArtistSelect(name: string) {
    setQuery(name);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="search-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-50 flex items-start justify-center pt-20 px-4"
          style={{ backgroundColor: rgba(themeColors.overlay, 0.72) }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ y: -18, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: -18, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-[2rem]"
            style={{
              backgroundColor: themeColors.panel,
              border: themeEffects.border.subtle,
              boxShadow: themeEffects.shadow.hero,
              maxHeight: 'calc(100vh - 8rem)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input bar */}
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: themeEffects.neutral.border.subtle }}
            >
              <Search
                size={16}
                style={{ color: themeColors.neutral.text.muted, flexShrink: 0 }}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Alben, Künstler, Tracks…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent font-display text-[0.92rem] tracking-[0.06em] outline-none placeholder:tracking-[0.1em]"
                style={{
                  color: themeColors.neutral.text.primary,
                }}
              />
              {/* Loading indicator */}
              <AnimatePresence>
                {loading && (
                  <motion.span
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border border-t-transparent"
                    style={{ borderColor: rgba(themeColors.accent.goldSoft, 0.5) }}
                  />
                )}
              </AnimatePresence>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
                style={{
                  backgroundColor: rgba(themeColors.neutral.text.primary, 0.06),
                  color: themeColors.neutral.text.muted,
                }}
              >
                <X size={14} />
              </motion.button>
            </div>

            {/* Results area */}
            <div className="overflow-y-auto px-4 py-4" style={{ flex: 1 }}>
              {!connected ? (
                <div className="py-10 text-center">
                  <p
                    className="font-display text-[0.78rem] uppercase tracking-[0.26em]"
                    style={{ color: themeColors.neutral.text.soft }}
                  >
                    Spotify nicht verbunden
                  </p>
                  <p
                    className="mt-2 text-[0.7rem]"
                    style={{ color: themeColors.neutral.text.muted }}
                  >
                    Verbinde Spotify oben rechts für die Suche.
                  </p>
                </div>
              ) : query.trim().length < 2 ? (
                <div className="py-10 text-center">
                  <p
                    className="font-display text-[0.78rem] uppercase tracking-[0.26em]"
                    style={{ color: themeColors.neutral.text.soft }}
                  >
                    Suche eingeben
                  </p>
                </div>
              ) : (
                <SearchResults
                results={results}
                onSelectAlbum={handleAlbumSelect}
                onSelectTrack={handleTrackSelect}
                onSelectPlaylist={handlePlaylistSelect}
                onSelectArtist={handleArtistSelect}
              />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
