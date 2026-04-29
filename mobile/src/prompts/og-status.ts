// OG Status card: punchy line about being early to crypto communities.

import type { WalletAnalysis } from '../types';

export const SYSTEM = `You write punchy one-liners about being early to crypto communities and tokens. Output exactly one sentence between 10 and 15 words. Flex but earned, not boastful. Reference the specific community, timing, or count when given. Confident, slightly cocky, screenshot-able. No emoji. No exclamation marks. No generic praise. No questions. Output only the one-liner — no quotes, no preface, no explanation.`;

const FEW_SHOT: Array<{ input: string; output: string }> = [
  {
    input:
      '{"walletAgeDays":1535,"walletAgeYears":4.2,"communitiesCount":12,"topCollections":["Mad Lads","DeGods"],"topPercentile":1,"personality":"believer"}',
    output: 'You were here when SOL was three digits. Then two. Then three again.',
  },
  {
    input:
      '{"walletAgeDays":1100,"walletAgeYears":3.0,"communitiesCount":18,"topCollections":["Mad Lads"],"topPercentile":2,"personality":"collector"}',
    output: 'Mad Lads minted before the bots arrived. You actually clicked. Receipts on chain.',
  },
  {
    input:
      '{"walletAgeDays":2000,"walletAgeYears":5.5,"communitiesCount":6,"topCollections":["Solana Monkey Business"],"topPercentile":1,"personality":"builder"}',
    output: 'Wallet predates Magic Eden v1. The provenance speaks for itself, loudly.',
  },
  {
    input:
      '{"walletAgeDays":800,"walletAgeYears":2.2,"communitiesCount":24,"topCollections":["Tensorians","Claynosaurz"],"topPercentile":5,"personality":"collector"}',
    output: 'You minted while everyone else was still asking what cNFTs even are.',
  },
  {
    input:
      '{"walletAgeDays":1400,"walletAgeYears":3.8,"communitiesCount":9,"topCollections":["Famous Fox Federation"],"topPercentile":3,"personality":"degen"}',
    output: 'You showed up before the airdrops were real. Then they became real.',
  },
  // Weak-signal: low age, modest community count — pivot to community angle.
  {
    input:
      '{"walletAgeDays":120,"walletAgeYears":0.3,"communitiesCount":31,"topCollections":["Tensorians","SMB"],"topPercentile":10,"personality":"degen"}',
    output: 'Newer wallet, 31 communities deep already. The on-chain rolodex is filling up.',
  },
];

export function buildUserPrompt(analysis: WalletAnalysis): string {
  const years = +(analysis.walletAgeDays / 365).toFixed(1);
  const input = JSON.stringify({
    walletAgeDays: analysis.walletAgeDays,
    walletAgeYears: years,
    communitiesCount: analysis.communitiesJoined.length,
    topCollections: analysis.communitiesJoined.slice(0, 3).map((c) => c.collection),
    topPercentile: years > 4 ? 1 : years > 3 ? 3 : years > 2 ? 5 : 10,
    personality: analysis.personality,
  });
  return renderFewShot(FEW_SHOT, input);
}

function renderFewShot(
  pairs: Array<{ input: string; output: string }>,
  finalInput: string
): string {
  const blocks = pairs.map((p) => `Input: ${p.input}\nOutput: ${p.output}`);
  blocks.push(`Now generate for:\nInput: ${finalInput}\nOutput:`);
  return blocks.join('\n\n');
}
