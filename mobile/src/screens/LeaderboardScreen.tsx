// LeaderboardScreen — Phase 1.
//
// Pulls battle history from AsyncStorage, computes Top Winners (top 5
// by wins, ties broken by total battles), and lists the 10 most recent
// battles. Auto-seeds on first ever mount via seedHistoryIfNeeded so
// judges always see a populated board on a fresh install.
//
// Empty state shows only after a manual clearHistory() — the seeded
// flag survives so re-mount doesn't replay seeds, which is the intended
// dev shortcut for verifying the empty UI.

import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';

import { getHistory, type BattleHistoryRecord } from '../services/battleHistory';
import { seedHistoryIfNeeded } from '../data/seededBattles';
import { shortenAddress } from '../lib/wallet';
import { displayName } from '../data/known-wallets';
import { formatRelative } from '../lib/relative-time';
import { uploadImageToPinata } from '../services/pinata';
import ShareLeaderboardCard from '../components/ShareLeaderboardCard';
import { colors, gradients, radius, spacing } from '../theme/tokens';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Leaderboard'>;

const DEMO_WALLET_A = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

type Standing = {
  pubkey: string;
  wins: number;
  total: number;
};

function showToast(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert(msg);
  }
}

export default function LeaderboardScreen({ navigation }: Props) {
  const [history, setHistory] = useState<BattleHistoryRecord[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const shareCardRef = useRef<View>(null);

  const load = useCallback(async () => {
    await seedHistoryIfNeeded();
    const records = await getHistory();
    setHistory(records);
  }, []);

  // Refresh on every focus so a battle finished in the back-stack
  // shows up the moment the user navigates back here.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const onShare = useCallback(async () => {
    if (sharing) return;
    if (!shareCardRef.current) {
      // Off-screen render target hasn't mounted/measured yet. Silent
      // return previously made the tap look broken; toast lets the user
      // know to retry once the screen finishes laying out.
      console.warn('[share] shareCardRef.current is null — capture target not mounted');
      showToast('Loading… try again in a moment');
      return;
    }
    setSharing(true);

    // Phase 2C share flow: capture → upload → open share sheet.
    // Each step has its own try/catch so a capture failure logs
    // distinctly from an upload failure, and the user-facing toast
    // surfaces only when we genuinely can't recover.
    let localUri = '';
    try {
      localUri = await captureRef(shareCardRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
    } catch (e) {
      console.warn(`[share] capture failed: ${(e as Error).message}`);
      showToast('Could not generate share link — try again');
      setSharing(false);
      return;
    }

    let publicUrl: string | null = null;
    try {
      publicUrl = await uploadImageToPinata(
        localUri,
        `wrap-leaderboard-${Date.now()}`
      );
    } catch (e) {
      console.warn(`[share] upload failed: ${(e as Error).message}`);
      showToast('Could not generate share link — try again');
      setSharing(false);
      return;
    }
    if (!publicUrl) {
      // No JWT configured → no point asking the user to retry.
      console.warn('[share] pinata not configured (no EXPO_PUBLIC_PINATA_JWT)');
      showToast('Sharing is not configured for this build');
      setSharing(false);
      return;
    }

    // Sharing.shareAsync expects a local file URI on Android, so
    // attempting to share a remote https URL there typically throws —
    // that's the path that lands us in the Clipboard fallback. iOS
    // accepts remote URLs in some versions; either way the catch
    // recovers cleanly.
    try {
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(publicUrl, {
          dialogTitle: 'Share WRAP Leaderboard',
        });
      } else {
        await Clipboard.setStringAsync(publicUrl);
        showToast('Link copied');
      }
    } catch (e) {
      console.warn(`[share] share sheet failed: ${(e as Error).message}`);
      try {
        await Clipboard.setStringAsync(publicUrl);
        showToast('Link copied');
      } catch (e2) {
        console.warn(`[share] clipboard failed: ${(e2 as Error).message}`);
        showToast('Could not generate share link — try again');
      }
    } finally {
      setSharing(false);
    }
  }, [sharing]);

  if (history === null) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator color={colors.solanaPurple} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  const standings = computeStandings(history).slice(0, 5);
  const recent = history.slice(0, 10);
  const isEmpty = history.length === 0;

  return (
    <View style={styles.root}>
      {/* Off-screen render target for view-shot. Lives in the tree so it's
          measured and laid out, but pushed left:-10000 so it never paints
          over real UI. display:none would skip layout and break capture. */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareLeaderboardCard
          ref={shareCardRef}
          standings={history.length > 0 ? computeStandings(history).slice(0, 3) : []}
          recent={history.slice(0, 3)}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.headerLabel}>BATTLE LEADERBOARD</Text>
          {/* Share button is hidden — not just disabled — when there's
              nothing to share. The previous opacity:0.4 disabled state
              read as "tap-broken" on-Seeker because the icon still
              looked tappable. Empty leaderboard happens only after a
              dev clearHistory(); seeded launches always populate. */}
          {isEmpty ? (
            <View style={styles.shareBtnPlaceholder} />
          ) : (
            <Pressable
              onPress={onShare}
              disabled={sharing}
              style={({ pressed }) => [
                styles.shareBtn,
                sharing && styles.shareBtnDisabled,
                pressed && styles.shareBtnPressed,
              ]}
              accessibilityLabel="Share leaderboard"
            >
              {sharing ? (
                <ActivityIndicator color={colors.solanaMagenta} size="small" />
              ) : (
                <Text style={styles.shareBtnText}>↗</Text>
              )}
            </Pressable>
          )}
        </View>

        {isEmpty ? (
          <EmptyState
            onStart={() =>
              navigation.navigate('BattleInput', { walletA: DEMO_WALLET_A })
            }
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.solanaPurple}
              />
            }
          >
            <SectionHeader label="TOP WINNERS" />
            <View style={styles.sectionBlock}>
              {standings.map((s, i) => (
                <StandingRow
                  key={s.pubkey}
                  rank={i + 1}
                  standing={s}
                  onPress={() =>
                    navigation.navigate('WalletDetail', { pubkey: s.pubkey })
                  }
                />
              ))}
            </View>

            <SectionHeader label="RECENT BATTLES" />
            <View style={styles.sectionBlock}>
              {recent.map((r) => (
                <RecentRow
                  key={r.id}
                  record={r}
                  onPress={() =>
                    navigation.navigate('BattleResult', {
                      walletA: r.winnerPubkey,
                      walletB: r.loserPubkey,
                      replay: r,
                    })
                  }
                />
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{label}</Text>
    </View>
  );
}

function StandingRow({
  rank,
  standing,
  onPress,
}: {
  rank: number;
  standing: Standing;
  onPress: () => void;
}) {
  const rankColor =
    rank === 1
      ? colors.solanaGreen
      : rank === 2
        ? colors.solanaPurple
        : rank === 3
          ? colors.solanaMagenta
          : colors.textMuted;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={[styles.rank, { color: rankColor }]}>{rank}</Text>
      <Text style={styles.rowMono}>{displayName(standing.pubkey, 4)}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.rowStat}>
        {standing.wins}W / {standing.total}B
      </Text>
    </Pressable>
  );
}

function RecentRow({
  record,
  onPress,
}: {
  record: BattleHistoryRecord;
  onPress: () => void;
}) {
  const winner = displayName(record.winnerPubkey, 4);
  const loser = displayName(record.loserPubkey, 4);
  const hi = Math.max(record.finalScore.a, record.finalScore.b);
  const lo = Math.min(record.finalScore.a, record.finalScore.b);
  const ago = formatRelative(record.timestamp);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.recentRow, pressed && styles.rowPressed]}
    >
      <Text style={styles.recentLine}>
        <Text style={styles.recentMono}>{winner}</Text>
        <Text style={styles.recentVerb}> defeated </Text>
        <Text style={styles.recentMono}>{loser}</Text>
      </Text>
      <View style={styles.recentMeta}>
        <Text style={styles.recentScore}>
          {hi}-{lo}
        </Text>
        <Text style={styles.recentDot}>·</Text>
        <Text style={styles.recentAgo}>{ago}</Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTrophy}>🏆</Text>
      <Text style={styles.emptyTitle}>No battles yet</Text>
      <Text style={styles.emptySub}>
        Start the first one — wallets earn ranks here.
      </Text>
      <Pressable
        onPress={onStart}
        style={({ pressed }) => [
          styles.emptyCta,
          pressed && styles.ctaPressed,
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
          style={styles.emptyCtaInner}
        >
          <Text style={styles.emptyCtaText}>Start a Battle</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function computeStandings(history: BattleHistoryRecord[]): Standing[] {
  const map = new Map<string, { wins: number; total: number }>();
  const bump = (pubkey: string, isWin: boolean) => {
    const e = map.get(pubkey) ?? { wins: 0, total: 0 };
    if (isWin) e.wins += 1;
    e.total += 1;
    map.set(pubkey, e);
  };
  for (const r of history) {
    bump(r.winnerPubkey, true);
    bump(r.loserPubkey, false);
  }
  return Array.from(map.entries())
    .map(([pubkey, v]) => ({ pubkey, wins: v.wins, total: v.total }))
    .sort((a, b) => b.wins - a.wins || b.total - a.total);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  offscreen: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 1200,
    height: 675,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Placeholder keeps the back/title/share-slot layout balanced when
  // the share button is hidden in the empty state.
  shareBtnPlaceholder: { width: 40, height: 40 },
  shareBtnPressed: { opacity: 0.7 },
  shareBtnDisabled: { opacity: 0.4 },
  shareBtnText: {
    color: colors.solanaMagenta,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
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
  headerLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // Sections
  scroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    color: colors.solanaMagenta,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },
  sectionBlock: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.xs,
  },

  // Standing row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  rowPressed: { opacity: 0.7 },
  rank: {
    fontSize: 18,
    fontWeight: '900',
    width: 24,
    textAlign: 'center',
  },
  rowMono: {
    color: colors.white,
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: '600',
  },
  rowStat: {
    color: colors.textSecondary,
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '700',
  },

  // Recent row
  recentRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 4,
  },
  recentLine: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recentMono: {
    color: colors.white,
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  recentVerb: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recentScore: {
    color: colors.solanaGreen,
    fontFamily: 'Courier',
    fontSize: 12,
    fontWeight: '800',
  },
  recentDot: {
    color: colors.textMuted,
    fontSize: 12,
  },
  recentAgo: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTrophy: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  emptyCta: {
    height: 52,
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  emptyCtaInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCtaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  ctaPressed: { opacity: 0.85 },
});
