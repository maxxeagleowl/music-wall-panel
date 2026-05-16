import type { Album } from '../types/music';
import { rgba, themeColors } from './colors';

export type AlbumVisualTheme = {
  coverImageUrl?: string;
  accent: string;
  accentSoft: string;
  ambientGlow: string;
  ambientGradient: string;
  textOnCover: string;
};

type AlbumThemeSource = Pick<Album, 'accent' | 'accentSoft'> & {
  coverImageUrl?: string;
};

const PREMIUM_BRONZE = themeColors.accent.bronze;
const PREMIUM_BRONZE_SOFT = themeColors.accent.bronzeSoft;
const PREMIUM_BRONZE_DEEP = '#120d0a';

const COLOR_TOKEN_PATTERN = /#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/;

function extractColorToken(inputColor: string) {
  const match = inputColor.match(COLOR_TOKEN_PATTERN);
  return match?.[0];
}

function isValidHexColor(inputColor: string) {
  return /^#[0-9a-fA-F]{3,8}$/.test(inputColor);
}

function isValidRgbColor(inputColor: string) {
  return /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)$/.test(inputColor);
}

function parseRgbColor(inputColor: string) {
  if (isValidHexColor(inputColor)) {
    const value = inputColor.slice(1);

    if (value.length === 3) {
      return [
        Number.parseInt(value[0] + value[0], 16),
        Number.parseInt(value[1] + value[1], 16),
        Number.parseInt(value[2] + value[2], 16)
      ] as const;
    }

    if (value.length >= 6) {
      return [
        Number.parseInt(value.slice(0, 2), 16),
        Number.parseInt(value.slice(2, 4), 16),
        Number.parseInt(value.slice(4, 6), 16)
      ] as const;
    }
  }

  if (isValidRgbColor(inputColor)) {
    const match = inputColor.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)$/
    );

    if (match) {
      return [
        Number.parseFloat(match[1]),
        Number.parseFloat(match[2]),
        Number.parseFloat(match[3])
      ] as const;
    }
  }

  return null;
}

function getLuminance(inputColor: string) {
  const rgb = parseRgbColor(inputColor);

  if (!rgb) {
    return null;
  }

  const [red, green, blue] = rgb.map((channel) => {
    const normalized = Math.min(255, Math.max(0, channel)) / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function resolveAlbumColor(inputColor: string | undefined, fallback: string) {
  if (!inputColor) {
    return fallback;
  }

  const trimmed = inputColor.trim();

  if (!trimmed) {
    return fallback;
  }

  const token = extractColorToken(trimmed);
  if (token) {
    return token;
  }

  if (isValidHexColor(trimmed) || isValidRgbColor(trimmed)) {
    return trimmed;
  }

  return fallback;
}

function chooseCoverTextColor(primaryColor: string, secondaryColor: string) {
  const luminanceValues = [getLuminance(primaryColor), getLuminance(secondaryColor)].filter(
    (value): value is number => value !== null
  );

  if (!luminanceValues.length) {
    return themeColors.neutral.text.primary;
  }

  const averageLuminance = luminanceValues.reduce((sum, value) => sum + value, 0) / luminanceValues.length;
  return averageLuminance > 0.55 ? themeColors.neutral.text.inverse : themeColors.neutral.text.primary;
}

export function normalizeAlbumColor(inputColor: string | undefined) {
  return resolveAlbumColor(inputColor, PREMIUM_BRONZE);
}

export function createSafeAmbientGradient(primaryColor: string | undefined, secondaryColor: string | undefined) {
  const primary = normalizeAlbumColor(primaryColor);
  const secondary = resolveAlbumColor(secondaryColor, PREMIUM_BRONZE_SOFT);

  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 58%, ${PREMIUM_BRONZE_DEEP} 100%)`;
}

export function createMockAlbumTheme(album: AlbumThemeSource): AlbumVisualTheme {
  const accent = normalizeAlbumColor(album.accent);
  const accentSoft = resolveAlbumColor(album.accentSoft, PREMIUM_BRONZE_SOFT);

  return {
    coverImageUrl: album.coverImageUrl,
    accent,
    accentSoft,
    ambientGlow: `radial-gradient(circle, ${rgba(accentSoft, 0.24)} 0%, transparent 68%)`,
    ambientGradient: createSafeAmbientGradient(accent, accentSoft),
    textOnCover: chooseCoverTextColor(accent, accentSoft)
  };
}
