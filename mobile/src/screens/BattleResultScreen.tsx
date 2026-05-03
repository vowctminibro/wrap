// BattleResultScreen — Phase 2b.
//
// Receives walletA + walletB from route params, calls runBattle on
// mount, then animates the 4-round reveal before settling into a
// final winner card with a Champion-NFT mint CTA.
//
// State flow:
//   loading → success → animating (rounds 0..3) → final
//                     ↘ user taps "Skip" → final
//                  error → retry / back
//
// The animation runs in JS via the built-in Animated API (react-
// native-reanimated isn't installed). Per round: count up scoreA,
// then scoreB (offset 200ms), bounce in the winner badge, fade in
// the AI commentary, pause, advance.
//
// Champion-NFT mint: stubbed with a toast for Phase 2c. The existing
// mintCardAsCNFT pipeline expects a fixed CardType enum + a viewable
// card to capture as image — neither extends cleanly to a "champion"
// card without scope creep beyond Phase 2b. The stub logs the data
// shape that would have been minted so Phase 2c picks it up cleanly.

import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ToastAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { runBattle } from '../services/battle-engine';
import {
  appendBattle,
  type BattleHistoryRecord,
} from '../services/battleHistory';
import { shortenAddress } from '../lib/wallet';
import { mapErrorToFriendly } from '../lib/errors';
import { colors, gradients, radius, spacing } from '../theme/tokens';
import type {
  BattleCategory,
  BattleResult,
  BattleRound,
} from '../types/battle';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'BattleResult'>;

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; result: BattleResult };

const CATEGORY_META: Record<BattleCategory, { icon: string; label: string }> = {
  diamond_hand: { icon: '💎', label: 'Diamond Hand' },
  og_status: { icon: '👑', label: 'OG Status' },
  volume: { icon: '🚀', label: 'Volume' },
  diversity: { icon: '🎨', label: 'Diversity' },
};

const ROUND_DURATION_MS = 3700; // total time per round
const SCORE_DURATION_MS = 1500;
const SCORE_B_OFFSET_MS = 200;
const WINNER_AT_MS = 1700;
const COMMENTARY_AT_MS = 2000;

export default function BattleResultScreen({ navigation, route }: Props) {
  const { walletA, walletB, replay } = route.params;
  const isReplay = replay !== undefined;
  const [state, setState] = useState<State>(
    isReplay
      ? { kind: 'success', result: recordToBattleResult(replay) }
      : { kind: 'loading' }
  );
  const [reloadKey, setReloadKey] = useState(0);

  // Animation control
  const [revealedRounds, setRevealedRounds] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // Guard so appendBattle fires exactly once per loaded result, even
  // when the final view re-renders or the user toggles details.
  const savedRef = useRef(false);

  useEffect(() => {
    setRevealedRounds(0);
    setSkipped(false);
    setShowDetails(false);
    savedRef.current = false;

    // Replay: hand the converted record straight to success state. No
    // engine call, no loading flicker — animation kicks in immediately.
    if (replay) {
      setState({ kind: 'success', result: recordToBattleResult(replay) });
      return;
    }

    let alive = true;
    setState({ kind: 'loading' });
    (async () => {
      try {
        const result = await runBattle(walletA, walletB);
        if (alive) setState({ kind: 'success', result });
      } catch (e: unknown) {
        // Keep the engineer detail in logcat for debugging; only the
        // friendly copy reaches the UI.
        console.error('[battle] runBattle failed:', e);
        if (alive) {
          setState({ kind: 'error', message: mapErrorToFriendly(e) });
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [walletA, walletB, reloadKey, replay]);

  // Persist to local history once the reveal lands on the final view.
  // Ties are not persisted: the leaderboard's ranking model assumes a
  // clean winner per battle, and a tie produces no champion mint either.
  // Replays skip persistence — they're already in history.
  // Must live above the early returns below so hook order stays stable.
  useEffect(() => {
    if (replay) return;
    if (state.kind !== 'success') return;
    const isFinalNow =
      skipped || revealedRounds >= state.result.rounds.length;
    if (!isFinalNow) return;
    if (savedRef.current) return;
    savedRef.current = true;
    if (state.result.overallWinner === 'tie') return;
    const record = toHistoryRecord(state.result, walletA, walletB);
    void appendBattle(record);
  }, [state, skipped, revealedRounds, walletA, walletB, replay]);

  // Loading
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

  // Error
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

  // Success — render reveal flow
  const { result } = state;
  const isFinal = skipped || revealedRounds >= result.rounds.length;

  const onSkip = () => setSkipped(true);
  const onBattleAgain = () => navigation.goBack();
  const onBackToLeaderboard = () => navigation.goBack();
  const onMintChampion = () => {
    const championCardData = buildChampionCardData(result);
    // TODO(phase-2c): Implement champion-card mint. The existing
    // mintCardAsCNFT pipeline expects a fixed CardType enum +
    // captureable view. Need either: (a) extend CardType with
    // 'champion' and design a champion-card visual component, or
    // (b) add a separate mintBattleAsCNFT path that takes a
    // BattleResult and renders its own asset. Logging the intended
    // shape here so Phase 2c can pick it up.
    // eslint-disable-next-line no-console
    console.log('[battle-mint] champion cardData stub', championCardData);
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        'Champion NFT mint — Phase 2c',
        ToastAndroid.SHORT
      );
    } else {
      Alert.alert(
        'Champion NFT',
        'Champion NFT mint is coming in Phase 2c. The cardData has been logged to the console.'
      );
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          walletA={result.walletA}
          walletB={result.walletB}
          showSkip={!isFinal && !isReplay}
          isReplay={isReplay}
          onSkip={onSkip}
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {!isFinal && (
            <AnimatingRounds
              result={result}
              revealedRounds={revealedRounds}
              onRoundComplete={() => setRevealedRounds((r) => r + 1)}
            />
          )}

          {isFinal && (
            <FinalView
              result={result}
              showDetails={showDetails}
              onToggleDetails={() => setShowDetails((s) => !s)}
              onMintChampion={onMintChampion}
              onBattleAgain={onBattleAgain}
              onBackToLeaderboard={onBackToLeaderboard}
              isReplay={isReplay}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Header — always visible at top
// ─────────────────────────────────────────────────────────────────────

function Header({
  walletA,
  walletB,
  showSkip,
  isReplay,
  onSkip,
  onBack,
}: {
  walletA: string;
  walletB: string;
  showSkip: boolean;
  isReplay: boolean;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.topLabel}>BATTLE</Text>
        {isReplay ? (
          <View style={styles.replayBadge}>
            <Text style={styles.replayBadgeText}>REPLAY</Text>
          </View>
        ) : showSkip ? (
          <Pressable onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip »</Text>
          </Pressable>
        ) : (
          <View style={{ width: 76 }} />
        )}
      </View>

      <View style={styles.headlineRow}>
        <View style={[styles.walletBadge, { borderColor: colors.solanaPurple }]}>
          <Text style={[styles.walletBadgeLabel, { color: colors.solanaPurple }]}>
            WALLET A
          </Text>
          <Text style={styles.walletBadgeValue}>
            {shortenAddress(walletA, 4)}
          </Text>
        </View>
        <Text style={styles.vsBadge}>VS</Text>
        <View
          style={[styles.walletBadge, { borderColor: colors.solanaMagenta }]}
        >
          <Text
            style={[styles.walletBadgeLabel, { color: colors.solanaMagenta }]}
          >
            WALLET B
          </Text>
          <Text style={styles.walletBadgeValue}>
            {shortenAddress(walletB, 4)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// AnimatingRounds — rendered while reveal animation runs
// ─────────────────────────────────────────────────────────────────────

function AnimatingRounds({
  result,
  revealedRounds,
  onRoundComplete,
}: {
  result: BattleResult;
  revealedRounds: number;
  onRoundComplete: () => void;
}) {
  return (
    <View style={styles.roundStack}>
      {result.rounds.slice(0, revealedRounds).map((round, i) => (
        <RoundPanel key={`done-${i}`} round={round} mode="done" />
      ))}
      {revealedRounds < result.rounds.length && (
        <RoundPanel
          key={`active-${revealedRounds}`}
          round={result.rounds[revealedRounds]}
          mode="active"
          onComplete={onRoundComplete}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// RoundPanel — one of three modes:
//   - active:  runs the animation sequence on mount
//   - done:    renders in static, slightly dimmed completed state
//   - compact: not used here (final-view recap uses a separate row)
// ─────────────────────────────────────────────────────────────────────

function RoundPanel({
  round,
  mode,
  onComplete,
}: {
  round: BattleRound;
  mode: 'active' | 'done';
  onComplete?: () => void;
}) {
  const meta = CATEGORY_META[round.category];

  // Animated values
  const scoreA = useRef(new Animated.Value(mode === 'done' ? round.scoreA : 0)).current;
  const scoreB = useRef(new Animated.Value(mode === 'done' ? round.scoreB : 0)).current;
  const winnerScale = useRef(
    new Animated.Value(mode === 'done' ? 1 : 0)
  ).current;
  const commentaryOpacity = useRef(
    new Animated.Value(mode === 'done' ? 1 : 0)
  ).current;

  // Display state for the count-up text (Animated values can't render
  // directly in <Text>; we listen and mirror to plain state).
  const [displayA, setDisplayA] = useState(mode === 'done' ? round.scoreA : 0);
  const [displayB, setDisplayB] = useState(mode === 'done' ? round.scoreB : 0);

  useEffect(() => {
    const idA = scoreA.addListener(({ value }) => setDisplayA(value));
    const idB = scoreB.addListener(({ value }) => setDisplayB(value));
    return () => {
      scoreA.removeListener(idA);
      scoreB.removeListener(idB);
    };
  }, [scoreA, scoreB]);

  useEffect(() => {
    if (mode !== 'active') return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const animA = Animated.timing(scoreA, {
      toValue: round.scoreA,
      duration: SCORE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const animB = Animated.timing(scoreB, {
      toValue: round.scoreB,
      duration: SCORE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const animWinner = Animated.spring(winnerScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    });
    const animCommentary = Animated.timing(commentaryOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    });

    animA.start();
    timeouts.push(setTimeout(() => animB.start(), SCORE_B_OFFSET_MS));
    timeouts.push(setTimeout(() => animWinner.start(), WINNER_AT_MS));
    timeouts.push(setTimeout(() => animCommentary.start(), COMMENTARY_AT_MS));
    timeouts.push(setTimeout(() => onComplete?.(), ROUND_DURATION_MS));

    return () => {
      timeouts.forEach(clearTimeout);
      scoreA.stopAnimation();
      scoreB.stopAnimation();
      winnerScale.stopAnimation();
      commentaryOpacity.stopAnimation();
    };
    // We deliberately key by category so re-mount fires the sequence
    // exactly once per round.
  }, [round.category]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDone = mode === 'done';
  const winnerColor =
    round.winner === 'A'
      ? colors.solanaPurple
      : round.winner === 'B'
        ? colors.solanaMagenta
        : colors.textSecondary;
  const winnerText =
    round.winner === 'A'
      ? 'Wallet A wins'
      : round.winner === 'B'
        ? 'Wallet B wins'
        : 'Tie';

  return (
    <View style={[styles.roundPanel, isDone && styles.roundPanelDone]}>
      <View style={styles.roundHeader}>
        <Text style={styles.roundIcon}>{meta.icon}</Text>
        <Text style={styles.roundLabel}>{meta.label}</Text>
      </View>

      <View style={styles.scoresRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreSide}>A</Text>
          <Text style={[styles.scoreValue, { color: colors.solanaPurple }]}>
            {displayA.toFixed(1)}
          </Text>
        </View>
        <Text style={styles.scoreSeparator}>—</Text>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreSide}>B</Text>
          <Text style={[styles.scoreValue, { color: colors.solanaMagenta }]}>
            {displayB.toFixed(1)}
          </Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.winnerBadge,
          {
            borderColor: winnerColor,
            transform: [{ scale: winnerScale }],
          },
        ]}
      >
        <Text style={[styles.winnerBadgeText, { color: winnerColor }]}>
          {winnerText}
        </Text>
      </Animated.View>

      <Animated.Text
        style={[styles.commentary, { opacity: commentaryOpacity }]}
      >
        "{round.commentary}"
      </Animated.Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// FinalView — winner hero + recap + CTAs
// ─────────────────────────────────────────────────────────────────────

function FinalView({
  result,
  showDetails,
  onToggleDetails,
  onMintChampion,
  onBattleAgain,
  onBackToLeaderboard,
  isReplay,
}: {
  result: BattleResult;
  showDetails: boolean;
  onToggleDetails: () => void;
  onMintChampion: () => void;
  onBattleAgain: () => void;
  onBackToLeaderboard: () => void;
  isReplay: boolean;
}) {
  const isTie = result.overallWinner === 'tie';
  const winnerColor =
    result.overallWinner === 'A'
      ? colors.solanaPurple
      : result.overallWinner === 'B'
        ? colors.solanaMagenta
        : colors.textSecondary;
  const winnerLabel = isTie
    ? "🤝  IT'S A TIE"
    : `🏆  WINNER: WALLET ${result.overallWinner}`;
  const finalScoreText = isTie
    ? `${result.finalScore.a}-${result.finalScore.b}  TIE`
    : `${result.finalScore.a}-${result.finalScore.b}`;

  return (
    <View style={styles.finalWrap}>
      <View style={styles.heroBlock}>
        <Text
          style={[
            styles.heroLabel,
            { color: winnerColor },
          ]}
        >
          {winnerLabel}
        </Text>
        <Text style={[styles.heroScore, { color: winnerColor }]}>
          {finalScoreText}
        </Text>
      </View>

      <View style={styles.recapBlock}>
        {result.rounds.map((round) => (
          <RecapRow key={round.category} round={round} />
        ))}
      </View>

      {isReplay ? (
        <Pressable
          onPress={onBackToLeaderboard}
          style={({ pressed }) => [
            styles.ctaPrimary,
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
            style={styles.ctaPrimaryInner}
          >
            <Text style={styles.ctaPrimaryText}>Back to Leaderboard</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <>
          {!isTie && (
            <Pressable
              onPress={onMintChampion}
              style={({ pressed }) => [
                styles.ctaPrimary,
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
                style={styles.ctaPrimaryInner}
              >
                <Text style={styles.ctaPrimaryText}>Mint Champion NFT</Text>
              </LinearGradient>
            </Pressable>
          )}

          <Pressable
            onPress={onBattleAgain}
            style={({ pressed }) => [
              styles.ctaSecondary,
              pressed && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaSecondaryText}>Battle Again</Text>
          </Pressable>

          <Pressable onPress={onToggleDetails} style={styles.detailsToggle}>
            <Text style={styles.detailsToggleText}>
              {showDetails ? '▴  Hide battle details' : '▾  View battle details'}
            </Text>
          </Pressable>
        </>
      )}

      {!isReplay && showDetails && (
        <View style={styles.detailsBlock}>
          {result.rounds.map((round) => (
            <View key={round.category} style={styles.detailsRow}>
              <Text style={styles.detailsRowHeader}>
                {CATEGORY_META[round.category].icon}{' '}
                {CATEGORY_META[round.category].label}
                {'  '}
                <Text style={styles.providerPill}>{round.provider}</Text>
              </Text>
              <Text style={styles.detailsCommentary}>
                "{round.commentary}"
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RecapRow({ round }: { round: BattleRound }) {
  const meta = CATEGORY_META[round.category];
  const aWon = round.winner === 'A';
  const bWon = round.winner === 'B';
  const tied = round.winner === 'tie';
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapIcon}>{meta.icon}</Text>
      <Text style={styles.recapLabel}>{meta.label}</Text>
      <View style={styles.recapScoreCluster}>
        <Text
          style={[
            styles.recapScore,
            aWon && styles.recapScoreWinner,
            { color: aWon ? colors.solanaPurple : colors.textSecondary },
          ]}
        >
          A {round.scoreA.toFixed(1)}
        </Text>
        <Text style={styles.recapCheck}>
          {aWon ? '✓' : tied ? '=' : ' '}
        </Text>
        <Text style={styles.recapVs}>vs</Text>
        <Text style={styles.recapCheck}>
          {bWon ? '✓' : tied ? '=' : ' '}
        </Text>
        <Text
          style={[
            styles.recapScore,
            bWon && styles.recapScoreWinner,
            { color: bWon ? colors.solanaMagenta : colors.textSecondary },
          ]}
        >
          B {round.scoreB.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Battle-history record builder
// ─────────────────────────────────────────────────────────────────────

function toHistoryRecord(
  result: BattleResult,
  walletA: string,
  walletB: string
): BattleHistoryRecord {
  // Caller filters ties before invoking; A or B is guaranteed.
  const winnerPubkey = result.overallWinner === 'A' ? walletA : walletB;
  const loserPubkey = result.overallWinner === 'A' ? walletB : walletA;
  const ts = result.createdAt;
  return {
    id: `${winnerPubkey}-${ts}`,
    timestamp: ts,
    winnerPubkey,
    loserPubkey,
    finalScore: result.finalScore,
    rounds: result.rounds.map((r) => ({
      cardType: r.category,
      aScore: r.scoreA,
      bScore: r.scoreB,
      winner: r.winner === 'A' ? 'a' : r.winner === 'B' ? 'b' : 'tie',
      commentary: r.commentary,
    })),
  };
}

// Replay path: invert toHistoryRecord. The original A/B engine layout is
// preserved by inspecting finalScore — whichever side has more round wins
// was at position A in the live battle, so the replay header shows the
// same orientation the original animation did.
function recordToBattleResult(record: BattleHistoryRecord): BattleResult {
  const winnerWasA = record.finalScore.a >= record.finalScore.b;
  const walletA = winnerWasA ? record.winnerPubkey : record.loserPubkey;
  const walletB = winnerWasA ? record.loserPubkey : record.winnerPubkey;
  return {
    walletA,
    walletB,
    rounds: record.rounds.map((r) => ({
      // cardType is constrained to BattleCategory by every write path
      // (engine output + seeded fixtures). Cast is safe in practice; a
      // corrupt record would render with an undefined icon/label rather
      // than crash the screen.
      category: r.cardType as BattleCategory,
      scoreA: r.aScore,
      scoreB: r.bScore,
      winner: r.winner === 'a' ? 'A' : r.winner === 'b' ? 'B' : 'tie',
      commentary: r.commentary ?? '',
      provider: 'cache',
    })),
    overallWinner: winnerWasA ? 'A' : 'B',
    finalScore: record.finalScore,
    createdAt: record.timestamp,
    cacheKey: `replay:${record.id}`,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Champion card data shape (Phase 2c will consume this)
// ─────────────────────────────────────────────────────────────────────

function buildChampionCardData(result: BattleResult): {
  title: string;
  subtitle: string;
  description: string;
  walletA: string;
  walletB: string;
  finalScore: { a: number; b: number };
  rounds: { category: string; winner: string; scoreA: number; scoreB: number }[];
} {
  const a = shortenAddress(result.walletA, 4);
  const b = shortenAddress(result.walletB, 4);
  const winLabel =
    result.overallWinner === 'A'
      ? `${a} defeated ${b}`
      : result.overallWinner === 'B'
        ? `${b} defeated ${a}`
        : `${a} tied ${b}`;
  const description = result.rounds
    .map((r) => {
      const m = CATEGORY_META[r.category];
      return `${m.label}: ${r.scoreA.toFixed(1)} vs ${r.scoreB.toFixed(1)}`;
    })
    .join(' · ');
  return {
    title: 'Battle Champion',
    subtitle: `${winLabel}, ${result.finalScore.a}-${result.finalScore.b}`,
    description,
    walletA: result.walletA,
    walletB: result.walletB,
    finalScore: result.finalScore,
    rounds: result.rounds.map((r) => ({
      category: r.category,
      winner: r.winner,
      scoreA: r.scoreA,
      scoreB: r.scoreB,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  // Loading
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

  // Error
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

  // Header
  header: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineSoft,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
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
  topLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    minWidth: 76,
    alignItems: 'center',
  },
  skipBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  replayBadge: {
    minWidth: 76,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.solanaMagenta,
    alignItems: 'center',
  },
  replayBadgeText: {
    color: colors.solanaMagenta,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    fontFamily: 'Courier',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  walletBadge: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  walletBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  walletBadgeValue: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  vsBadge: {
    color: colors.textMuted,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 3,
  },

  // Scroll content
  scroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Round panels
  roundStack: {
    gap: spacing.sm,
  },
  roundPanel: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
  },
  roundPanelDone: {
    opacity: 0.55,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roundIcon: {
    fontSize: 22,
  },
  roundLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  scoreBlock: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreSide: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: 'Courier',
  },
  scoreSeparator: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: '700',
    paddingTop: 18,
  },
  winnerBadge: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  winnerBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  commentary: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
    paddingHorizontal: spacing.xs,
  },

  // Final view
  finalWrap: {
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  heroBlock: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  heroScore: {
    fontSize: 88,
    fontWeight: '900',
    letterSpacing: -3,
    fontFamily: 'Courier',
    marginTop: spacing.sm,
  },

  recapBlock: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.bgElevated,
    paddingVertical: spacing.xs,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  recapIcon: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  },
  recapLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  recapScoreCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recapScore: {
    fontFamily: 'Courier',
    fontSize: 13,
    fontWeight: '600',
  },
  recapScoreWinner: {
    fontWeight: '900',
  },
  recapCheck: {
    color: colors.solanaGreen,
    fontSize: 14,
    fontWeight: '900',
    width: 14,
    textAlign: 'center',
  },
  recapVs: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },

  // CTAs
  ctaPrimary: {
    height: 56,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  ctaPrimaryInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  ctaPressed: { opacity: 0.85 },
  ctaSecondary: {
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.solanaMagenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    color: colors.solanaMagenta,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  detailsToggle: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  detailsToggleText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailsBlock: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairlineSoft,
    backgroundColor: colors.bgElevated,
    padding: spacing.md,
    gap: spacing.md,
  },
  detailsRow: {
    gap: 6,
  },
  detailsRowHeader: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  providerPill: {
    color: colors.solanaGreen,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  detailsCommentary: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
});
