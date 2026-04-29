// MOCK: replace when EXPO_PUBLIC_ANTHROPIC_KEY (or ANTHROPIC_API_KEY) is
// provided. Returns hand-crafted, on-brand 15-word lines per card type
// from a pool, with a deterministic-yet-varied pick so the same call
// inputs don't keep producing identical output.
//
// Voice rules (from src/theme/tokens.ts):
//   • ≤15 words • confident, slightly cocky • screenshot-able
//   • no emoji, no exclamation marks, no generic praise

import type { CallClaudeOptions } from './claude';

const POOLS: Record<string, string[]> = {
  diamond: [
    'You held BONK through three 80% drawdowns. Iron stomach.',
    'WIF dropped 65% twice. You did not blink. Conviction priced in.',
    'Bought once, never sold. Reverence levels: monastic.',
    'Two years deep on the same bag. Time is your only edge.',
    'Drawdowns came and went. Your position did not.',
  ],
  og: [
    'You were here when SOL was three digits. Then two. Then three again.',
    'Mad Lads minted before the bots arrived. You actually clicked.',
    'Wallet predates Magic Eden v1. The provenance speaks for itself.',
    'You showed up before the airdrops were real. They became real.',
    'Top 1% by age. The rest of us are tourists.',
  ],
  recap: [
    '1,284 transactions. 47 protocols. 0 regrets. Allegedly.',
    'A year on chain: nine figures of volume across three personalities.',
    'You touched DeFi, NFTs, memes and prediction markets. Diversified, allegedly.',
    '142 swaps and a Mad Lad. The agenda was clear.',
    'Two new wallets, one new genre, zero gas budgets respected.',
  ],
};

let counter = 0;

function selectFromPool(pool: string[], seed: string): string {
  // Deterministic hash so same input -> same output, but rotate slightly so
  // sequential test runs visit different lines.
  let h = counter++;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % pool.length;
  return pool[idx];
}

function detectCardType(opts: CallClaudeOptions): string {
  const sysLower = opts.system.toLowerCase();
  if (sysLower.includes('hold-through') || sysLower.includes('diamond')) return 'diamond';
  if (sysLower.includes('early to crypto communities') || sysLower.includes('og')) return 'og';
  if (sysLower.includes('year recap') || sysLower.includes('wrapped style')) return 'recap';
  // Default to recap-style if unclassifiable.
  return 'recap';
}

export function callClaude(opts: CallClaudeOptions): Promise<string> {
  const cardType = detectCardType(opts);
  const userMsg = opts.messages.filter((m) => m.role === 'user').pop()?.content ?? '';
  return Promise.resolve(selectFromPool(POOLS[cardType], userMsg));
}
