import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import type { Album, Track } from '../types/music';
import { AlbumBackside } from './AlbumBackside';

type AlbumCardProps = {
  album: Album;
  offset: number;
  selected: boolean;
  flipped: boolean;
  onSelect: () => void;
  onFlip: () => void;
  onSwipePrev: () => void;
  onSwipeNext: () => void;
  onDropToNowPlaying: () => void;
  onPlayTrack: (track: Track) => void;
  onQueueTrack: (track: Track) => void;
  onShowTrackDetails: (track: Track) => void;
  onDragStateChange: (dragging: boolean) => void;
};

function getVisuals(offset: number, selected: boolean) {
  const distance = Math.abs(offset);
  const side = offset > 0 ? 1 : -1;

  if (selected) {
    return {
      size: 300,
      x: 0,
      scale: 1,
      rotateY: 0,
      translateZ: 180,
      opacity: 1,
      zIndex: 100,
      blur: 0,
      pointerEvents: 'auto' as const
    };
  }

  if (distance === 1) {
    return {
      size: 300,
      x: side * 135,
      scale: 0.86,
      rotateY: side * -58,
      translateZ: 90,
      opacity: 0.86,
      zIndex: 80,
      blur: 0,
      pointerEvents: 'auto' as const
    };
  }

  if (distance === 2) {
    return {
      size: 300,
      x: side * 235,
      scale: 0.72,
      rotateY: side * -66,
      translateZ: 20,
      opacity: 0.68,
      zIndex: 60,
      blur: 0.15,
      pointerEvents: 'auto' as const
    };
  }

  if (distance === 3) {
    return {
      size: 300,
      x: side * 315,
      scale: 0.58,
      rotateY: side * -72,
      translateZ: -80,
      opacity: 0.5,
      zIndex: 45,
      blur: 0.45,
      pointerEvents: 'auto' as const
    };
  }

  if (distance === 4) {
    return {
      size: 300,
      x: side * 380,
      scale: 0.46,
      rotateY: side * -78,
      translateZ: -170,
      opacity: 0.34,
      zIndex: 30,
      blur: 0.8,
      pointerEvents: 'none' as const
    };
  }

  return {
    size: 300,
    x: side * 430,
    scale: 0.34,
    rotateY: side * -82,
    translateZ: -250,
    opacity: 0.18,
    zIndex: 15,
    blur: 1.1,
    pointerEvents: 'none' as const
  };
}
export function AlbumCard({
  album,
  offset,
  selected,
  flipped,
  onSelect,
  onFlip,
  onSwipePrev,
  onSwipeNext,
  onDropToNowPlaying,
  onPlayTrack,
  onQueueTrack,
  onShowTrackDetails,
  onDragStateChange
}: AlbumCardProps) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const dragRotateY = useTransform(dragX, [-220, 0, 220], [-7, 0, 7]);
  const dragRotateX = useTransform(dragY, [-180, 0, 180], [4, 0, -8]);

  const visuals = getVisuals(offset, selected);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      animate={{
        x: visuals.x,
        y: 0,
        scale: visuals.scale,
        rotateY: visuals.rotateY,
        rotateX: 0,
        z: visuals.translateZ,
        opacity: visuals.opacity,
        zIndex: visuals.zIndex,
        filter: `blur(${visuals.blur}px)`
      }}
      transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.9 }}
      style={{
        width: visuals.size,
        height: visuals.size,
        marginLeft: -(visuals.size / 2),
        marginTop: -(visuals.size / 2),
        transformStyle: 'preserve-3d',
        pointerEvents: visuals.pointerEvents
      }}
    >
      <motion.div
        className="relative h-full w-full overflow-visible"
        drag={selected}
        dragElastic={0.16}
        dragMomentum={false}
        style={selected ? { x: dragX, y: dragY, rotateY: dragRotateY, rotateX: dragRotateX } : undefined}
        onDragStart={() => onDragStateChange(true)}
        onDragEnd={(_, info) => {
          onDragStateChange(false);

          if (info.offset.y > 120) {
            onDropToNowPlaying();
            return;
          }

          if (info.offset.x < -110) {
            onSwipeNext();
          }

          if (info.offset.x > 110) {
            onSwipePrev();
          }
        }}
        onTap={() => {
          if (selected) onFlip();
          else onSelect();
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 0, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 180, opacity: 0 }}
              transition={{ duration: 0.36, ease: 'easeInOut' }}
              className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-panel-850/85 shadow-[0_18px_54px_rgba(0,0,0,0.32)]"
              style={{ transformStyle: 'preserve-3d', aspectRatio: '1 / 1' }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-[28px]"
                style={{ background: album.accent }}
              >
                <div className="absolute inset-0" style={{ background: album.accentSoft }} />
                <div
                  className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{ backgroundImage: album.coverPattern, backgroundSize: '18px 18px' }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_36%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_38%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.34))]" />

                <div className="absolute left-4 top-4 rounded-full border border-white/[0.12] bg-black/[0.18] px-3 py-1 text-[0.58rem] tracking-[0.3em] text-white/[0.68]">
                  {album.coverTag}
                </div>

                {selected ? (
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute right-4 top-4 rounded-full border border-white/[0.1] bg-white/[0.06] px-3 py-1 text-[0.58rem] tracking-[0.26em] text-white/[0.68]"
                  >
                    TAP TO FLIP
                  </motion.div>
                ) : null}

                <div className="absolute bottom-12 left-4 right-4 min-w-0">
                  <p className="font-display text-[0.66rem] uppercase tracking-[0.28em] text-white/[0.66]">
                    {album.artist}
                  </p>
                  <h3 className="mt-2 max-w-[9ch] font-display text-[clamp(1.85rem,2.4vw,2.55rem)] leading-[0.92] tracking-tight text-white drop-shadow-[0_18px_30px_rgba(0,0,0,0.28)]">
                    {album.title}
                  </h3>
                  <p className="mt-2 truncate text-[0.7rem] text-white/55">{album.mood}</p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/10 px-4 py-3">
                  <div className="flex items-center justify-between text-[0.68rem] tracking-[0.24em] text-white/58">
                    <span className="truncate">{album.genre}</span>
                    <span>{album.year}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: -180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 0, opacity: 0 }}
              transition={{ duration: 0.36, ease: 'easeInOut' }}
              className="h-full w-full overflow-hidden rounded-[28px]"
              style={{ transformStyle: 'preserve-3d', aspectRatio: '1 / 1' }}
            >
              <AlbumBackside
                album={album}
                onPlayTrack={onPlayTrack}
                onQueueTrack={onQueueTrack}
                onShowTrackDetails={onShowTrackDetails}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}