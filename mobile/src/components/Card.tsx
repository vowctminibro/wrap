// Reusable card component. Mirrors the ShareableCard layout from
// "WRAP - Solana Colosseum"/screens.jsx (Screen 2).
//
// Visual structure (top to bottom):
//   • Top row: label (uppercase, accent-colored) + WRAP/'26 small + icon
//   • Big stat (numerical, very large) + stat unit (smaller, accent)
//   • Sub text
//   • Hairline divider
//   • AI line (the prose, in italics-feeling weight)
//   • Footer: pubkey (mono) + WRAP wordmark
//
// Sized via aspectRatio so the same component works at full screen
// (CardRevealScreen) and as a thumbnail (Phase 6 gallery).

import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PixelIcon, { type IconName } from './PixelIcon';
import { colors, fontSizes, gradients, radius, shadows } from '../theme/tokens';
import type { CardData } from '../types';

type Variant = 'full' | 'mini';

// Per-card type gradients now vary in length (2-stop for active cards
// post-rebrand; 3-stop preserved for v2 placeholders). Loosened to
// `readonly string[]` so each card can carry its own shape.
const BG: Record<string, readonly string[]> = {
  diamond: gradients.card.diamond,
  og: gradients.card.og,
  recap: gradients.card.recap,
  swaps: gradients.card.swaps,
  genre: gradients.card.genre,
  personality: gradients.card.personality,
  achievement: gradients.card.achievement,
};

const ICON_NAMES = new Set<IconName>(['diamond', 'crown', 'spiral', 'fire']);

export default function Card({
  data,
  variant = 'full',
  glowing = false,
  style,
}: {
  data: CardData;
  variant?: Variant;
  glowing?: boolean;
  style?: ViewStyle;
}) {
  const isMini = variant === 'mini';
  const gradient = BG[data.cardType] ?? gradients.card.recap;
  const accent = data.accent;
  const iconName: IconName = ICON_NAMES.has(data.icon as IconName)
    ? (data.icon as IconName)
    : 'spiral';
  // Long stats (e.g. "TOP 1%") shrink so a 4-char string still fills the card.
  const isLongStat = data.stat.length > 4;

  return (
    <View
      style={[
        styles.shell,
        glowing ? shadows.cardGlow : shadows.card,
        { borderRadius: isMini ? 32 : radius.lg },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.surface,
          {
            borderRadius: isMini ? 32 : radius.lg,
            padding: isMini ? 24 : 32,
          },
        ]}
      >
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: accent, fontSize: isMini ? 11 : 13 }]}>
              {data.label.toUpperCase()}
            </Text>
            <Text style={[styles.subLabel, { fontSize: isMini ? 12 : 14 }]}>WRAP / '26</Text>
          </View>
          <PixelIcon name={iconName} size={isMini ? 36 : 56} color={accent} />
        </View>

        {/* Big stat block */}
        <View style={styles.statBlock}>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[
              styles.stat,
              {
                fontSize: isMini ? (isLongStat ? 48 : 72) : isLongStat ? 96 : 128,
              },
            ]}
          >
            {data.stat}
          </Text>
          {data.statUnit ? (
            <Text style={[styles.statUnit, { color: accent, fontSize: isMini ? 14 : 22 }]}>
              {data.statUnit}
            </Text>
          ) : null}
          <Text style={[styles.sub, { fontSize: isMini ? 12 : 16 }]}>{data.sub}</Text>
        </View>

        {/* AI line — only on the full card; mini variant skips for clarity */}
        {!isMini && (
          <View style={styles.lineBlock}>
            <Text style={styles.line}>"{data.line}"</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.pubkey, { fontSize: isMini ? 9 : 11 }]}>{data.pubkey}</Text>
          <Text style={[styles.wordmark, { fontSize: isMini ? 12 : 16 }]}>WRAP</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    aspectRatio: 9 / 14,
    width: '100%',
    overflow: 'hidden',
  },
  surface: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontWeight: '900',
    letterSpacing: 3,
    opacity: 0.95,
  },
  subLabel: {
    fontWeight: '900',
    color: colors.white,
    marginTop: 4,
    opacity: 0.85,
    letterSpacing: -0.2,
  },
  statBlock: {
    marginTop: 12,
  },
  stat: {
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -3,
    lineHeight: undefined,
  },
  statUnit: {
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  sub: {
    fontWeight: '600',
    color: colors.white,
    opacity: 0.85,
    marginTop: 8,
    letterSpacing: -0.2,
  },
  lineBlock: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: colors.hairline,
  },
  line: {
    fontSize: fontSizes.cardLine - 16, // slightly compressed for mobile dp space
    fontWeight: '600',
    color: colors.white,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  pubkey: {
    color: colors.white,
    opacity: 0.7,
    letterSpacing: 1,
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  wordmark: {
    color: colors.white,
    fontWeight: '900',
    letterSpacing: -1,
  },
});
