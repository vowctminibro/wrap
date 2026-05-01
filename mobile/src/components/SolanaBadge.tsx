// "Built on Solana" attribution badge — the SolanaMark + label, in a row.
// Drop into any footer to credit the chain.
//
// Accessible: announces "Built on Solana blockchain" via accessibilityLabel.

import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import SolanaMark from './SolanaMark';
import { colors, spacing } from '../theme/tokens';

export default function SolanaBadge({
  size = 'sm',
  onPress,
}: {
  size?: 'sm' | 'md';
  onPress?: () => void;
}) {
  const markSize = size === 'md' ? 24 : 18;
  const fontSize = size === 'md' ? 14 : 12;

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
      <SolanaMark size={markSize} />
      <Text style={[styles.label, { fontSize }]}>Built on Solana</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  pressed: { opacity: 0.7 },
  label: {
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
