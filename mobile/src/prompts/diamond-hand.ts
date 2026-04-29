// Diamond Hand card: punchy line about hold-through moments.
// SYSTEM enforces voice + minimum-length rule; buildUserPrompt() inlines
// 6 few-shot pairs (incl. one weak-signal case) + the actual analysis
// input as a single user message.

import type { WalletAnalysis } from '../types';

export const SYSTEM = `You write punchy one-liners about cryptocurrency hold-through moments. Output exactly one sentence between 10 and 15 words. Confident, slightly cocky, screenshot-able. Reference at least one specific token or number from the input. No emoji. No exclamation marks. No generic praise like "amazing" or "you're crushing it". No questions. Output only the one-liner — no quotes, no preface, no explanation.`;

const FEW_SHOT: Array<{ input: string; output: string }> = [
  {
    input:
      '{"token":"BONK","drawdownPct":80,"daysHeld":240,"count":3,"topTokens":["BONK","SOL","JUP"],"personality":"believer"}',
    output: 'You held BONK through three 80% drawdowns. Iron stomach, paid in patience.',
  },
  {
    input:
      '{"token":"WIF","drawdownPct":65,"daysHeld":180,"count":2,"topTokens":["WIF","USDC"],"personality":"degen"}',
    output: 'WIF dropped 65% twice. You did not blink. Conviction priced in.',
  },
  {
    input:
      '{"token":"JUP","drawdownPct":0,"daysHeld":847,"count":0,"topTokens":["JUP","SOL"],"personality":"believer"}',
    output: 'Bought JUP once. Never sold. Reverence levels: monastic, by Solana standards.',
  },
  {
    input:
      '{"token":"SOL","drawdownPct":75,"daysHeld":1100,"count":4,"topTokens":["SOL","JUP","JTO"],"personality":"builder"}',
    output: 'Four SOL crashes. Same address. The thesis never moved an inch.',
  },
  {
    input:
      '{"token":"JTO","drawdownPct":50,"daysHeld":420,"count":1,"topTokens":["JTO","SOL","BONK"],"personality":"believer"}',
    output: 'JTO halved once. You held. Patience as an asset class, well-priced.',
  },
  // Weak-signal case: small balance, low-confidence duration, modest stack —
  // model still has to produce a 10-15 word punchy line.
  {
    input:
      '{"token":"SAMO","drawdownPct":0,"daysHeld":0,"count":1,"topTokens":["SAMO","USDC"],"personality":"degen"}',
    output: 'SAMO bag still on the books. You forgot it existed. That counts.',
  },
];

export function buildUserPrompt(analysis: WalletAnalysis): string {
  const hold = analysis.biggestHold;
  const top = analysis.topTokensByValue.slice(0, 4).map((t) => t.symbol);
  const input = JSON.stringify({
    token: hold?.symbol ?? top[0] ?? 'SOL',
    drawdownPct: hold?.drawdownPct ?? 0,
    daysHeld: hold?.daysHeld ?? analysis.averageHoldDays ?? 0,
    count: analysis.drawdownsHeld.length,
    topTokens: top,
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
