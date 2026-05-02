// BattleResultScreen — Phase 2a stub.
//
// Receives walletA + walletB from route params, calls runBattle on
// mount, and shows three states: loading / error / success.
// Phase 2a only renders a placeholder on success — Phase 2b (next
// session) will replace that with the per-round reveal and Champion-
// NFT mint CTA.

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { runBattle } from '../services/battle-engine';
import { shortenAddress } from '../lib/wallet';
import { colors, radius, spacing } from '../theme/tokens';
import type { BattleResult } from '../types/battle';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BattleResult'>;

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; result: BattleResult };

export default function BattleResultScreen({ navigation, route }: Props) {
  const { walletA, walletB } = route.params;
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const result = await runBattle(walletA, walletB);
        if (alive) setState({ kind: 'success', result });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Battle failed';
        if (alive) setState({ kind: 'error', message: msg });
      }
    })();
    return () => {
      alive = false;
    };
  }, [walletA, walletB, reloadKey]);

  if (state.kind === 'loading') {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color={colors.solanaPurple} />
          <Text style={styles.loadingTitle}>Analyzing wallets…</Text>
          <View style={styles.vsRow}>
            <Text style={styles.walletMono}>{shortenAddress(walletA, 5)}</Text>
            <Text style={styles.vsLabel}>VS</Text>
            <Text style={styles.walletMono}>{shortenAddress(walletB, 5)}</Text>
          </View>
          <Text style={styles.loadingSub}>
            Reading on-chain history for both, scoring 4 categories,
            generating commentary.
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  if (state.kind === 'error') {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.errorTitle}>Battle didn't start.</Text>
          <Text style={styles.errorBody}>{state.message}</Text>
          <Pressable
            onPress={() => setReloadKey((k) => k + 1)}
            style={styles.retryBtn}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backLink}
          >
            <Text style={styles.backLinkText}>Back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // success — Phase 2b will render the full per-round reveal here
  const { result } = state;
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.centered}>
        <Text style={styles.placeholderTitle}>
          Battle complete — Phase 2b will render here
        </Text>
        <Text style={styles.placeholderScore}>
          {JSON.stringify(result.finalScore)}
        </Text>
        <Text style={styles.placeholderWinner}>
          Winner: Wallet {result.overallWinner}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.againBtn}
        >
          <Text style={styles.againText}>Battle again</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: spacing.md,
  },
  loadingSub: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  walletMono: {
    color: colors.textSecondary,
    fontFamily: 'Courier',
    fontSize: 14,
  },
  vsLabel: {
    color: colors.solanaMagenta,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 3,
  },
  errorTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  errorBody: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.solanaPurple,
  },
  retryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  backLink: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  backLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholderScore: {
    color: colors.solanaGreen,
    fontFamily: 'Courier',
    fontSize: 16,
    marginTop: spacing.md,
  },
  placeholderWinner: {
    color: colors.solanaPurple,
    fontWeight: '900',
    fontSize: 30,
    marginTop: spacing.md,
    letterSpacing: -0.5,
  },
  againBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  againText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
