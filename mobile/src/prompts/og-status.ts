// OG Status card: punchy line about being early to crypto communities.

import type { ChatMessage } from '../services/claude';
import type { WalletAnalysis } from '../types';

export const SYSTEM = `You write punchy one-liners about being early to crypto communities and tokens. Maximum 15 words. Flex but earned, not boastful. Reference the specific community and timing when given. Confident, slightly cocky, screenshot-able. No emoji. No exclamation marks. No generic praise. Output only the one-liner — no quotes, no preface, no explanation.`;

type OGInput = {
  walletAgeDays: number;
  walletAgeYears: number;
  communitiesCount: number;
  topCollections: string[];
  topPercentile?: number;
};

export const FEW_SHOT: ChatMessage[] = [
  {
    role: 'user',
    content: JSON.stringify({
      walletAgeDays: 1535,
      walletAgeYears: 4.2,
      communitiesCount: 12,
      topCollections: ['Mad Lads', 'DeGods'],
      topPercentile: 1,
    }),
  },
  {
    role: 'assistant',
    content: 'You were here when SOL was three digits. Then two. Then three again.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      walletAgeDays: 1100,
      walletAgeYears: 3.0,
      communitiesCount: 18,
      topCollections: ['Mad Lads'],
      topPercentile: 2,
    }),
  },
  {
    role: 'assistant',
    content: 'Mad Lads minted before the bots arrived. You actually clicked.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      walletAgeDays: 2000,
      walletAgeYears: 5.5,
      communitiesCount: 6,
      topCollections: ['Solana Monkey Business'],
      topPercentile: 1,
    }),
  },
  {
    role: 'assistant',
    content: 'Wallet predates Magic Eden v1. The provenance speaks for itself.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      walletAgeDays: 800,
      walletAgeYears: 2.2,
      communitiesCount: 24,
      topCollections: ['Tensorians', 'Claynosaurz'],
      topPercentile: 5,
    }),
  },
  {
    role: 'assistant',
    content: 'You were minting when the rest were still asking what cNFTs are.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      walletAgeDays: 1400,
      walletAgeYears: 3.8,
      communitiesCount: 9,
      topCollections: ['Famous Fox Federation'],
      topPercentile: 3,
    }),
  },
  {
    role: 'assistant',
    content: 'You showed up before the airdrops were real. Then they became real.',
  },
];

export function buildUserMessage(analysis: WalletAnalysis): ChatMessage {
  const years = +(analysis.walletAgeDays / 365).toFixed(1);
  const payload: OGInput = {
    walletAgeDays: analysis.walletAgeDays,
    walletAgeYears: years,
    communitiesCount: analysis.communitiesJoined.length,
    topCollections: analysis.communitiesJoined.slice(0, 3).map((c) => c.collection),
    topPercentile: years > 4 ? 1 : years > 3 ? 3 : years > 2 ? 5 : 10,
  };
  return { role: 'user', content: JSON.stringify(payload) };
}
