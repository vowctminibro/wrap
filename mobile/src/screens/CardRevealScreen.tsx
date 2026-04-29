import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { shortenAddress } from '../lib/wallet';

type Props = NativeStackScreenProps<RootStackParamList, 'CardReveal'>;

// Phase 1 placeholder. Real implementation lands in Phase 4 (Day 7) — pulls
// 3 insights via the engine and renders a swipe-paged FlatList of cards.
export default function CardRevealScreen({ route }: Props) {
  const { publicKey, analysis } = route.params;
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.label}>YOUR WRAPPED</Text>
        <Text style={styles.headline}>Card flow lands Day 7.</Text>
        <Text style={styles.sub}>Connected: {shortenAddress(publicKey)}</Text>
        <Text style={styles.sub}>Personality: {analysis.personality}</Text>
        <Text style={styles.sub}>Wallet age: {analysis.walletAgeDays}d</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.micro,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  headline: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
