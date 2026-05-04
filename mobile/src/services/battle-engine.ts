// Battle engine: head-to-head comparison of two Solana wallets.
//
// Flow:
//   1. Reject self-vs-self (CANNOT_BATTLE_SELF).
//   2. Fetch + analyze both wallets in parallel (Helius + wallet-analyzer).
//   3. For each of 4 categories, score deterministically from analysis.
//   4. Determine round winner (or tie if scores within 0.5).
//   5. Generate AI commentary per round via the existing LLM chain
//      (gemini-1 → gemini-2 → groq), cached 24 h in AsyncStorage.
//      If a wallet has zero on-chain activity, short-circuit with a
//      static auto-loss commentary (no LLM burn).
//   6. Tally rounds → overallWinner.
//
// This module is engine-only. UI lives in Phase 2.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAllAssets, getWalletTransactions, type DASAsset } from './helius';
import { callLLM, getLastProvider, type Provider } from './llm';
import { analyzeWallet } from '../lib/wallet-analyzer';
import { shortenAddress } from '../lib/wallet';
import type {
  BattleCategory,
  BattleResult,
  BattleRound,
} from '../types/battle';
import type { WalletAnalysis } from '../types';

// ─────────────────────────────────────────────────────────────────────
// Cache (commentary, AsyncStorage-backed, 24 h TTL).
// Mirrors lib/llm-cache.ts shape but keyed for battle commentary.
// ─────────────────────────────────────────────────────────────────────

const TTL_MS = 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'wrap:battle:commentary:';

function dayOfYearUTC(): number {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  return Math.floor((now.getTime() - start) / 86_400_000);
}

function commentaryKey(
  category: BattleCategory,
  walletA: string,
  walletB: string
): string {
  return `${KEY_PREFIX}${category}:${shortenAddress(walletA)}:${shortenAddress(walletB)}:${dayOfYearUTC()}`;
}

type CachedCommentary = {
  commentary: string;
  generatedAt: number;
  provider: Provider;
};

async function getCached(key: string): Promise<CachedCommentary | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCommentary;
    if (
      typeof parsed.commentary !== 'string' ||
      typeof parsed.generatedAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.generatedAt > TTL_MS) {
      AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function setCached(key: string, value: CachedCommentary): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort. Cache writes never block the engine.
  }
}

// ─────────────────────────────────────────────────────────────────────
// Scoring (deterministic — same input always yields the same number).
// All scores clamp to 0-10 so rounds are visually comparable.
// ─────────────────────────────────────────────────────────────────────

function clamp(n: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, n));
}

function scoreCategory(category: BattleCategory, a: WalletAnalysis): number {
  switch (category) {
    case 'diamond_hand': {
      // 300 days avg hold = 10. Plus 0.5/drawdown held (cap +3).
      const base = clamp(a.averageHoldDays / 30);
      const bonus = clamp(a.drawdownsHeld.length * 0.5, 0, 3);
      return clamp(base + bonus);
    }
    case 'og_status':
      // 900 days = 10 (roughly 2.5 years saturates).
      return clamp(a.walletAgeDays / 90);
    case 'volume':
      // 10 tx → 2.5, 100 → 5, 1000 → 7.5, 10000+ → 10.
      return clamp(Math.log10(Math.max(a.totalTransactions, 1)) * 2.5);
    case 'diversity':
      // 30 unique programs = 10.
      return clamp(a.uniqueProgramsInteracted / 3);
  }
}

function determineWinner(
  scoreA: number,
  scoreB: number
): 'A' | 'B' | 'tie' {
  if (Math.abs(scoreA - scoreB) < 0.5) return 'tie';
  return scoreA > scoreB ? 'A' : 'B';
}

// ─────────────────────────────────────────────────────────────────────
// Commentary prompt + generation.
// Tone enforced by the system prompt: punchy, playful, never mean.
// Commentary cap is 25 words (per spec); the global llm.ts sanitizer
// also hard-caps at 15 words as a safety net, so very long generations
// will be trimmed.
// ─────────────────────────────────────────────────────────────────────

const BATTLE_SYSTEM = `You write punchy battle commentary for two-Solana-wallet head-to-head matchups. Output exactly one sentence with attitude — playful, never mean, no insults, no slurs, no emoji, no preamble, no quotes. Reference at least one specific number from the input.`;

function statsForCategory(category: BattleCategory, a: WalletAnalysis): string {
  switch (category) {
    case 'diamond_hand':
      return `avg hold ${a.averageHoldDays} days, ${a.drawdownsHeld.length} drawdowns held`;
    case 'og_status':
      return `${a.walletAgeDays} days old (since ${a.oldestTxDate.slice(0, 10)})`;
    case 'volume':
      return `${a.totalTransactions} transactions, ${a.totalSwaps} swaps`;
    case 'diversity':
      return `${a.uniqueProgramsInteracted} unique programs, ${a.topTokensByValue.length} tokens`;
  }
}

function commentaryPrompt(
  category: BattleCategory,
  statsA: string,
  statsB: string,
  winner: 'A' | 'B' | 'tie'
): string {
  const winnerLabel =
    winner === 'tie' ? 'neither — this round is a tie' : `Wallet ${winner}`;
  return `Two Solana wallets battling on "${category}".
Wallet A: ${statsA}
Wallet B: ${statsB}
Winner: ${winnerLabel}.
Write ONE punchy sentence (max 25 words) declaring the winner with attitude. No insults. Be specific to the data. Output the sentence only — no preamble, no quotes.`;
}

async function generateCommentary(
  category: BattleCategory,
  analysisA: WalletAnalysis,
  analysisB: WalletAnalysis,
  winner: 'A' | 'B' | 'tie',
  walletA: string,
  walletB: string
): Promise<{ commentary: string; provider: BattleRound['provider'] }> {
  const key = commentaryKey(category, walletA, walletB);
  const cached = await getCached(key);
  if (cached) {
    return { commentary: cached.commentary, provider: 'cache' };
  }

  const statsA = statsForCategory(category, analysisA);
  const statsB = statsForCategory(category, analysisB);
  const prompt = commentaryPrompt(category, statsA, statsB, winner);

  const commentary = await callLLM(BATTLE_SYSTEM, prompt, 25);
  const provider: Provider = getLastProvider() ?? 'groq';

  // Best-effort cache write.
  setCached(key, {
    commentary,
    generatedAt: Date.now(),
    provider,
  });
  return { commentary, provider };
}

function autoLossRound(
  category: BattleCategory,
  analysisA: WalletAnalysis,
  analysisB: WalletAnalysis,
  scoreA: number,
  scoreB: number
): BattleRound {
  const aEmpty = analysisA.totalTransactions === 0;
  const bEmpty = analysisB.totalTransactions === 0;
  let winner: 'A' | 'B' | 'tie';
  let commentary: string;
  if (aEmpty && bEmpty) {
    winner = 'tie';
    commentary = `Auto-loss: both wallets have no on-chain activity to score on ${category}.`;
  } else if (aEmpty) {
    winner = 'B';
    commentary = `Auto-loss: Wallet A has no on-chain activity. Wallet B wins ${category} by default.`;
  } else {
    winner = 'A';
    commentary = `Auto-loss: Wallet B has no on-chain activity. Wallet A wins ${category} by default.`;
  }
  return {
    category,
    scoreA,
    scoreB,
    winner,
    commentary,
    provider: 'cache',
  };
}

// ─────────────────────────────────────────────────────────────────────
// Wallet fetch + analyze (parallel).
// Mirrors what insight-engine consumers do at a higher level.
// ─────────────────────────────────────────────────────────────────────

async function analyzeWalletByAddress(
  address: string
): Promise<WalletAnalysis> {
  // Battle scoring only needs ~100 assets to differentiate the 4
  // categories — the full 1000×5 enumeration the cNFT mint/CardReveal
  // paths use blows past the 12s Helius timeout on Toly-scale wallets.
  // Cap to a single 100-asset page; analyzeWallet's category logic
  // works fine on the truncated set.
  //
  // Round 4: tolerate Helius DAS "Response is too big" (raised on
  // token-heavy wallets like Sample/Toly/Mert when showFungible:true
  // pushes payload past Helius's per-response cap, even at limit=100).
  // Three of four scoring categories (og_status, volume, diversity)
  // depend only on transactions; the fourth (diamond_hand) takes a
  // marginal +0..3 bonus from drawdownsHeld which is empty for these
  // demo wallets anyway. Falling back to assets:[] keeps the battle
  // running instead of dropping the user on the generic error screen.
  // Round 4.5: bump tx fetch from default 100 → 1000. Active wallets
  // (Toly, Ansem) make ~100 txs/day, so a 100-tx window only reaches
  // back ~1 day → walletAgeDays collapses to ~14 → og_status scores
  // to 0.2 instead of the 9-10 these wallets actually deserve. Worse,
  // both wallets hit the 100 cap → totalTransactions identical →
  // volume = log10(100) × 2.5 = 5.0 for both → guaranteed tie. The
  // 1000-tx window pages 10× (Helius REST returns 100/page) but the
  // retry layer in helius.ts absorbs the latency, and it's the
  // difference between "Toly defeated Ansem 3-1" and "0-1, all 5.0s".
  const transactions = await getWalletTransactions(address, 1000);
  let assets: DASAsset[] = [];
  try {
    assets = await getAllAssets(address, { pageLimit: 100, maxPages: 1 });
  } catch (err) {
    console.warn(
      `[battle] getAllAssets failed for ${shortenAddress(address)}, scoring without assets:`,
      (err as Error).message
    );
  }
  return analyzeWallet({ address, transactions, assets });
}

// ─────────────────────────────────────────────────────────────────────
// Public entrypoint.
// ─────────────────────────────────────────────────────────────────────

export const BATTLE_CATEGORIES: BattleCategory[] = [
  'diamond_hand',
  'og_status',
  'volume',
  'diversity',
];

export async function runBattle(
  walletA: string,
  walletB: string
): Promise<BattleResult> {
  if (walletA === walletB) {
    throw new Error('CANNOT_BATTLE_SELF');
  }

  const [analysisA, analysisB] = await Promise.all([
    analyzeWalletByAddress(walletA),
    analyzeWalletByAddress(walletB),
  ]);

  const rounds: BattleRound[] = [];
  for (const category of BATTLE_CATEGORIES) {
    const scoreA = scoreCategory(category, analysisA);
    const scoreB = scoreCategory(category, analysisB);

    if (
      analysisA.totalTransactions === 0 ||
      analysisB.totalTransactions === 0
    ) {
      rounds.push(
        autoLossRound(category, analysisA, analysisB, scoreA, scoreB)
      );
      continue;
    }

    const winner = determineWinner(scoreA, scoreB);
    const { commentary, provider } = await generateCommentary(
      category,
      analysisA,
      analysisB,
      winner,
      walletA,
      walletB
    );
    rounds.push({ category, scoreA, scoreB, winner, commentary, provider });
  }

  const aWins = rounds.filter((r) => r.winner === 'A').length;
  const bWins = rounds.filter((r) => r.winner === 'B').length;
  const overallWinner: 'A' | 'B' | 'tie' =
    aWins > bWins ? 'A' : bWins > aWins ? 'B' : 'tie';

  return {
    walletA,
    walletB,
    rounds,
    overallWinner,
    finalScore: { a: aWins, b: bWins },
    createdAt: Date.now(),
    cacheKey: `wrap:battle:${shortenAddress(walletA)}:${shortenAddress(walletB)}:${dayOfYearUTC()}`,
  };
}
