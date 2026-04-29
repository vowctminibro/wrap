// Tertiary affiliate CTA — small, below primary Share/Mint actions.
// Maps cardType to the partner ecosystem most relevant to the story:
//
//   diamond → MarginFi   ("Borrow against this without selling")
//   og      → Magic Eden ("Mint commemorative NFT via Magic Eden")
//   recap   → Jupiter    ("Swap into your top token via Jupiter")
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
  diamond: {
    label: 'Borrow against this without selling →',
    href: () => `https://app.marginfi.com?ref=${REF}`,
  },
  og: {
    label: 'Mint commemorative NFT via Magic Eden →',
    href: () => `https://magiceden.io?ref=${REF}`,
  },
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
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else Alert.alert('Affiliate', `Could not open ${url}`);
    } catch (e) {
      Alert.alert('Affiliate', (e as Error).message);
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
