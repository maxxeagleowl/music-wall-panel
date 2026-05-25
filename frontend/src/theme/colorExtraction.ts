// Phase 12 preparation: placeholder for future dominant color extraction.
// Full canvas-based extraction is deferred to Phase 18 (Ambient Features).
// These functions can be wired to AlbumCard ambient glow when implemented.

export interface DominantColors {
  primary: string;
  secondary: string;
  accent: string;
  isDark: boolean;
}

const FALLBACK: DominantColors = {
  primary: '#1a1a2e',
  secondary: '#0d0d18',
  accent: '#c9ab79',
  isDark: true,
};

/** Placeholder — returns fallback colors. Real extraction comes in Phase 18. */
export function extractDominantColor(_imageUrl: string): Promise<DominantColors> {
  return Promise.resolve(FALLBACK);
}

/** Placeholder — returns a fallback ambient glow CSS string. */
export function extractAmbientGlow(_imageUrl: string): Promise<string> {
  return Promise.resolve('radial-gradient(circle, rgba(201, 171, 121, 0.12), transparent 70%)');
}
