// Off-screen render target captured by view-shot for the Phase 2C
// share-image flow. Sized at Twitter's summary_large_image ratio
// (1200×675, 1.91:1) so the Pinata gateway URL unfurls as a wide image
// preview when pasted into a tweet.
//
// Render-only — no state, no effects. The parent (LeaderboardScreen)
// mounts this absolutely positioned far off-screen (left:-10000) and
// hands a ref to captureRef. position:absolute keeps it out of the
// scroll layout; we can't use display:none because view-shot can only
// capture mounted, laid-out views.

import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/tokens';
import { shortenAddress } from '../lib/wallet';
import type { BattleHistoryRecord } from '../services/battleHistory';

export type Standing = {
  pubkey: string;
  wins: number;
  total: number;
};

type Props = {
  standings: Standing[];
  recent: BattleHistoryRecord[];
};

const ShareLeaderboardCard = forwardRef<View, Props>(function ShareLeaderboardCard(
  { standings, recent },
  ref
) {
  const top3 = standings.slice(0, 3);
  const last3 = recent.slice(0, 3);

  return (
    <View ref={ref} collapsable={false} style={styles.canvas}>
      <LinearGradient
        colors={[colors.bg, '#1A0830', colors.bg] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.wordmark}>WRAP</Text>
        <Text style={styles.subtitle}>BATTLE LEADERBOARD</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.col}>
          <Text style={styles.colHeader}>TOP WINNERS</Text>
          {top3.map((s, i) => (
            <View key={s.pubkey} style={styles.standingRow}>
              <Text style={[styles.rank, rankColorStyle(i)]}>{i + 1}</Text>
              <Text style={styles.mono}>{shortenAddress(s.pubkey, 4)}</Text>
              <View style={styles.flex} />
              <Text style={styles.stat}>
                {s.wins}W / {s.total}B
              </Text>
            </View>
          ))}
          {top3.length === 0 ? (
            <Text style={styles.placeholder}>No battles yet</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        <View style={styles.col}>
          <Text style={styles.colHeader}>RECENT BATTLES</Text>
          {last3.map((r) => {
            const hi = Math.max(r.finalScore.a, r.finalScore.b);
            const lo = Math.min(r.finalScore.a, r.finalScore.b);
            return (
              <View key={r.id} style={styles.recentRow}>
                <Text style={styles.recentLine} numberOfLines={1}>
                  <Text style={styles.recentMono}>
                    {shortenAddress(r.winnerPubkey, 4)}
                  </Text>
                  <Text style={styles.recentVerb}> defeated </Text>
                  <Text style={styles.recentMono}>
                    {shortenAddress(r.loserPubkey, 4)}
                  </Text>
                </Text>
                <Text style={styles.recentScore}>
                  {hi}-{lo}
                </Text>
              </View>
            );
          })}
          {last3.length === 0 ? (
            <Text style={styles.placeholder}>No battles yet</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.footer}>
        {/* Tagline matches landing copy verbatim so the tweeted image
            and getwrap.vercel.app read with the same canonical line. */}
        <Text style={styles.tagline}>Your Solana wallet, told as a story.</Text>
        <Text style={styles.url}>getwrap.vercel.app</Text>
      </View>
    </View>
  );
});

function rankColorStyle(idx: number) {
  if (idx === 0) return { color: colors.solanaGreen };
  if (idx === 1) return { color: colors.solanaPurple };
  return { color: colors.solanaMagenta };
}

const styles = StyleSheet.create({
  canvas: {
    width: 1200,
    height: 675,
    backgroundColor: colors.bg,
    paddingHorizontal: 56,
    paddingVertical: 48,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 24,
    marginBottom: 28,
  },
  wordmark: {
    color: colors.white,
    fontSize: 80,
    fontWeight: '900',
    letterSpacing: -2,
  },
  subtitle: {
    color: colors.solanaMagenta,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },

  body: {
    flex: 1,
    flexDirection: 'row',
    gap: 32,
  },
  col: { flex: 1 },
  divider: {
    width: 1,
    backgroundColor: colors.hairlineSoft,
  },
  colHeader: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 18,
  },

  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 18,
  },
  rank: {
    fontSize: 32,
    fontWeight: '900',
    width: 40,
    textAlign: 'center',
  },
  mono: {
    color: colors.white,
    fontFamily: 'Courier',
    fontSize: 24,
    fontWeight: '700',
  },
  flex: { flex: 1 },
  stat: {
    color: colors.textSecondary,
    fontFamily: 'Courier',
    fontSize: 22,
    fontWeight: '700',
  },

  recentRow: { paddingVertical: 12, gap: 6 },
  recentLine: { fontSize: 22 },
  recentMono: {
    color: colors.white,
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  recentVerb: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  recentScore: {
    color: colors.solanaGreen,
    fontFamily: 'Courier',
    fontSize: 20,
    fontWeight: '800',
  },

  placeholder: {
    color: colors.textMuted,
    fontSize: 18,
    paddingVertical: 12,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tagline: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  url: {
    color: colors.solanaPurple,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ShareLeaderboardCard;
