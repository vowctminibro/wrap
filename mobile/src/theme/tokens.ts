// Design tokens extracted from "WRAP - Solana Colosseum"/screens.jsx
// Single source of truth for colors, fonts, spacing, gradients.
// Anything visual must consume from here — no hardcoded values in components.

export const colors = {
  bg: '#0A0A0F',
  bgElevated: 'rgba(255,255,255,0.08)',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9B9BA3',
  textMuted: '#6B6B78',
  textDim: '#5A5A68',
  solanaRed: '#FE3B68',
  orange: '#FF6B3B',
  violet: '#9945FF',
  cyan: '#00E0FF',
  yellow: '#FFB800',
  yellowAccent: '#FFD93B',
  green: '#00E676',
  greenBgTint: 'rgba(0, 230, 118, 0.15)',
  greenBorder: 'rgba(0, 230, 118, 0.5)',
  borderGlow: 'rgba(254, 59, 104, 0.3)',
  hairline: 'rgba(255,255,255,0.18)',
  hairlineSoft: 'rgba(255,255,255,0.1)',
} as const;

export const gradients = {
  // Primary brand gradient (red → orange → violet) — used on CTAs and headlines
  primary: ['#FE3B68', '#FF6B3B', '#9945FF'] as const,
  primaryAngle: 95,
  // Two-stop variant for indicators and smaller buttons
  primaryDuo: ['#FE3B68', '#9945FF'] as const,
  // Per-card backgrounds (mirror cards-data.jsx exactly)
  card: {
    swaps: ['#FE3B68', '#FF6B3B', '#9945FF'] as const,
    diamond: ['#00E0FF', '#6B5BFF', '#9945FF'] as const,
    og: ['#FFB800', '#FE3B68', '#9945FF'] as const,
    recap: ['#9945FF', '#FE3B68', '#FFB800'] as const,
    genre: ['#00FFB2', '#00B2FF', '#9945FF'] as const,
    personality: ['#FE3B68', '#B23BFE', '#3B6BFE'] as const,
    achievement: ['#FFB800', '#FE3B68', '#6B3BFE'] as const,
  },
} as const;

// Typography — RN doesn't have Inter Tight bundled. We name the font family
// here so a future expo-font load step can wire the actual ttf. System fall-
// back is fine for the build verification in Phase 1.
export const fonts = {
  display: 'InterTight-Black',
  displayFallback: 'System',
  body: 'Inter-Medium',
  bodyFallback: 'System',
  mono: 'JetBrainsMono-Medium',
  monoFallback: 'Courier',
} as const;

// Numerical tokens. Values reflect a 1080×2400 design canvas.
// In RN dp space these are large; CardRevealScreen and friends scale via
// flex / aspect ratio, so we keep raw values for visual fidelity reference.
export const fontSizes = {
  display: 80,
  displayHuge: 110,
  hero: 96,
  cardStat: 220,
  cardStatLong: 180,
  cardStatUnit: 64,
  cardSub: 36,
  cardLine: 36,
  cardLabel: 26,
  body: 32,
  bodySm: 28,
  caption: 26,
  micro: 18,
  buttonLg: 44,
  buttonMd: 38,
} as const;

export const spacing = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 60,
  xxxl: 80,
} as const;

export const radius = {
  sm: 16,
  md: 32,
  lg: 56,
  pill: 70,
  pillLg: 80,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
    elevation: 24,
  },
  cardGlow: {
    shadowColor: colors.solanaRed,
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.6,
    shadowRadius: 120,
    elevation: 32,
  },
  buttonPrimary: {
    shadowColor: colors.solanaRed,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 12,
  },
} as const;

// Voice rules — referenced by prompt builders in src/prompts/
export const voice = {
  maxWordsPerInsight: 15,
  tone: 'confident, slightly cocky, screenshot-able',
  forbid: ['emoji', 'exclamation marks', 'generic praise'],
} as const;
