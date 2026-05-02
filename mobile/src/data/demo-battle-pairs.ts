// Curated demo-battle pairs surfaced in BattleInputScreen.
//
// walletA / walletB are full base58 mainnet pubkeys. Pairs flagged
// with a TODO sentinel are intentionally disabled in the UI ("Coming
// soon" pill) and will be filled in by Vow before the demo. The
// shape lets us ship the input flow without blocking on pubkey
// research.

export type DemoBattlePair = {
  id: string;
  label: string;
  walletA: string;
  walletB: string;
  tagline: string;
};

const TODO = '<TODO>';

export function isDemoPairEnabled(pair: DemoBattlePair): boolean {
  return pair.walletA !== TODO && pair.walletB !== TODO;
}

export const DEMO_BATTLE_PAIRS: DemoBattlePair[] = [
  {
    id: 'diamond-vs-paper',
    label: 'Diamond Hand vs Paper Hand',
    // Anatoly's public-domain demo wallet (Helius docs example).
    walletA: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    walletB: TODO,
    tagline: 'Conviction meets capitulation',
  },
  {
    id: 'og-vs-newcomer',
    label: 'OG vs Newcomer',
    walletA: TODO,
    walletB: TODO,
    tagline: '2021 wisdom vs 2026 enthusiasm',
  },
  {
    id: 'builder-vs-trader',
    label: 'Builder vs Trader',
    walletA: TODO,
    walletB: TODO,
    tagline: 'Programs deployed vs swaps executed',
  },
];
