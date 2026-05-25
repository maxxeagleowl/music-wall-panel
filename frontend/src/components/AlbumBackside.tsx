import { motion } from 'framer-motion';
import type { Album, Track } from '../types/music';
import { TrackMenu } from './TrackMenu';
import { rgba, themeColors, themeEffects } from '../theme/colors';

type AlbumBacksideProps = {
  album: Album;
  tracksLoading?: boolean;
  onPlayTrack: (track: Track) => void;
  onQueueTrack: (track: Track) => void;
  onShowTrackDetails: (track: Track) => void;
};

export function AlbumBackside({ album, tracksLoading, onPlayTrack, onQueueTrack, onShowTrackDetails }: AlbumBacksideProps) {
  return (
    <div
      className="flex h-full w-full flex-col rounded-[2rem] p-4 backdrop-blur-xl"
      style={{
        border: themeEffects.border.subtle,
        backgroundColor: themeEffects.neutral.surface.panel,
        color: themeColors.neutral.text.primary
      }}
    >
      <div
        className="mb-3 flex items-end justify-between gap-4 pb-3"
        style={{ borderBottom: `1px solid ${rgba(themeColors.accent.goldSoft, 0.06)}` }}
      >
        <div>
          <h3 className="mt-2 font-display text-2xl tracking-tight">{album.title}</h3>
          <p className="mt-1 text-sm" style={{ color: themeColors.neutral.text.muted }}>{album.artist}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tracksLoading && album.tracks.length === 0 ? (
          <div className="flex h-full items-center justify-center py-8">
            <p
              className="text-[0.72rem] tracking-[0.12em]"
              style={{ color: themeColors.neutral.text.subtle }}
            >
              Lädt Tracklist …
            </p>
          </div>
        ) : album.tracks.length === 0 ? (
          <div className="flex h-full items-center justify-center py-8">
            <p
              className="text-[0.72rem] tracking-[0.12em]"
              style={{ color: themeColors.neutral.text.subtle }}
            >
              Keine Tracks verfügbar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {album.tracks.map((track) => (
              <motion.div
                key={track.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition"
                style={{
                  border: themeEffects.neutral.border.subtle,
                  backgroundColor: themeEffects.neutral.surface.soft
                }}
              >
                <button
                  type="button"
                  onClick={() => onPlayTrack(track)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                >
                  <span className="w-8 shrink-0 font-display text-sm tracking-[0.18em]" style={{ color: themeColors.neutral.text.faint }}>
                    {String(track.number).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-display text-base" style={{ color: themeColors.neutral.text.primary }}>{track.title}</span>
                  <span className="shrink-0 text-sm" style={{ color: themeColors.neutral.text.faint }}>{track.duration}</span>
                </button>
                <TrackMenu
                  track={track}
                  onPlayNow={onPlayTrack}
                  onQueueNext={onQueueTrack}
                  onShowDetails={onShowTrackDetails}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
