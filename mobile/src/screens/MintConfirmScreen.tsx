// MintConfirmScreen — Screen 3 layout per "WRAP - Solana Colosseum"/screens.jsx.
//
// Flow:
//   • Confetti overlay across the screen
//   • Ambient red→violet glow behind the card
//   • Top bar: back + green "Confirmed" pill
//   • Mini glowing card preview
//   • Headline: "Your story is on-chain."
//   • "cNFT minted to {pubkey}"
//   • CTAs: View on Solscan (outline) + Share again (gradient)

import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Card from '../components/Card';
import Confetti from '../components/Confetti';
import { buildShareText, shareCardImage } from '../lib/share-card';
import type { RootStackParamList } from '../types';
import { colors, gradients, radius, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'MintConfirm'>;

const SOLSCAN_DEVNET = (sig: string) =>
  `https://solscan.io/tx/${sig}?cluster=devnet`;

export default function MintConfirmScreen({ navigation, route }: Props) {
  const { signature, cardData } = route.params;
  const cardWrapRef = useRef<View>(null);

  const onSolscan = async () => {
    const url = SOLSCAN_DEVNET(signature);
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Solscan', `Could not open ${url}`);
    }
  };

  const onShareAgain = async () => {
    const text = buildShareText(cardData.cardType, cardData.line);
    await shareCardImage(cardWrapRef.current, text);
  };

  return (
    <View style={styles.root}>
      <Confetti />

      <View pointerEvents="none" style={styles.glowWrap}>
        <LinearGradient
          colors={['rgba(254,59,104,0.25)', 'rgba(153,69,255,0.15)', 'transparent']}
          style={styles.glow}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
          <View style={styles.confirmedPill}>
            <View style={styles.confirmedDot} />
            <Text style={styles.confirmedText}>CONFIRMED</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Mini glowing card */}
        <View style={styles.cardArea}>
          <View
            ref={cardWrapRef}
            collapsable={false}
            style={styles.miniWrap}
          >
            <Card data={cardData} variant="mini" glowing />
          </View>
        </View>

        {/* Headline */}
        <View style={styles.copy}>
          <Text style={styles.headline}>Your story is</Text>
          <Text style={[styles.headline, styles.headlineGrad]}>on-chain.</Text>
          <Text style={styles.sub}>
            cNFT minted to <Text style={styles.subMono}>{cardData.pubkey}</Text>
          </Text>
          <Text style={styles.sigText}>tx: {shorten(signature)}</Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <Pressable onPress={onSolscan} style={styles.ctaOutline}>
            <Text style={styles.ctaText}>View on Solscan</Text>
          </Pressable>
          <Pressable onPress={onShareAgain} style={styles.ctaGradWrap}>
            <LinearGradient
              colors={gradients.primaryDuo as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaText}>Share again</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function shorten(s: string): string {
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  glowWrap: {
    position: 'absolute',
    top: 200,
    left: -80,
    right: -80,
    height: 600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 600,
    height: 600,
    borderRadius: 300,
    opacity: 0.6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.greenBgTint,
    borderWidth: 1,
    borderColor: colors.greenBorder,
  },
  confirmedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  confirmedText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  miniWrap: {
    width: '85%',
  },
  copy: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  headline: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
    letterSpacing: -1,
  },
  headlineGrad: {
    color: colors.solanaRed,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.sm,
    letterSpacing: -0.2,
  },
  subMono: {
    color: colors.white,
    fontWeight: '600',
    fontFamily: 'Courier',
  },
  sigText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Courier',
    marginTop: 6,
  },
  ctas: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  ctaOutline: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaGradWrap: {
    flex: 1,
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  ctaGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
