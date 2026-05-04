// Tertiary affiliate CTA — small, below primary Share/Mint actions.
// Maps cardType to the partner ecosystem most relevant to the story:
//
//   recap   → Jupiter    ("Swap into your top token via Jupiter")
//
// (Diamond → MarginFi "Borrow against this without selling" was
// removed Day 14: the lending integration is post-Frontier work, so
// the link was dead — `null` from SPECS makes the button render
// nothing for diamond cards rather than dangle a roadmap promise.
//
// OG → Magic Eden was removed Day 16 (Round 4): no confirmed
// partnership and the ?ref=WRAP_SOL code didn't track anything, so
// the CTA was implying a relationship we don't have. If Vow signs a
// real ME affiliate later, restore this spec.)
//
// All links carry ?ref=WRAP_SOL so the partner can attribute and we can
// track affiliate conversion in Phase Polish.

import { Pressable, Text, StyleSheet, Linking, Alert } from 'react-native';
import { colors, spacing, radius } from '../theme/tokens';
import type { CardData, CardType, WalletAnalysis } from '../types';

const REF = 'WRAP_SOL';

type Spec = {
  label: string;
  href: (analysis: WalletAnalysis, card: CardData) => string;
};

const SPECS: Partial<Record<CardType, Spec>> = {
  recap: {
    label: 'Swap into your top token via Jupiter →',
    href: (a) => {
      const top = a.topTokensByValue[0]?.symbol ?? 'SOL';
      return `https://jup.ag/swap/USDC-${encodeURIComponent(top)}?ref=${REF}`;
    },
  },
};

export default function AffiliateButton({
  card,
  analysis,
}: {
  card: CardData;
  analysis: WalletAnalysis;
}) {
  const spec = SPECS[card.cardType];
  if (!spec) return null;

  const onPress = async () => {
    const url = spec.href(analysis, card);
    // No canOpenURL precheck — Android 11+ (API 30+) returns false for
    // https URLs unless the host app declares <queries> in its manifest,
    // which made the CTA tap-fail with "Could not open …" even though
    // the URL was valid and the OS would dispatch to the default browser.
    // Linking.openURL itself throws if nothing handles the intent, so
    // the catch below is the only error path we actually need.
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Affiliate', (e as Error).message || 'Could not open link');
    }
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
      <Text style={styles.label}>{spec.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pressed: { opacity: 0.7 },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
