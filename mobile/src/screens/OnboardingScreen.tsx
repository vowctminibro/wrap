import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../types';
import { colors, gradients, fontSizes, spacing, radius } from '../theme/tokens';
import { connectWallet } from '../lib/wallet';
import { analyzeWallet } from '../lib/wallet-analyzer';
import { getAllAssets, getWalletTransactions } from '../services/helius';
import SolanaBadge from '../components/SolanaBadge';
import Wordmark from '../components/Wordmark';
import AmbientBlob from '../components/AmbientBlob';

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
  gradient: readonly string[];
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
  const [noWalletModalOpen, setNoWalletModalOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const analyzeAndNavigate = async (publicKey: string) => {
    let transactions, assets;
    try {
      [transactions, assets] = await Promise.all([
        getWalletTransactions(publicKey, 200),
        getAllAssets(publicKey),
      ]);
    } catch (e) {
      // Helius timeout / rate-limit / network — surface a clean message
      // and let the user retry instead of dying on a raw error string.
      Alert.alert(
        'Wallet history unavailable',
        'Could not reach the indexer. Check your connection and try again.'
      );
      return;
    }

    const analysis = analyzeWallet({ address: publicKey, transactions, assets });

    if (analysis.totalTransactions === 0) {
      Alert.alert(
        'New wallet',
        "We couldn't find any on-chain history for this wallet yet. WRAP works best after a few transactions."
      );
      return;
    }

    navigation.navigate('CardReveal', { publicKey, analysis });
  };

  const onConnect = async () => {
    setConnecting(true);
    // Two-stage error handling: MWA failures (no wallet app installed,
    // user cancels, intent rejected) open the in-app fallback modal so
    // judges/users without a wallet don't get bounced to chrome.solana.com
    // by Android's ActivityNotFoundException → unhandled-intent path.
    // Post-connect failures (network, indexer) keep the existing Alert
    // surface since the user has already cleared the wallet step.
    let publicKey: string;
    try {
      publicKey =
        Platform.OS === 'android'
          ? (await connectWallet()).publicKey
          : DEV_FALLBACK_PUBKEY;
    } catch {
      setConnecting(false);
      setNoWalletModalOpen(true);
      return;
    }
    try {
      await analyzeAndNavigate(publicKey);
    } finally {
      setConnecting(false);
    }
  };

  // Demo / emulator path: skip MWA entirely, run the same analysis +
  // insight pipeline against the well-known Helius docs example wallet.
  // Lets us exercise the full UX without a Phantom dep.
  const onTrySample = async () => {
    setConnecting(true);
    try {
      await analyzeAndNavigate(DEV_FALLBACK_PUBKEY);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Soft-radial ambient blobs — Solana brand purple top-left,
          green bottom-right. Each fades to fully transparent at its
          own edge, so there is no hard ring on the dark backdrop. */}
      <AmbientBlob
        color={colors.solanaPurple}
        size={700}
        style={styles.blobPurple}
      />
      <AmbientBlob
        color={colors.solanaGreen}
        size={700}
        style={styles.blobGreen}
      />

      <SafeAreaView
        style={[
          styles.safe,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View style={styles.wordmarkWrap}>
          {/* Wordmark self-caps to screen width minus margin, so passing
              the bigger ideal size is safe — narrower screens shrink
              proportionally instead of cropping. */}
          <Wordmark size={120} variant="gradient" glow />
          <Text style={styles.year}>'26</Text>
        </View>

        <View style={styles.floatingStack}>
          {/* Decorative preview cards. Stat slot uses an abstract glyph,
              not a measured value — judges noticed hardcoded "847" and
              "1,284" looking like real per-wallet data. */}
          <FloatingPreview
            rotate={-14}
            top={20}
            left={-30}
            scale={0.78}
            gradient={gradients.card.diamond}
            label="DIAMOND"
            stat="◆◆◆"
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
            stat="◆◆◆"
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

        <Pressable
          onPress={onTrySample}
          disabled={connecting}
          style={({ pressed }) => [styles.ctaSample, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaSampleText}>Try with sample wallet</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Leaderboard')}
          style={({ pressed }) => [
            styles.ctaLeaderboard,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text style={styles.ctaLeaderboardText}>🏆  Leaderboard</Text>
        </Pressable>

        <View style={styles.badgeWrap}>
          <SolanaBadge size="sm" />
        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent
        visible={noWalletModalOpen}
        onRequestClose={() => setNoWalletModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setNoWalletModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Solana Wallet Required</Text>
            <Text style={styles.modalBody}>
              Connecting requires Seeker, Phantom, or another Solana wallet
              app installed on this device. Try the sample wallet to explore
              WRAP.
            </Text>
            <Pressable
              onPress={() => {
                setNoWalletModalOpen(false);
                onTrySample();
              }}
              style={({ pressed }) => [
                styles.modalPrimary,
                pressed && styles.ctaPressed,
              ]}
            >
              <LinearGradient
                colors={
                  gradients.primary as unknown as readonly [
                    string,
                    string,
                    ...string[]
                  ]
                }
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.modalPrimaryGrad}
              >
                <Text style={styles.modalPrimaryText}>Try Sample Wallet</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => setNoWalletModalOpen(false)}
              style={({ pressed }) => [
                styles.modalSecondary,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  // Two-tone ambient glow — Solana brand purple top-left, green
  // bottom-right. The blob sizes (700 dp) extend off-screen so the
  // visible portion is the soft inner falloff of the radial gradient.
  blobPurple: {
    position: 'absolute',
    top: -260,
    left: -260,
  },
  blobGreen: {
    position: 'absolute',
    bottom: -260,
    right: -260,
  },
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    // Bottom padding is set inline as `insets.bottom + spacing.lg` so
    // the sample-wallet pill clears the system gesture/nav bar on
    // every screen size (the static spacing.lg fallback wasn't enough
    // on tall AVDs with no nav bar).
    justifyContent: 'space-between',
  },
  wordmarkWrap: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  year: {
    fontSize: fontSizes.bodySm,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 8,
    marginTop: spacing.xs,
  },
  floatingStack: {
    height: 180,
    marginVertical: spacing.sm,
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
    marginVertical: spacing.md,
  },
  headline: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  headlineGrad: {
    color: colors.solanaPurple,
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
  ctaSample: {
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    // Solana green border — sits well against the purple-dominant
    // hero composition above.
    borderColor: colors.solanaGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  ctaSampleText: {
    color: colors.solanaGreen,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  ctaLeaderboard: {
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.solanaMagenta,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  ctaLeaderboardText: {
    color: colors.solanaMagenta,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  badgeWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.solanaPurple,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  modalBody: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  modalPrimary: {
    height: 52,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  modalPrimaryGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalSecondary: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
