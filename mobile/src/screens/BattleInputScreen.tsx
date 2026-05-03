// BattleInputScreen — Phase 2a entry point for the Battle feature.
//
// Two paths to a battle:
//   1. Pick a curated demo pair (DEMO_BATTLE_PAIRS).
//      Pairs with TODO placeholders are rendered disabled with a
//      "Coming soon" pill until Vow drops in real pubkeys.
//   2. Paste a custom Wallet B; current wallet is shown read-only as
//      Wallet A. Live validation: must be valid base58 AND differ
//      from Wallet A before "Start Battle" enables.
//
// Phase 2b (next session) will replace BattleResultScreen's stub
// with the 4-round reveal + Champion-NFT mint CTA.

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PublicKey } from '@solana/web3.js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AmbientBlob from '../components/AmbientBlob';
import {
  DEMO_BATTLE_PAIRS,
  isDemoPairEnabled,
  type DemoBattlePair,
} from '../data/demo-battle-pairs';
import { shortenAddress } from '../lib/wallet';
import { displayName } from '../data/known-wallets';
import { colors, gradients, radius, spacing } from '../theme/tokens';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BattleInput'>;

function isValidPubkey(s: string): boolean {
  const v = s.trim();
  if (v.length < 32 || v.length > 50) return false;
  try {
    const pk = new PublicKey(v);
    // PublicKey accepts shorter inputs by left-padding; round-trip
    // through toBase58() to ensure exact match.
    return pk.toBase58() === v;
  } catch {
    return false;
  }
}

export default function BattleInputScreen({ navigation, route }: Props) {
  const { walletA } = route.params;
  const [walletB, setWalletB] = useState('');

  const trimmedB = walletB.trim();
  const isValid = isValidPubkey(trimmedB);
  const isSelf = trimmedB === walletA;
  const showError = trimmedB.length >= 32 && (!isValid || isSelf);
  const errorText = isSelf
    ? "That's your own wallet — battle needs two different wallets."
    : !isValid
      ? 'Not a valid Solana address.'
      : '';
  const canStart = isValid && !isSelf;

  const onPickPair = (pair: DemoBattlePair) => {
    if (!isDemoPairEnabled(pair)) return;
    navigation.navigate('BattleResult', {
      walletA: pair.walletA,
      walletB: pair.walletB,
    });
  };

  const onStartCustom = () => {
    if (!canStart) return;
    navigation.navigate('BattleResult', { walletA, walletB: trimmedB });
  };

  return (
    <View style={styles.root}>
      <AmbientBlob
        color={colors.solanaPurple}
        size={600}
        style={styles.blobPurple}
      />
      <AmbientBlob
        color={colors.solanaMagenta}
        size={600}
        style={styles.blobMagenta}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Close"
          >
            <Text style={styles.backBtnText}>×</Text>
          </Pressable>
          <Text style={styles.topLabel}>BATTLE</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.h1}>Pick a demo battle</Text>
            <Text style={styles.h2}>
              Curated pairs that show the engine's range.
            </Text>

            <View style={styles.pairs}>
              {DEMO_BATTLE_PAIRS.map((pair) => {
                const enabled = isDemoPairEnabled(pair);
                return (
                  <Pressable
                    key={pair.id}
                    onPress={() => onPickPair(pair)}
                    disabled={!enabled}
                    style={({ pressed }) => [
                      styles.pairCard,
                      !enabled && styles.pairCardDisabled,
                      enabled && pressed && styles.pairPressed,
                    ]}
                  >
                    <View style={styles.pairCardInner}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.pairLabel, !enabled && styles.dim]}
                        >
                          {pair.label}
                        </Text>
                        <Text
                          style={[styles.pairTagline, !enabled && styles.dim]}
                        >
                          {pair.tagline}
                        </Text>
                      </View>
                      {!enabled ? (
                        <View style={styles.comingSoon}>
                          <Text style={styles.comingSoonText}>
                            COMING SOON
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.chevron}>›</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.h1}>Battle a custom wallet</Text>

            <View style={styles.walletBox}>
              <Text style={styles.walletLabel}>WALLET A — YOU</Text>
              <Text style={styles.walletValue}>
                {displayName(walletA, 6)}
              </Text>
            </View>

            <View style={styles.walletBox}>
              <Text style={styles.walletLabel}>WALLET B</Text>
              <TextInput
                value={walletB}
                onChangeText={setWalletB}
                placeholder="Paste a Solana wallet address"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                multiline={false}
              />
              {showError ? (
                <Text style={styles.errorText}>{errorText}</Text>
              ) : null}
            </View>

            <Pressable
              onPress={onStartCustom}
              disabled={!canStart}
              style={({ pressed }) => [
                styles.cta,
                !canStart && styles.ctaDisabled,
                canStart && pressed && styles.ctaPressed,
              ]}
            >
              <LinearGradient
                colors={
                  gradients.primaryDuo as unknown as readonly [
                    string,
                    string,
                    ...string[],
                  ]
                }
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaText}>Start Battle</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  blobPurple: { position: 'absolute', top: -220, left: -220 },
  blobMagenta: { position: 'absolute', bottom: -220, right: -220 },
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
    fontSize: 24,
    fontWeight: '700',
    marginTop: -2,
  },
  topLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  h1: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: spacing.lg,
  },
  h2: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  pairs: { gap: spacing.sm },
  pairCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  pairCardDisabled: { opacity: 0.55 },
  pairCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  pairPressed: { opacity: 0.7 },
  pairLabel: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pairTagline: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontStyle: 'italic',
  },
  dim: { color: colors.textMuted },
  chevron: {
    color: colors.solanaGreen,
    fontSize: 28,
    fontWeight: '600',
    marginRight: 4,
  },
  comingSoon: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  comingSoonText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairlineSoft,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
  walletBox: {
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  walletLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  walletValue: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  input: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Courier',
    paddingVertical: 4,
  },
  errorText: {
    color: colors.solanaMagenta,
    fontSize: 12,
    marginTop: 6,
  },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaPressed: { opacity: 0.85 },
  ctaGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
