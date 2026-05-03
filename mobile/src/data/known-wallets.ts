// Known Solana figures whose pubkeys appear in WRAP demo battles,
// the seeded leaderboard, and the sample wallet flow. When a wallet
// matches, render the friendly name instead of the base58 truncation.
//
// Only entries with a 3rd-party-verifiable identity belong here. Two
// other pubkeys live in research/demo-battle-pairs.md but lacked a
// confirmed name attribution at audit time — they intentionally fall
// through to the truncation path. Adding new entries: cross-reference
// the source in research/ first, never type from memory.

export const KNOWN_WALLETS: Record<string, string> = {
  // Anatoly Yakovenko (toly.sol) — Solana co-founder.
  '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY': 'Toly',
  // Raj Gokal (gokal.sol) — Solana co-founder, COO.
  E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk: 'Raj',
  // Mert Mumtaz (mert.sol) — Helius CEO.
  '2CiBfRKcERi2GgYn83UaGo1wFaYHHrXGGfnDaa2hxdEA': 'Mert',
  // Ansem (@blknoiz06) — trader / KOL.
  AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm: 'Ansem',
  // Helius docs example wallet — used by the "Try with sample wallet"
  // onboarding flow. Surfacing it as "Sample" on the leaderboard /
  // share image keeps the demo narrative consistent with the
  // sample-wallet bypass already wired into llm-cache.ts.
  '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU': 'Sample',
};

/**
 * Resolves a wallet pubkey to its friendly name when it's a known
 * Solana figure (Toly, Raj, Mert, Ansem, Sample); otherwise falls
 * back to the existing 4+...+4 truncation. Used everywhere the UI
 * renders a wallet identity label so judges see "Toly defeated Ansem"
 * instead of "86xC...2MMY defeated AVAZ...NXYm".
 *
 * The `chars` arg controls the truncation width for unknown wallets;
 * call sites that previously used `shortenAddress(pubkey, N)` should
 * pass the same N to keep their visual width unchanged.
 */
export function displayName(pubkey: string, chars = 4): string {
  if (!pubkey) return '';
  const known = KNOWN_WALLETS[pubkey];
  if (known) return known;
  if (pubkey.length <= chars * 2 + 3) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}
