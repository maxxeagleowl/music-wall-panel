export const themeColors = {
  page: '#04060a',
  pageTop: '#05070b',
  pageBottom: '#030406',
  panel: '#0b0d12',
  panelDeep: '#080a0f',
  panelSoft: '#11141a',
  overlay: '#000000',
  text: {
    primary: '#f6f1e8',
    secondary: '#e9e0d2',
    muted: '#c9bea9',
    faint: '#9f947f',
    faintStrong: '#b8aa93'
  },
  neutral: {
    text: {
      primary: 'rgba(246, 241, 232, 0.96)',
      secondary: 'rgba(246, 241, 232, 0.78)',
      muted: 'rgba(246, 241, 232, 0.6)',
      faint: 'rgba(246, 241, 232, 0.46)',
      soft: 'rgba(246, 241, 232, 0.34)',
      subtle: 'rgba(246, 241, 232, 0.18)',
      inverse: '#0b0d12'
    },
    border: {
      subtle: 'rgba(246, 241, 232, 0.05)',
      soft: 'rgba(246, 241, 232, 0.06)',
      medium: 'rgba(246, 241, 232, 0.08)',
      strong: 'rgba(246, 241, 232, 0.12)'
    },
    surface: {
      base: 'rgba(246, 241, 232, 0.02)',
      soft: 'rgba(246, 241, 232, 0.03)',
      elevated: 'rgba(246, 241, 232, 0.04)',
      overlay: 'rgba(0, 0, 0, 0.18)',
      deep: 'rgba(0, 0, 0, 0.22)',
      panel: 'rgba(11, 13, 18, 0.88)',
      panelStrong: 'rgba(11, 13, 18, 0.94)'
    },
    shadow: {
      subtle: '0 0 12px rgba(246, 241, 232, 0.07)',
      panel: '0 14px 40px rgba(0, 0, 0, 0.32)',
      elevated: '0 18px 54px rgba(0, 0, 0, 0.32)',
      wide: '0 18px 60px rgba(0, 0, 0, 0.24)',
      hero: '0 22px 64px rgba(0, 0, 0, 0.52)'
    }
  },
  accent: {
    bronze: '#9f6b36',
    bronzeSoft: '#b88458',
    gold: '#dfbf7a',
    goldSoft: '#c9ab79',
    highlight: '#f3e4bf'
  }
} as const;

export const themeCssVars = {
  '--theme-page': themeColors.page,
  '--theme-page-top': themeColors.pageTop,
  '--theme-page-bottom': themeColors.pageBottom,
  '--theme-panel': themeColors.panel,
  '--theme-panel-deep': themeColors.panelDeep,
  '--theme-text-primary': themeColors.neutral.text.primary,
  '--theme-text-secondary': themeColors.neutral.text.secondary,
  '--theme-text-muted': themeColors.neutral.text.muted,
  '--theme-text-soft': themeColors.neutral.text.soft,
  '--theme-text-subtle': themeColors.neutral.text.subtle,
  '--theme-border-soft': themeColors.neutral.border.soft,
  '--theme-border-medium': themeColors.neutral.border.medium,
  '--theme-surface-base': themeColors.neutral.surface.base,
  '--theme-surface-soft': themeColors.neutral.surface.soft,
  '--theme-surface-elevated': themeColors.neutral.surface.elevated,
  '--theme-surface-overlay': themeColors.neutral.surface.overlay,
  '--theme-surface-panel': themeColors.neutral.surface.panel,
  '--theme-surface-panel-strong': themeColors.neutral.surface.panelStrong,
  '--theme-shadow-panel': themeColors.neutral.shadow.panel,
  '--theme-shadow-hero': themeColors.neutral.shadow.hero,
  '--theme-accent-gold': themeColors.accent.gold,
  '--theme-accent-gold-soft': themeColors.accent.goldSoft,
  '--theme-accent-bronze': themeColors.accent.bronze,
  '--theme-accent-bronze-soft': themeColors.accent.bronzeSoft,
  '--theme-scrollbar-thumb': rgba(themeColors.accent.goldSoft, 0.18),
  '--theme-scrollbar-track': rgba(themeColors.text.primary, 0.03),
  '--theme-slider-thumb-border': rgba(themeColors.accent.goldSoft, 0.3),
  '--theme-slider-thumb-fill': 'rgba(250, 239, 214, 0.95)',
  '--theme-slider-thumb-ring': rgba(themeColors.accent.goldSoft, 0.08)
} as const;

type ColorInput = string;

function normalizeAlpha(alpha: number) {
  return Math.min(1, Math.max(0, alpha));
}

function parseColor(color: ColorInput): [number, number, number, number] {
  if (color.startsWith('#')) {
    const value = color.slice(1);

    if (value.length === 3) {
      const r = Number.parseInt(value[0] + value[0], 16);
      const g = Number.parseInt(value[1] + value[1], 16);
      const b = Number.parseInt(value[2] + value[2], 16);
      return [r, g, b, 1];
    }

    if (value.length === 6) {
      const r = Number.parseInt(value.slice(0, 2), 16);
      const g = Number.parseInt(value.slice(2, 4), 16);
      const b = Number.parseInt(value.slice(4, 6), 16);
      return [r, g, b, 1];
    }
  }

  const rgbaMatch = color.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+)\s*)?\)$/
  );

  if (rgbaMatch) {
    return [
      Number.parseFloat(rgbaMatch[1]),
      Number.parseFloat(rgbaMatch[2]),
      Number.parseFloat(rgbaMatch[3]),
      rgbaMatch[4] ? Number.parseFloat(rgbaMatch[4]) : 1
    ];
  }

  throw new Error(`Unsupported color format: ${color}`);
}

export function rgba(color: ColorInput, alpha: number) {
  const [r, g, b] = parseColor(color);
  return `rgba(${r}, ${g}, ${b}, ${normalizeAlpha(alpha)})`;
}

export function withAlpha(color: ColorInput, alpha: number) {
  return rgba(color, alpha);
}

export const themeEffects = {
  border: {
    subtle: `1px solid ${rgba(themeColors.accent.goldSoft, 0.12)}`,
    soft: `1px solid ${rgba(themeColors.accent.goldSoft, 0.18)}`,
    active: `1px solid ${rgba(themeColors.accent.goldSoft, 0.3)}`
  },
  neutral: {
    border: {
      subtle: `1px solid ${themeColors.neutral.border.subtle}`,
      soft: `1px solid ${themeColors.neutral.border.soft}`,
      medium: `1px solid ${themeColors.neutral.border.medium}`,
      strong: `1px solid ${themeColors.neutral.border.strong}`
    },
    surface: {
      base: themeColors.neutral.surface.base,
      soft: themeColors.neutral.surface.soft,
      elevated: themeColors.neutral.surface.elevated,
      overlay: themeColors.neutral.surface.overlay,
      deep: themeColors.neutral.surface.deep,
      panel: themeColors.neutral.surface.panel,
      panelStrong: themeColors.neutral.surface.panelStrong
    },
    shadow: {
      subtle: themeColors.neutral.shadow.subtle,
      panel: themeColors.neutral.shadow.panel,
      elevated: themeColors.neutral.shadow.elevated,
      wide: themeColors.neutral.shadow.wide,
      hero: themeColors.neutral.shadow.hero
    },
    text: {
      primary: themeColors.neutral.text.primary,
      secondary: themeColors.neutral.text.secondary,
      muted: themeColors.neutral.text.muted,
      faint: themeColors.neutral.text.faint,
      soft: themeColors.neutral.text.soft,
      subtle: themeColors.neutral.text.subtle,
      inverse: themeColors.neutral.text.inverse
    }
  },
  glow: {
    soft: `0 0 18px ${rgba(themeColors.accent.goldSoft, 0.18)}`,
    medium: `0 0 16px ${rgba(themeColors.accent.goldSoft, 0.24)}`,
    strong: `0 0 24px ${rgba(themeColors.accent.goldSoft, 0.34)}`
  },
  shadow: {
    panel: `0 14px 40px ${rgba(themeColors.overlay, 0.32)}`,
    elevated: `0 18px 54px ${rgba(themeColors.overlay, 0.32)}`,
    wide: `0 18px 60px ${rgba(themeColors.overlay, 0.24)}`,
    hero: `0 22px 64px ${rgba(themeColors.overlay, 0.52)}`
  },
  gradient: {
    accent: `linear-gradient(180deg, ${rgba(themeColors.accent.goldSoft, 0.54)}, ${rgba(themeColors.accent.bronzeSoft, 0.82)})`,
    accentSoft: `linear-gradient(90deg, ${rgba(themeColors.accent.goldSoft, 0.58)}, ${rgba(themeColors.text.primary, 0.82)})`,
    surface: `linear-gradient(180deg, ${rgba(themeColors.text.primary, 0.04)}, ${rgba(themeColors.overlay, 0.34)})`,
    surfaceReverse: `linear-gradient(180deg, ${rgba(themeColors.overlay, 0.94)}, ${rgba(themeColors.panelDeep, 0.9)})`
  },
  active: {
    surface: {
      borderColor: rgba(themeColors.accent.goldSoft, 0.22),
      backgroundColor: rgba(themeColors.accent.goldSoft, 0.12),
      boxShadow: `0 0 0 1px ${rgba(themeColors.text.primary, 0.08)}, 0 0 52px ${rgba(themeColors.accent.goldSoft, 0.08)}, 0 26px 80px ${rgba(themeColors.overlay, 0.3)}`
    },
    pill: {
      borderColor: rgba(themeColors.accent.goldSoft, 0.28),
      backgroundColor: rgba(themeColors.accent.goldSoft, 0.16),
      color: rgba(themeColors.text.primary, 0.96),
      boxShadow: `0 0 18px ${rgba(themeColors.accent.goldSoft, 0.22)}`
    }
  }
} as const;
