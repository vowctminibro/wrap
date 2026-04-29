// Phase 4 placeholder. Real implementation lands in Phase 5 (Day 8) —
// confetti, mini Card preview with glow, "View on Solscan", "Share again".

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Card from '../components/Card';
import type { RootStackParamList } from '../types';
import { colors, spacing, radius } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MintConfirm'>;

export default function MintConfirmScreen({ route, navigation }: Props) {
  const { signature, cardData } = route.params;
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.miniWrap}>
          <Card data={cardData} variant="mini" glowing />
        </View>
        <Text style={styles.headline}>Your story is on-chain.</Text>
        <Text style={styles.sig}>tx: {signature.slice(0, 12)}…</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniWrap: {
    width: '60%',
    marginBottom: spacing.lg,
  },
  headline: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  sig: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Courier',
    marginTop: spacing.sm,
  },
  backBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.hairline,
  },
  backText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
