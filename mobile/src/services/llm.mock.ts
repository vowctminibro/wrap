// MOCK: ultimate fallback when both Gemini and Groq fail (no keys, both
// providers down, or rate-limited). Returns hand-crafted, on-brand
// 15-word lines per card type from a pool, with a deterministic-yet-
// rotating selection so the same input doesn't keep producing identical
// output. Voice rules mirror src/theme/tokens.ts.

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
  let h = counter++;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

function detectCardType(systemPrompt: string): keyof typeof POOLS {
  const s = systemPrompt.toLowerCase();
  if (s.includes('hold-through') || s.includes('diamond')) return 'diamond';
  if (s.includes('early to crypto communities') || s.includes('og status')) return 'og';
  if (s.includes('year recap') || s.includes('wrapped style')) return 'recap';
  return 'recap';
}

export function callLLMMock(systemPrompt: string, userPrompt: string): string {
  return selectFromPool(POOLS[detectCardType(systemPrompt)], userPrompt);
}
