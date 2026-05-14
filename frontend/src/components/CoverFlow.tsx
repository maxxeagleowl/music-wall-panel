import type { Album, Track } from '../types/music';
import { AlbumCard } from './AlbumCard';

type CoverFlowProps = {
  albums: Album[];
  selectedAlbumId: string;
  flippedAlbumId: string | null;
  onSelectAlbum: (albumId: string) => void;
  onFlipAlbum: (albumId: string) => void;
  onSwipePrev: () => void;
  onSwipeNext: () => void;
  onDropToNowPlaying: (albumId: string) => void;
  onPlayTrack: (albumId: string, track: Track) => void;
  onQueueTrack: (albumId: string, track: Track) => void;
  onShowTrackDetails: (albumId: string, track: Track) => void;
  onDragStateChange: (dragging: boolean) => void;
};

export function CoverFlow({
  albums,
  selectedAlbumId,
  flippedAlbumId,
  onSelectAlbum,
  onFlipAlbum,
  onSwipePrev,
  onSwipeNext,
  onDropToNowPlaying,
  onPlayTrack,
  onQueueTrack,
  onShowTrackDetails,
  onDragStateChange
}: CoverFlowProps) {
  const selectedIndex = albums.findIndex((album) => album.id === selectedAlbumId);
  const safeSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const half = albums.length / 2;

  function getCircularOffset(index: number) {
    const rawOffset = index - safeSelectedIndex;

    if (rawOffset > half) {
      return rawOffset - albums.length;
    }

    if (rawOffset < -half) {
      return rawOffset + albums.length;
    }

    return rawOffset;
  }

  return (
    <div className="relative flex h-full min-h-[420px] items-center justify-center overflow-visible rounded-[2rem] border border-white/[0.06] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_54%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(120,145,190,0.14),transparent_42%),linear-gradient(180deg,rgba(4,6,10,0.94),rgba(9,11,16,0.9))]" />

      <div className="pointer-events-none absolute inset-x-[10%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="pointer-events-none absolute inset-y-[14%] left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

      <div className="relative flex h-full min-h-[420px] w-full items-center justify-center overflow-visible [perspective:1400px] [transform-style:preserve-3d]">
        {albums.map((album, index) => {
          const circularOffset = getCircularOffset(index);

          return (
            <AlbumCard
              key={album.id}
              album={album}
              offset={circularOffset}
              selected={album.id === selectedAlbumId}
              flipped={flippedAlbumId === album.id}
              onSelect={() => onSelectAlbum(album.id)}
              onFlip={() => onFlipAlbum(album.id)}
              onSwipePrev={onSwipePrev}
              onSwipeNext={onSwipeNext}
              onDropToNowPlaying={() => onDropToNowPlaying(album.id)}
              onPlayTrack={(track) => onPlayTrack(album.id, track)}
              onQueueTrack={(track) => onQueueTrack(album.id, track)}
              onShowTrackDetails={(track) => onShowTrackDetails(album.id, track)}
              onDragStateChange={onDragStateChange}
            />
          );
        })}
      </div>
    </div>
  );
}