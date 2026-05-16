import type { Album, Track } from '../types/music';
import { AlbumCard } from './AlbumCard';
import { rgba, themeColors, themeEffects } from '../theme/colors';

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
    <div
      className="relative flex h-full min-h-[300px] items-center justify-center overflow-visible rounded-[2rem]"
      style={{
        border: themeEffects.border.subtle,
        backgroundImage: [
          `radial-gradient(circle at center, ${rgba(themeColors.text.primary, 0.07)}, transparent 54%)`,
          themeEffects.gradient.surface
        ].join(', '),
        boxShadow: themeEffects.shadow.wide
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[2rem]"
        style={{
          backgroundImage: [
            `radial-gradient(circle at center, ${rgba(themeColors.accent.goldSoft, 0.14)}, transparent 42%)`,
            `linear-gradient(180deg, ${rgba(themeColors.pageTop, 0.94)}, ${rgba(themeColors.panelDeep, 0.9)})`
          ].join(', ')
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-[10%] top-1/2 h-px -translate-y-1/2"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent, ${rgba(themeColors.accent.goldSoft, 0.08)}, transparent)`
        }}
      />

      <div
        className="pointer-events-none absolute inset-y-[14%] left-1/2 w-px -translate-x-1/2"
        style={{
          backgroundImage: `linear-gradient(180deg, transparent, ${rgba(themeColors.accent.goldSoft, 0.06)}, transparent)`
        }}
      />
    
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-1/2 h-[420px]p w-[1300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              ${rgba(themeColors.accent.bronzeSoft, 0.07)} 0%,
              ${rgba(themeColors.accent.goldSoft, 0.035)} 28%,
              transparent 72%
            )
          `
        }}
      />

      <div
        className="absolute left-1/2 top-[60%] h-[380px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              ${rgba(themeColors.text.primary, 0.025)} 0%,
              transparent 70%
            )
          `
        }}
      />
    </div>

     <div className="relative flex h-full min-h-[300px] w-full items-center justify-center overflow-visible [perspective:1400px] [transform-style:preserve-3d]">
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
