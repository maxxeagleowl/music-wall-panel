import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import type { Album, Track } from '../types/music';
import { AlbumBackside } from './AlbumBackside';
import { rgba, themeColors, themeEffects } from '../theme/colors';

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

function getVisuals(offset: number, selected: boolean, flipped: boolean) {
  const distance = Math.abs(offset);
  const side = offset > 0 ? 1 : -1;

  if (selected) {
    return {
      size: flipped ? 375 : 300,
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

  const visuals = getVisuals(offset, selected, flipped);

  useEffect(() => {
    if (!selected) {
      dragX.set(0);
      dragY.set(0);
    }
  }, [selected, dragX, dragY]);

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
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 20,
        mass: 0.9
      }}
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
        drag={selected && !flipped}
        dragElastic={0.16}
        dragMomentum={false}
        style={
          selected
            ? {
                x: dragX,
                y: dragY,
                rotateY: dragRotateY,
                rotateX: dragRotateX
              }
            : undefined
        }
        onDragStart={() => onDragStateChange(true)}
        onDragEnd={(_, info) => {
          onDragStateChange(false);

          dragX.set(0);
          dragY.set(0);

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
      >
        <AnimatePresence mode="wait" initial={false}>
          {!flipped ? (
            <motion.div
              key="front"
              initial={{ rotateY: 0, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 180, opacity: 0 }}
              transition={{ duration: 0.36, ease: 'easeInOut' }}
              className="relative h-full w-full overflow-hidden rounded-[28px]"
              style={{
                border: themeEffects.border.subtle,
                backgroundColor: rgba(themeColors.panel, 0.85),
                boxShadow: themeEffects.shadow.elevated,
                transformStyle: 'preserve-3d',
                aspectRatio: '1 / 1'
              }}
              onTap={() => {
                dragX.set(0);
                dragY.set(0);

                if (selected) {
                  onFlip();
                } else {
                  onSelect();
                }
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-[28px]"
                style={{ background: album.accent }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: album.accentSoft }}
                />

                <div
                  className="absolute inset-0 opacity-30 mix-blend-overlay"
                  style={{
                    backgroundImage: album.coverPattern,
                    backgroundSize: '18px 18px'
                  }}
                />

                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: [
                      `radial-gradient(circle at top, ${rgba(themeColors.text.primary, 0.18)}, transparent 36%)`,
                      `radial-gradient(circle at bottom, ${rgba(themeColors.text.primary, 0.06)}, transparent 38%)`
                    ].join(', ')
                  }}
                />

                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: themeEffects.gradient.surface
                  }}
                />

                <div
                  className="absolute left-4 top-4 rounded-full px-3 py-1 text-[0.58rem] tracking-[0.3em]"
                  style={{
                    border: themeEffects.neutral.border.medium,
                    backgroundColor: themeEffects.neutral.surface.overlay,
                    color: themeColors.neutral.text.secondary
                  }}
                >
                  {album.coverTag}
                </div>

                {selected ? (
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 3.6,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="absolute right-4 top-4 rounded-full px-3 py-1 text-[0.58rem] tracking-[0.26em]"
                    style={{
                      border: themeEffects.neutral.border.medium,
                      backgroundColor: themeEffects.neutral.surface.soft,
                      color: themeColors.neutral.text.secondary
                    }}
                  >
                    TAP TO FLIP
                  </motion.div>
                ) : null}

                <div className="absolute bottom-12 left-4 right-4 min-w-0">
                  <p
                    className="font-display text-[0.66rem] uppercase tracking-[0.28em]"
                    style={{ color: themeColors.neutral.text.secondary }}
                  >
                    {album.artist}
                  </p>

                  <h3
                    className="mt-2 max-w-[9ch] font-display text-[clamp(1.85rem,2.4vw,2.55rem)] leading-[0.92] tracking-tight"
                    style={{ textShadow: `0 18px 30px ${rgba(themeColors.overlay, 0.28)}` }}
                  >
                    {album.title}
                  </h3>

                  <p className="mt-2 truncate text-[0.7rem]" style={{ color: themeColors.neutral.text.muted }}>
                    {album.mood}
                  </p>
                </div>

                <div
                  className="absolute bottom-0 left-0 right-0 px-4 py-3"
                  style={{
                    borderTop: `1px solid ${rgba(themeColors.accent.goldSoft, 0.1)}`,
                    backgroundColor: rgba(themeColors.overlay, 0.1)
                  }}
                >
                  <div className="flex items-center justify-between text-[0.68rem] tracking-[0.24em]" style={{ color: themeColors.neutral.text.muted }}>
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
              style={{
                transformStyle: 'preserve-3d',
                aspectRatio: '1 / 1'
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
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
