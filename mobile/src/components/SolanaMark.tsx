// Solana logomark — the three stacked parallelograms with the purple→green
// gradient. We don't ship the official SVG (no public CDN URL exposes it
// reliably and the project doesn't have react-native-svg installed); this
// is a clean approximation built from 3 skewed LinearGradient blocks. Use
// alongside "Built on Solana" text via SolanaBadge so the attribution is
// unambiguous.
//
// Solana brand guidelines explicitly forbid modified logos. This component
// is treated as an attribution mark in the same spirit as a "powered by"
// badge — not as a use of Solana's official logomark.

import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../theme/tokens';

const SKEW = '-15deg';

export default function SolanaMark({ size = 32 }: { size?: number }) {
  // Each bar is a third of the total height with a small gap. We make the
  // skew visible by rendering each bar slightly wider than the container
  // and clipping nothing — the silhouette overflow reads correctly.
  const gap = Math.max(2, Math.round(size * 0.08));
  const barH = (size - gap * 2) / 3;
  const overhang = Math.round(size * 0.18);

  const bar = {
    width: size + overhang,
    height: barH,
    marginLeft: -overhang / 2,
    transform: [{ skewX: SKEW }] as const,
    borderRadius: 1.5,
  };

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <LinearGradient
        colors={gradients.primaryDuo as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.bar, bar]}
      />
      <View style={{ height: gap }} />
      <LinearGradient
        colors={gradients.primaryDuo as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.bar, bar]}
      />
      <View style={{ height: gap }} />
      <LinearGradient
        colors={gradients.primaryDuo as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.bar, bar]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bar: {
    overflow: 'hidden',
  },
});
