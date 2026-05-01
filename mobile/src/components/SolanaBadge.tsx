// "Built on Solana" attribution badge — text-only.
//
// Original implementation paired a SolanaMark approximation with the
// label, but Solana brand guidelines explicitly forbid modified logos.
// To stay safely on the right side of that policy we ship text-only:
// no mark, no risk of looking like an unauthorized logo derivative.

import { Text, StyleSheet, Pressable, Linking } from 'react-native';
import { colors, spacing } from '../theme/tokens';

export default function SolanaBadge({
  size = 'sm',
  onPress,
}: {
  size?: 'sm' | 'md';
  onPress?: () => void;
}) {
  const fontSize = size === 'md' ? 13 : 11;

  const handlePress =
    onPress ??
    (() => {
      Linking.openURL('https://solana.com').catch(() => {});
    });

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      accessible
      accessibilityRole="link"
      accessibilityLabel="Built on Solana blockchain"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={[styles.label, { fontSize }]}>BUILT ON SOLANA</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  pressed: { opacity: 0.6 },
  label: {
    color: colors.solanaGreen,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
