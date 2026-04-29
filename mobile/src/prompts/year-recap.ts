// Year Recap card: Spotify-Wrapped style summary line.

import type { WalletAnalysis } from '../types';

export const SYSTEM = `You write Spotify-Wrapped style year recap one-liners about crypto wallet activity. Output exactly one sentence between 10 and 15 words. Confident, summarizing voice. Reference real numbers from their year — transactions, swaps, protocols, mints. Slightly cocky. Screenshot-able. No emoji. No exclamation marks. No questions. No generic praise. Output only the one-liner — no quotes, no preface, no explanation.`;

const FEW_SHOT: Array<{ input: string; output: string }> = [
  {
    input:
      '{"totalTransactions":1284,"totalSwaps":142,"totalMints":48,"uniqueProgramsInteracted":47,"topToken":"BONK","personality":"degen"}',
    output: '1,284 transactions across 47 protocols. Zero regrets, allegedly. The chain remembers.',
  },
  {
    input:
      '{"totalTransactions":412,"totalSwaps":89,"totalMints":12,"uniqueProgramsInteracted":18,"topToken":"JUP","personality":"builder"}',
    output: '89 swaps across 18 protocols. Methodical year. The blockchain noticed every move.',
  },
  {
    input:
      '{"totalTransactions":2104,"totalSwaps":380,"totalMints":92,"uniqueProgramsInteracted":64,"topToken":"WIF","personality":"degen"}',
    output: '2,104 transactions and a sleep schedule sacrificed. One of these survived 2026.',
  },
  {
    input:
      '{"totalTransactions":78,"totalSwaps":6,"totalMints":3,"uniqueProgramsInteracted":5,"topToken":"SOL","personality":"believer"}',
    output: 'Six swaps. Three mints. The conviction strategy is statistically aggressive, financially sane.',
  },
  {
    input:
      '{"totalTransactions":567,"totalSwaps":45,"totalMints":200,"uniqueProgramsInteracted":22,"topToken":"SAMO","personality":"collector"}',
    output: '200 mints across 22 protocols. The gallery pays the gas, eventually.',
  },
  // Weak-signal: modest tx count and few protocols, but still a punchy summary.
  {
    input:
      '{"totalTransactions":200,"totalSwaps":76,"totalMints":1,"uniqueProgramsInteracted":59,"topToken":"SAMO","personality":"builder"}',
    output: '76 swaps across 59 programs. One mint. Curious hands, disciplined wallet.',
  },
];

export function buildUserPrompt(analysis: WalletAnalysis): string {
  const top = analysis.topTokensByValue[0]?.symbol;
  const input = JSON.stringify({
    totalTransactions: analysis.totalTransactions,
    totalSwaps: analysis.totalSwaps,
    totalMints: analysis.totalMints,
    uniqueProgramsInteracted: analysis.uniqueProgramsInteracted,
    topToken: top,
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
