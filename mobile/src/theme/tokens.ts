// Design tokens — Solana official palette.
// Single source of truth for colors, fonts, spacing, gradients.
// Anything visual must consume from here — no hardcoded values in components.
//
// Brand alignment (Day 10): the original spec leaned on a #FE3B68 hot
// pink that was labeled "solanaRed" but is not part of the Solana brand.
// The brand colors per https://solana.com/branding are:
//   • Solana Purple   #9945FF
//   • Solana Green    #14F195
//   • Solana Magenta  #DC1FFF (used in the official 3-color gradient)
// All references to the legacy red have been removed.

export const colors = {
  bg: '#0A0A0F',
  bgElevated: 'rgba(255,255,255,0.08)',
  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9B9BA3',
  textMuted: '#6B6B78',
  textDim: '#5A5A68',

  // Solana brand palette
  solanaPurple: '#9945FF',
  solanaGreen: '#14F195',
  solanaMagenta: '#DC1FFF',

  // Backwards-compat alias retained briefly so the file compiles while
  // call-site usages of `colors.solanaRed` are swept in the next commit.
  // Will be removed in Day 10.brand-2.
  solanaRed: '#9945FF',

  // Legacy named-color tokens kept where they don't conflict with brand
  // (yellow/cyan still used by v2 gallery placeholder gradients).
  violet: '#9945FF',
  cyan: '#00E0FF',
  yellow: '#FFB800',
  yellowAccent: '#FFD93B',
  green: '#00E676',

  greenBgTint: 'rgba(0, 230, 118, 0.15)',
  greenBorder: 'rgba(0, 230, 118, 0.5)',
  // Brand glow — Solana green at low alpha, contrasts well over purple
  // gradients without competing with the brand purple.
  borderGlow: 'rgba(20, 241, 149, 0.3)',
  hairline: 'rgba(255,255,255,0.18)',
  hairlineSoft: 'rgba(255,255,255,0.1)',
} as const;

export const gradients = {
  // Primary brand gradient — Solana official 2-stop purple → green.
  primary: ['#9945FF', '#14F195'] as const,
  primaryAngle: 95,
  // Same 2-stop variant for indicators and smaller buttons.
  primaryDuo: ['#9945FF', '#14F195'] as const,

  // Per-card backgrounds. Diamond / OG / Recap are the active card types
  // shipped by the insight engine — each gets a distinct 2-stop vibe so
  // they read as a set without all looking identical:
  //   diamond → green→purple    (wealth + speed)
  //   og      → purple→magenta  (status + mystery)
  //   recap   → magenta→green   (vibrancy + growth)
  // The other 4 entries are v2 placeholders shown grayscale in Gallery;
  // their gradients are kept loose but free of any non-brand colors.
  card: {
    diamond: ['#14F195', '#9945FF'] as const,
    og: ['#9945FF', '#DC1FFF'] as const,
    recap: ['#DC1FFF', '#14F195'] as const,
    swaps: ['#9945FF', '#14F195'] as const,
    genre: ['#00FFB2', '#00B2FF', '#9945FF'] as const,
    personality: ['#9945FF', '#3B6BFE'] as const,
    achievement: ['#FFB800', '#DC1FFF'] as const,
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
    shadowColor: colors.solanaPurple,
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.6,
    shadowRadius: 120,
    elevation: 32,
  },
  buttonPrimary: {
    shadowColor: colors.solanaPurple,
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
