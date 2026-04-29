// Year Recap card: Spotify-Wrapped style summary line.

import type { ChatMessage } from '../services/claude';
import type { WalletAnalysis } from '../types';

export const SYSTEM = `You write Spotify-Wrapped style year recap one-liners about crypto wallet activity. Maximum 15 words. Confident, summarizing voice. Reference real numbers from their year — transactions, swaps, protocols, mints. Slightly cocky. Screenshot-able. No emoji. No exclamation marks. Output only the one-liner — no quotes, no preface, no explanation.`;

type RecapInput = {
  totalTransactions: number;
  totalSwaps: number;
  totalMints: number;
  uniqueProgramsInteracted: number;
  topToken?: string;
  personality: string;
};

export const FEW_SHOT: ChatMessage[] = [
  {
    role: 'user',
    content: JSON.stringify({
      totalTransactions: 1284,
      totalSwaps: 142,
      totalMints: 48,
      uniqueProgramsInteracted: 47,
      topToken: 'BONK',
      personality: 'degen',
    }),
  },
  {
    role: 'assistant',
    content: '1,284 transactions. 47 protocols. 0 regrets. Allegedly.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      totalTransactions: 412,
      totalSwaps: 89,
      totalMints: 12,
      uniqueProgramsInteracted: 18,
      topToken: 'JUP',
      personality: 'builder',
    }),
  },
  {
    role: 'assistant',
    content: '89 swaps across 18 protocols. Methodical. The blockchain noticed.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      totalTransactions: 2104,
      totalSwaps: 380,
      totalMints: 92,
      uniqueProgramsInteracted: 64,
      topToken: 'WIF',
      personality: 'degen',
    }),
  },
  {
    role: 'assistant',
    content: '2,104 transactions and a sleep schedule. One of these survived 2026.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      totalTransactions: 78,
      totalSwaps: 6,
      totalMints: 3,
      uniqueProgramsInteracted: 5,
      topToken: 'SOL',
      personality: 'believer',
    }),
  },
  {
    role: 'assistant',
    content: 'Six swaps. Three mints. The conviction strategy is statistically aggressive.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      totalTransactions: 567,
      totalSwaps: 45,
      totalMints: 200,
      uniqueProgramsInteracted: 22,
      topToken: 'SAMO',
      personality: 'collector',
    }),
  },
  {
    role: 'assistant',
    content: '200 mints across 22 protocols. The gallery pays the gas, eventually.',
  },
];

export function buildUserMessage(analysis: WalletAnalysis): ChatMessage {
  const top = analysis.topTokensByValue[0]?.symbol;
  const payload: RecapInput = {
    totalTransactions: analysis.totalTransactions,
    totalSwaps: analysis.totalSwaps,
    totalMints: analysis.totalMints,
    uniqueProgramsInteracted: analysis.uniqueProgramsInteracted,
    topToken: top,
    personality: analysis.personality,
  };
  return { role: 'user', content: JSON.stringify(payload) };
}
