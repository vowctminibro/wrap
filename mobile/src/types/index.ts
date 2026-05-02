// Shared types for the WRAP mobile app.
// Card types match the cards-data.jsx schema; analysis types feed the
// Helius pipeline -> insight engine flow.

import type { BattleHistoryRecord } from '../services/battleHistory';

export type CardType =
  | 'swaps'
  | 'diamond'
  | 'og'
  | 'recap'
  | 'genre'
  | 'personality'
  | 'achievement';

export type Personality = 'degen' | 'builder' | 'collector' | 'believer';

export type CardData = {
  id: CardType;
  cardType: CardType;
  icon: string;
  label: string;
  stat: string;
  statUnit: string;
  sub: string;
  line: string;
  accent: string;
  pubkey: string;
  walletShort: string;
  // Which LLM provider produced the line (or 'mock' / 'cache'). Surfaced
  // in MintConfirm as a small attribution badge so judges can see the
  // resilience chain working.
  source?: 'gemini-1' | 'gemini-2' | 'groq' | 'mock' | 'cache';
};

export type TokenHolding = {
  mint: string;
  symbol: string;
  amount: number;
  valueUSD: number;
  drawdownPct?: number;
  daysHeld?: number;
};

export type CommunityMembership = {
  collection: string;
  joinDate: string;
  isOG: boolean;
};

export type WalletAnalysis = {
  address: string;
  totalSwaps: number;
  totalMints: number;
  totalTransactions: number;
  oldestTxDate: string;
  walletAgeDays: number;
  biggestHold: TokenHolding | null;
  topTokensByValue: TokenHolding[];
  communitiesJoined: CommunityMembership[];
  drawdownsHeld: TokenHolding[];
  uniqueProgramsInteracted: number;
  averageHoldDays: number;
  personality: Personality;
};

// Navigation
export type RootStackParamList = {
  Onboarding: undefined;
  CardReveal: { publicKey: string; analysis: WalletAnalysis };
  MintConfirm: { signature: string; cardData: CardData; publicKey: string };
  Gallery: { publicKey: string; analysis: WalletAnalysis };
  About: undefined;
  Debug: { analysis: WalletAnalysis };
  BattleInput: { walletA: string };
  BattleResult: {
    walletA: string;
    walletB: string;
    // Phase 2B: when present, replays this stored battle instead of
    // running the engine. Persistence side-effect is skipped.
    replay?: BattleHistoryRecord;
  };
  Leaderboard: undefined;
  WalletDetail: { pubkey: string };
};
