import { motion } from 'framer-motion';
import type { Album, Track } from '../types/music';
import { TrackMenu } from './TrackMenu';

type AlbumBacksideProps = {
  album: Album;
  onPlayTrack: (track: Track) => void;
  onQueueTrack: (track: Track) => void;
  onShowTrackDetails: (track: Track) => void;
};

export function AlbumBackside({ album, onPlayTrack, onQueueTrack, onShowTrackDetails }: AlbumBacksideProps) {
  return (
    <div className="flex h-full w-full flex-col rounded-[2rem] border border-white/[0.08] bg-panel-850/[0.88] p-4 text-white backdrop-blur-xl">
      <div className="mb-3 flex items-end justify-between gap-4 border-b border-white/[0.06] pb-3">
        <div>
          <h3 className="mt-2 font-display text-2xl tracking-tight text-white">{album.title}</h3>
          <p className="mt-1 text-sm text-white/[0.52]">{album.artist}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {album.tracks.map((track) => (
          <motion.div
            key={track.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.05]"
          >
            <button
              type="button"
              onClick={() => onPlayTrack(track)}
              className="flex min-w-0 flex-1 items-center gap-4 text-left"
            >
              <span className="w-8 shrink-0 font-display text-sm tracking-[0.18em] text-white/[0.44]">
                {String(track.number).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1 truncate font-display text-base text-white">{track.title}</span>
              <span className="shrink-0 text-sm text-white/[0.44]">{track.duration}</span>
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
    </div>
  );
}
