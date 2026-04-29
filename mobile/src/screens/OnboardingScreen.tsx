import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types';
import { colors, gradients, fontSizes, spacing, radius } from '../theme/tokens';
import { connectWallet } from '../lib/wallet';
import { analyzeWallet } from '../lib/wallet-analyzer';
import { getAllAssets, getWalletTransactions } from '../services/helius';

// Real Solana power-user wallet — used as the dev fallback when MWA isn't
// available (iOS / web), so the dev loop sees real data on Mac mini.
const DEV_FALLBACK_PUBKEY = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const FloatingPreview = ({
  rotate,
  top,
  left,
  scale,
  gradient,
  label,
  stat,
}: {
  rotate: number;
  top: number;
  left: number;
  scale: number;
  gradient: readonly [string, string, string];
  label: string;
  stat: string;
}) => (
  <View
    style={[
      styles.floatingCard,
      {
        top,
        left,
        transform: [{ rotate: `${rotate}deg` }, { scale }],
      },
    ]}
  >
    <LinearGradient
      colors={gradient as unknown as readonly [string, string, ...string[]]}
      style={styles.floatingCardInner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.floatingLabel}>{label}</Text>
      <Text style={styles.floatingStat}>{stat}</Text>
    </LinearGradient>
  </View>
);

export default function OnboardingScreen({ navigation }: Props) {
  const [connecting, setConnecting] = useState(false);

  const onConnect = async () => {
    setConnecting(true);
    try {
      const publicKey =
        Platform.OS === 'android'
          ? (await connectWallet()).publicKey
          : DEV_FALLBACK_PUBKEY;

      const [transactions, assets] = await Promise.all([
        getWalletTransactions(publicKey, 200),
        getAllAssets(publicKey),
      ]);
      const analysis = analyzeWallet({ address: publicKey, transactions, assets });

      navigation.navigate('CardReveal', { publicKey, analysis });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Wallet connection failed';
      Alert.alert('Connect Wallet', msg);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Ambient gradient blobs (top-left red, bottom-right violet) */}
      <View style={[styles.blob, styles.blobRed]} />
      <View style={[styles.blob, styles.blobViolet]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.wordmarkWrap}>
          <Text style={styles.wordmark}>WRAP</Text>
          <Text style={styles.year}>'26</Text>
        </View>

        <View style={styles.floatingStack}>
          <FloatingPreview
            rotate={-14}
            top={20}
            left={-30}
            scale={0.78}
            gradient={gradients.card.diamond}
            label="DIAMOND"
            stat="847"
          />
          <FloatingPreview
            rotate={6}
            top={-20}
            left={70}
            scale={0.92}
            gradient={gradients.card.og}
            label="OG STATUS"
            stat="TOP 1%"
          />
          <FloatingPreview
            rotate={18}
            top={40}
            left={170}
            scale={0.82}
            gradient={gradients.card.recap}
            label="2026 RECAP"
            stat="1,284"
          />
        </View>

        <View style={styles.headlineWrap}>
          <Text style={styles.headline}>Your wallet has stories.</Text>
          <Text style={[styles.headline, styles.headlineGrad]}>
            We tell them.
          </Text>
          <Text style={styles.sub}>
            Connect your Solana wallet.{'\n'}Get your Wrapped card.
          </Text>
        </View>

        <Pressable
          onPress={onConnect}
          disabled={connecting}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={gradients.primary as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaGrad}
          >
            {connecting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>Connect Wallet</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Text style={styles.poweredBy}>Powered by Solana</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    opacity: 0.35,
  },
  blobRed: {
    top: -180,
    left: -180,
    backgroundColor: colors.solanaRed,
  },
  blobViolet: {
    bottom: -200,
    right: -180,
    backgroundColor: colors.violet,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  wordmarkWrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  wordmark: {
    fontSize: 88,
    fontWeight: '900',
    color: colors.solanaRed,
    letterSpacing: -4,
    lineHeight: 88,
  },
  year: {
    fontSize: fontSizes.bodySm,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 8,
    marginTop: spacing.xs,
  },
  floatingStack: {
    height: 220,
    marginVertical: spacing.lg,
  },
  floatingCard: {
    position: 'absolute',
    width: 160,
    height: 220,
    borderRadius: 24,
  },
  floatingCardInner: {
    flex: 1,
    borderRadius: 24,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  floatingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 2,
    opacity: 0.9,
  },
  floatingStat: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -2,
  },
  headlineWrap: {
    marginVertical: spacing.lg,
  },
  headline: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  headlineGrad: {
    color: colors.solanaRed,
  },
  sub: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  cta: {
    height: 64,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  poweredBy: {
    textAlign: 'center',
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});
