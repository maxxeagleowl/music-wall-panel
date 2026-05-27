import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import type { Album, Track } from '../types/music';
import { AlbumBackside } from './AlbumBackside';
import { rgba, themeColors, themeEffects } from '../theme/colors';

type AlbumCardProps = {
  album: Album;
  offset: number;
  selected: boolean;
  flipped: boolean;
  tracksLoading?: boolean;
  onSelect: () => void;
  onFlip: () => void;
  onSwipePrev: () => void;
  onSwipeNext: () => void;
  onDropToNowPlaying: () => void;
  onPlayTrack: (track: Track) => void;
  onQueueNext: (track: Track) => void;
  onQueueAppend: (track: Track) => void;
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
      y: -4,
      scale: 1.015,
      rotateY: 0,
      translateZ: 210,
      opacity: 1,
      zIndex: 100,
      blur: 0,
      brightness: 1.08,
      contrast: 1.06,
      saturate: 1.04,
      pointerEvents: 'auto' as const
    };
  }

  const x =
    distance === 1
      ? side * 160
      : side * (128 + distance * 74);

  const y = distance * 2;
  const scale = Math.max(0.5, 1 - distance * 0.1);
  const rotateY = side * -Math.min(72, 46 + distance * 7);
  const translateZ = 110 - distance * 12;

  const opacity =
    distance > 4
      ? 0.04
      : Math.max(0.14, 1 - distance * 0.19);

  const blur =
    distance > 4
      ? 1.4
      : distance * 0.22;

  return {
    size: 300,
    x,
    y,
    scale,
    rotateY,
    translateZ,
    opacity,
    zIndex: Math.max(5, 90 - distance * 12),
    blur,
    brightness: 1,
    contrast: 1,
    saturate: 1,
    pointerEvents: distance > 4 ? 'none' as const : 'auto' as const
  };
}

export function AlbumCard({
  album,
  offset,
  selected,
  flipped,
  tracksLoading,
  onSelect,
  onFlip,
  onSwipePrev,
  onSwipeNext,
  onDropToNowPlaying,
  onPlayTrack,
  onQueueNext,
  onQueueAppend,
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
        y: visuals.y,
        scale: visuals.scale,
        rotateY: visuals.rotateY,
        rotateX: 0,
        z: visuals.translateZ,
        opacity: visuals.opacity,
        zIndex: visuals.zIndex,
        filter: `
          blur(${visuals.blur}px)
          brightness(${visuals.brightness ?? 1})
          contrast(${visuals.contrast ?? 1})
          saturate(${visuals.saturate ?? 1})
        `
      }}
      transition={{
        type: 'spring',
        stiffness: 72,
        damping: 24,
        mass: 1.45,
        velocity: 0.2
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
        dragElastic={0.08}
        dragMomentum={false}
        dragTransition={{
          bounceStiffness: 120,
          bounceDamping: 18,
          power: 0.18,
          timeConstant: 260
        }}
        style={
          selected
            ? {
                x: dragX,
                y: dragY,
                rotateY: dragRotateY,
                rotateX: dragRotateX,
                transformStyle: 'preserve-3d'
              }
            : { transformStyle: 'preserve-3d' }
        }
        onDragStart={() => onDragStateChange(true)}
        onDragEnd={(_, info) => {
          onDragStateChange(false);

          animate(dragX, 0, {
            type: 'spring',
            stiffness: 95,
            damping: 18,
            mass: 1.35
          });

          animate(dragY, 0, {
            type: 'spring',
            stiffness: 95,
            damping: 18,
            mass: 1.35
          });

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
        {/* 3D flip container — rotates the whole card */}
        <motion.div
          className="relative h-full w-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, mass: 1.2 }}
          style={{ transformStyle: 'preserve-3d' }}
        >

        {/* ── Front face ── */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: 'hidden', pointerEvents: flipped ? 'none' : 'auto' }}
        >
            <motion.div
              className="relative h-full w-full overflow-hidden rounded-[28px]"
              style={{
                border: themeEffects.border.subtle,
                backgroundColor: rgba(themeColors.panel, 0.85),
                boxShadow: `
                  ${themeEffects.shadow.elevated},
                  0 0 42px ${rgba(themeColors.accent.goldSoft, 0.08)}
                `,
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
                className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[1px]"
                style={{
                  background: `linear-gradient(
                    90deg,
                    transparent,
                    ${rgba(themeColors.text.primary, 0.22)},
                    transparent
                  )`
                }}
              />

              <div
                className="absolute inset-0 overflow-hidden rounded-[28px]"
                style={{ background: album.accent }}
              >
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: album.accentSoft }}
                  />
                )}

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
                  <div
                    className="flex items-center justify-between text-[0.68rem] tracking-[0.24em]"
                    style={{ color: themeColors.neutral.text.muted }}
                  >
                    <span className="truncate">{album.genre}</span>
                    <span>{album.year}</span>
                  </div>
                </div>
              </div>
            </motion.div>
        </div>

        {/* ── Back face ── */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[28px]"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            pointerEvents: flipped ? 'auto' : 'none'
          }}
        >
          <AlbumBackside
            album={album}
            tracksLoading={tracksLoading}
            onFlipBack={onFlip}
            onPlayTrack={onPlayTrack}
            onQueueNext={onQueueNext}
            onQueueAppend={onQueueAppend}
            onShowTrackDetails={onShowTrackDetails}
          />
        </div>

        </motion.div>{/* end flip container */}
      </motion.div>
    </motion.div>
  );
}