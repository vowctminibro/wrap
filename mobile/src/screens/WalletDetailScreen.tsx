// WalletDetailScreen — Phase 2A.
//
// Read-only profile for a single wallet pulled from local battle history.
// Reached by tapping a Top Winners row on LeaderboardScreen. No Battle
// CTA here per the Phase 2A spec — the screen exists to surface stats
// and per-battle context, not to drive new battles.
//
// Battle history rows are Pressable but inert; Phase 2B will wire the
// per-battle drill-down.

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  getHistory,
  getWalletStats,
  type BattleHistoryRecord,
  type WalletStats,
} from '../services/battleHistory';
import { shortenAddress } from '../lib/wallet';
import { displayName } from '../data/known-wallets';
import { formatRelative } from '../lib/relative-time';
import { colors, gradients, radius, spacing } from '../theme/tokens';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WalletDetail'>;

export default function WalletDetailScreen({ navigation, route }: Props) {
  const { pubkey } = route.params;
  const [stats, setStats] = useState<WalletStats | null>(null);

  const load = useCallback(async () => {
    const history = await getHistory();
    setStats(getWalletStats(history, pubkey));
  }, [pubkey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.headerLabel}>WALLET PROFILE</Text>
          <View style={{ width: 40 }} />
        </View>

        {stats === null ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.solanaPurple} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <IdentityBlock pubkey={pubkey} />
            <StatsCard stats={stats} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>BATTLE HISTORY</Text>
            </View>

            {stats.battles.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Text style={styles.emptyText}>No battles yet</Text>
              </View>
            ) : (
              <View style={styles.battleList}>
                {stats.battles.map((record) => (
                  <BattleRow
                    key={record.id}
                    record={record}
                    pubkey={pubkey}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function IdentityBlock({ pubkey }: { pubkey: string }) {
  return (
    <View style={styles.identityBlock}>
      <Text style={styles.identityShort}>{displayName(pubkey, 4)}</Text>
      <Text style={styles.identityFull} numberOfLines={1} ellipsizeMode="middle">
        {pubkey}
      </Text>
    </View>
  );
}

function StatsCard({ stats }: { stats: WalletStats }) {
  return (
    <View style={styles.statsWrap}>
      <LinearGradient
        colors={
          gradients.card.og as unknown as readonly [
            string,
            string,
            ...string[],
          ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <View style={styles.statsRow}>
          <StatColumn label="WINS" value={String(stats.wins)} />
          <StatDivider />
          <StatColumn label="LOSSES" value={String(stats.losses)} />
          <StatDivider />
          <StatColumn
            label="WIN RATE"
            value={`${stats.winRate.toFixed(1)}%`}
          />
        </View>
        <Text style={styles.statsSubtitle}>
          Total battles: {stats.total}
        </Text>
      </LinearGradient>
    </View>
  );
}

function StatColumn({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statColumn}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatDivider() {
  return <View style={styles.statDivider} />;
}

function BattleRow({
  record,
  pubkey,
}: {
  record: BattleHistoryRecord;
  pubkey: string;
}) {
  const isWin = record.winnerPubkey === pubkey;
  const opponent = isWin ? record.loserPubkey : record.winnerPubkey;
  const hi = Math.max(record.finalScore.a, record.finalScore.b);
  const lo = Math.min(record.finalScore.a, record.finalScore.b);
  const userScore = isWin ? hi : lo;
  const opponentScore = isWin ? lo : hi;
  const ago = formatRelative(record.timestamp);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.battleRow,
        pressed && styles.battleRowPressed,
      ]}
    >
      <View
        style={[
          styles.outcomeChip,
          isWin ? styles.outcomeChipWin : styles.outcomeChipLoss,
        ]}
      >
        <Text
          style={[
            styles.outcomeChipText,
            isWin ? styles.outcomeChipWinText : styles.outcomeChipLossText,
          ]}
        >
          {isWin ? 'W' : 'L'}
        </Text>
      </View>

      <View style={styles.battleMid}>
        <Text style={styles.battleOpponent}>
          vs <Text style={styles.battleOpponentMono}>{displayName(opponent, 4)}</Text>
        </Text>
        <Text style={styles.battleScore}>
          {userScore}-{opponentScore}
        </Text>
      </View>

      <Text style={styles.battleAgo}>{ago}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  scroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Identity
  identityBlock: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  identityShort: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: 'Courier',
  },
  identityFull: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: '500',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },

  // Stats card
  statsWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  statsCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: 'Courier',
  },
  statLabel: {
    color: colors.white,
    opacity: 0.85,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statsSubtitle: {
    color: colors.white,
    opacity: 0.85,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  sectionHeaderText: {
    color: colors.solanaMagenta,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // Battle list
  battleList: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  battleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  battleRowPressed: { opacity: 0.7 },
  outcomeChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  outcomeChipWin: {
    backgroundColor: colors.greenBgTint,
    borderColor: colors.greenBorder,
  },
  outcomeChipLoss: {
    backgroundColor: 'rgba(220,31,255,0.12)',
    borderColor: 'rgba(220,31,255,0.5)',
  },
  outcomeChipText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  outcomeChipWinText: { color: colors.solanaGreen },
  outcomeChipLossText: { color: colors.solanaMagenta },

  battleMid: { flex: 1 },
  battleOpponent: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  battleOpponentMono: {
    color: colors.white,
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  battleScore: {
    color: colors.solanaGreen,
    fontFamily: 'Courier',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  battleAgo: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty
  emptyBlock: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
