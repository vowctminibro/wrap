import type { WalletAnalysis } from '../types';

// Minimal placeholder so screens can render before the Helius pipeline
// is wired in Phase 2. Replaced by analyzeWallet() once real data flows.
export function makeMockAnalysis(address: string): WalletAnalysis {
  return {
    address,
    totalSwaps: 142,
    totalMints: 23,
    totalTransactions: 1284,
    oldestTxDate: '2021-09-14T00:00:00Z',
    walletAgeDays: 1535,
    biggestHold: {
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      symbol: 'BONK',
      amount: 4_200_000,
      valueUSD: 8_400,
      drawdownPct: 80,
      daysHeld: 240,
    },
    topTokensByValue: [],
    communitiesJoined: [],
    drawdownsHeld: [],
    uniqueProgramsInteracted: 47,
    averageHoldDays: 412,
    personality: 'believer',
  };
}
