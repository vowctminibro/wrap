// Type contracts for the WRAP Battle feature.
//
// A Battle is a head-to-head comparison of two wallets across 4
// categories. Each round produces a winner (or tie) plus AI-generated
// commentary. The engine returns a BattleResult; the UI (Phase 2)
// renders rounds + final winner card.
//
// The Battle feature exists to address the antimemetics critique
// surfaced in research/copilot-audit.md — per-wallet uniqueness has
// no shared social artifact, so we add multi-wallet comparison as the
// memetic layer.

export type BattleCategory =
  | 'diamond_hand' // hold-through-drawdown score
  | 'og_status' // wallet age + early-token presence
  | 'volume' // total tx volume
  | 'diversity'; // unique tokens/programs interacted with

export type BattleRound = {
  category: BattleCategory;
  scoreA: number; // 0-10
  scoreB: number; // 0-10
  winner: 'A' | 'B' | 'tie';
  commentary: string; // AI-generated, max 25 words
  provider: 'gemini-1' | 'gemini-2' | 'groq' | 'cache';
};

export type BattleResult = {
  walletA: string;
  walletB: string;
  rounds: BattleRound[];
  overallWinner: 'A' | 'B' | 'tie';
  finalScore: { a: number; b: number }; // count of rounds won
  createdAt: number;
  cacheKey: string;
};
