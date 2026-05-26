import { motion } from 'framer-motion';
import { rgba, themeColors, themeEffects } from '../theme/colors';
import type { SearchResults as SearchResultsType, Album, Playlist, SearchTrack } from '../types/music';

type Props = {
  results: SearchResultsType;
  onSelectAlbum?: (album: Album) => void;
  onSelectTrack?: (track: SearchTrack) => void;
  onSelectPlaylist?: (playlist: Playlist) => void;
  onSelectArtist?: (name: string) => void;
};

function CoverThumb({ url, tag }: { url: string | null | undefined; tag: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={tag}
        className="h-10 w-10 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
      style={{
        backgroundColor: rgba(themeColors.accent.goldSoft, 0.08),
        border: themeEffects.neutral.border.medium,
        color: themeColors.neutral.text.muted,
        fontSize: '0.6rem',
        letterSpacing: '0.1em',
      }}
    >
      {tag.slice(0, 2).toUpperCase()}
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <p
      className="mb-3 font-display text-[0.62rem] uppercase tracking-[0.36em]"
      style={{ color: themeColors.neutral.text.soft }}
    >
      {label}
    </p>
  );
}

function ResultRow({
  cover,
  tag,
  primary,
  secondary,
  badge,
  onClick,
}: {
  cover: string | null | undefined;
  tag: string;
  primary: string;
  secondary: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors"
      style={{
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        cursor: onClick ? 'pointer' : 'default',
      }}
      whileHover={
        onClick
          ? {
              backgroundColor: rgba(themeColors.accent.goldSoft, 0.05),
              borderColor: rgba(themeColors.accent.goldSoft, 0.08),
            }
          : {}
      }
    >
      <CoverThumb url={cover} tag={tag} />
      <div className="min-w-0 flex-1">
        <p
          className="truncate font-display text-[0.82rem]"
          style={{ color: themeColors.neutral.text.primary }}
        >
          {primary}
        </p>
        <p
          className="truncate text-[0.7rem]"
          style={{ color: themeColors.neutral.text.muted }}
        >
          {secondary}
        </p>
      </div>
      {badge && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em]"
          style={{
            backgroundColor: rgba(themeColors.accent.goldSoft, 0.1),
            color: themeColors.neutral.text.soft,
          }}
        >
          {badge}
        </span>
      )}
    </motion.button>
  );
}

export function SearchResults({ results, onSelectAlbum, onSelectTrack, onSelectPlaylist, onSelectArtist }: Props) {
  const hasAlbums = results.albums.length > 0;
  const hasTracks = results.tracks.length > 0;
  const hasArtists = results.artists.length > 0;
  const hasPlaylists = results.playlists.length > 0;
  const hasAny = hasAlbums || hasTracks || hasArtists || hasPlaylists;

  if (!hasAny) {
    return (
      <p
        className="py-8 text-center text-sm"
        style={{ color: themeColors.neutral.text.soft }}
      >
        Keine Ergebnisse
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {hasAlbums && (
        <section>
          <SectionHeading label="Alben" />
          <div className="space-y-0.5">
            {results.albums.slice(0, 8).map((album: Album) => (
              <ResultRow
                key={album.id}
                cover={album.coverUrl}
                tag={album.coverTag}
                primary={album.title}
                secondary={album.artist}
                onClick={() => onSelectAlbum?.(album)}
              />
            ))}
          </div>
        </section>
      )}

      {hasTracks && (
        <section>
          <SectionHeading label="Tracks" />
          <div className="space-y-0.5">
            {results.tracks.slice(0, 6).map((track) => (
              <ResultRow
                key={track.id}
                cover={track.albumCoverUrl}
                tag={track.title}
                primary={track.title}
                secondary={`${track.artist} · ${track.albumTitle}`}
                badge={track.durationFormatted}
                onClick={() => onSelectTrack?.(track)}
              />
            ))}
          </div>
        </section>
      )}

      {hasArtists && (
        <section>
          <SectionHeading label="Künstler" />
          <div className="space-y-0.5">
            {results.artists.slice(0, 5).map((artist) => (
              <ResultRow
                key={artist.id}
                cover={null}
                tag={artist.name}
                primary={artist.name}
                secondary="Künstler"
                onClick={() => onSelectArtist?.(artist.name)}
              />
            ))}
          </div>
        </section>
      )}

      {hasPlaylists && (
        <section>
          <SectionHeading label="Playlists" />
          <div className="space-y-0.5">
            {results.playlists.slice(0, 5).map((playlist: Playlist) => (
              <ResultRow
                key={playlist.id}
                cover={playlist.coverUrl}
                tag={playlist.name}
                primary={playlist.name}
                secondary={`${playlist.trackCount} Tracks · ${playlist.owner}`}
                onClick={() => onSelectPlaylist?.(playlist)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
