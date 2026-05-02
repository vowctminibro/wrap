# WRAP Positioning — One Page

**Last updated:** 2026-05-02 (Day 13)

## The 1-line pitch

WRAP is the identity layer for Solana. Wallets become rich, claimable,
verifiable identity that other apps can read and users can mint.

## The problem

Solana has 5M+ active wallets but zero identity primitives. Every wallet
is just an address — pseudonymous to others, invisible even to its owner.
That history (paper hands, diamond hands, the rug, the alpha, the conviction
during drawdowns) is the most truthful identity a person has on-chain.
Today, none of it is legible.

## What we built

**WRAP turns wallet history into mintable identity cards.** Mobile-first
React Native app on @solanamobile Seeker. AI-generated personality cards
(Diamond Hand, OG Believer, Builder, Iron Stomach) backed by on-chain data.
Mintable as compressed NFTs via Bubblegum. Composable — other dApps can
read the cards as a SDK.

## What's different from Rekap and Reputation Scorer

Both shipped earlier; neither advanced through Colosseum.

| | Rekap | Solana Reputation Scorer | **WRAP** |
|---|---|---|---|
| Form factor | Web | Web (B2B) | **Mobile-native (Seeker)** |
| Output | Witty narrative | Reputation score | **Mintable identity card** |
| Wallet sign | Connect-wallet | None | **Seed Vault (hardware)** |
| Composability | None | None | **cNFT readable by any Solana dApp** |
| Multi-wallet | Single | Single | **Battle / Leaderboard (Day 14-16)** |

The thesis "wallet → AI → narrative" is not new. The execution layer
(mobile + Seeker + cNFT mint + multi-wallet interaction) is what makes
WRAP shippable as infrastructure, not just a one-time consumer toy.

## Addressing the antimemetics critique

The Copilot audit (research/copilot-audit.md) flagged a structural
risk: per-wallet uniqueness undercuts the shared-artifact dynamic that
drives viral consumer crypto products like Punks, BAYC, or Bonk. Each
WRAP card alone is privately memorable but publicly antimemetic —
there's nothing to point at and say "look, it's that thing."

Battle and Leaderboard are the structural fix. Two-wallet comparison
creates a shared memetic surface (the matchup, the rivalry, the
ranking) that travels through screenshots and X. The viral object
isn't the card; it's the head-to-head story.

## The unfair advantage (one sentence)

WRAP is the only identity product mobile-native on Seeker — Seed Vault
hardware signing makes the mint UX zero-friction in a way no web
competitor can match.

## TAM

5M+ active Solana wallets. Beachhead = 150K Seeker holders launching 2026.
Expansion = every wallet on Solana via SDK partnerships (Phantom, Magic
Eden, Jupiter).

## Business model

1. **Consumer (today):** free mint, premium card tiers ($0.50–$5 in SOL)
2. **B2B SDK (Q3 2026):** dApps pay per-read for WRAP identity API.
   Phantom personalizing wallet UX, Magic Eden personalizing collection
   recommendations, Jupiter showing trade history insights — all read
   from WRAP.
3. **cNFT utility (Day 14-16):** token-gating, airdrop allowlist,
   composable badge — flips card from vanity → primitive.

## Team

Solo dev (Vow), 12 days into build. Background: [Vow ใส่เอง — เขียนจริงตอนทำ pitch deck]

## Roadmap

- ✅ Day 1-7: core analyzer + AI cards
- ✅ Day 8-11: cNFT mint on devnet (Bubblegum)
- ✅ Day 12: dual LLM fallback chain + 24h cache + provider badges
- 🔄 Day 13: pitch reframe + Battle data model
- 🔄 Day 14-15: Battle UI + share card
- 🔄 Day 16-17: Leaderboard + cNFT token-gating utility
- 🔄 Day 18: hero flow polish + custom domain
- 🔄 Day 19-20: pitch deck + demo video + written submission
- 🔜 Day 21-22: buffer + final submission
- 🔮 Q3 2026: SDK launch for dApp partners
