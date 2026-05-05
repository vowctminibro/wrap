# WRAP — Solana Frontier 2026 Submission

> **Identity layer for Solana — every wallet has a story, we tell it.**

**Live:** [getwrap.vercel.app](https://getwrap.vercel.app)  
**APK:** [github.com/vowctminibro/wrap/releases/latest](https://github.com/vowctminibro/wrap/releases/latest)  
**Source:** [github.com/vowctminibro/wrap](https://github.com/vowctminibro/wrap)  
**Demo video:** *[insert YouTube URL after upload]*  
**Pitch video:** *[insert YouTube URL after upload]*  
**Twitter:** [@getwrap](https://x.com/getwrap)  
**Founder:** [@VowIMTX](https://x.com/VowIMTX)

---

## 1. MVP — What WRAP is

Solana has 5 million-plus active wallets and zero identity primitives. Every wallet carries thousands of decisions — diamond-handed bags through 65% drawdowns, OG mints from 2021, the trade that paid the rent, the rug that taught a lesson. To everyone else, the wallet is a base58 string. To the owner, it's a story they've never read.

**WRAP turns that history into mintable, verifiable identity.**

A user opens WRAP, connects their wallet (or taps Sample to explore), and within seconds sees AI-generated personality cards drawn from real on-chain activity — "Diamond Hand: 1,535 days holding $BONK," "OG Status: top 1%," "2026 Recap: your year in trades." Each card is a compressed NFT mintable to Solana via Bubblegum, **with an on-chain attestation issued through Solana Attestation Service (SAS)** so any Solana app can verify the WRAP score with one SDK call. Two wallets can be put into a head-to-head **Battle** — four categories, AI commentary, animated reveal — turning identity into a public artifact, not a private one.

### What's shipped (live, devnet, working today)

**Consumer product layer:**
- **Mobile-native React Native app** — installs on any Android device via APK download. Verified end-to-end on Solana Seeker hardware.
- **AI personality card generation** — 4 card types (Diamond Hand, OG Status, 2026 Recap, On-chain Activity), drawn from Helius wallet history, rendered via Gemini → Groq fallback chain with 24h on-device cache. "GENERATED VIA {provider}" badge on every card for transparency.
- **cNFT mint via Bubblegum** — live on devnet, embed-time env injection verified.
- **Wallet vs wallet Battle** — 4-category scoring engine, AI commentary generation, animated round-by-round reveal, replay with cached scores. Demo battles wired with real mainnet pubkeys: Toly (@aeyakovenko), Mert (@helius_labs), Ansem (@blknoiz06), Raj (@rajgokal).
- **Live Leaderboard** — friendly display names rendered everywhere (no base58 noise). Shareable result images via Pinata IPFS.
- **Mobile Wallet Adapter** — graceful fallback modal when no wallet app is installed.

**Identity infrastructure layer:**
- **Solana Attestation Service (SAS) integration** — every minted card creates an on-chain attestation via SAS, making WRAP scores verifiable by any Solana app. Schema, Credential, and Issuer pubkeys published in repo. *[update after Round 5 ships]*
- **Seeker Genesis Token detection** — Seeker holders get instant OG status the moment they connect.

**Reliability + UX:**
- **Helius retry layer** — 12s/20s timeouts with retry on `[429,502,503,504]` + abort/network errors, asset-fetch capped to keep large-wallet battles snappy.
- **Friendly error mapping** — every failure path produces a user-readable message, not a stack trace.
- **Public landing + email capture** — getwrap.vercel.app, Upstash Redis backend, growing waitlist for mainnet launch.

### Why this matters now

Solana primitives are mature — token transfers, NFTs, DeFi composability — but the layer that lets users *see who they are on-chain* doesn't exist. Every wallet app shows balances. None show identity.

WRAP fills that gap with a consumer-grade product Solana users actually want to share, plus an API surface that other Solana apps (Phantom, Backpack, Jupiter) can plug into to personalize their UX based on real wallet history. SAS makes the identity layer composable — your WRAP score is portable across the ecosystem.

We're shipping consumer first to prove demand. The endgame is infrastructure.

---

## 2. User Acquisition Strategy

WRAP wins on shareability. Every mint is a tweet. Every battle is two wallets showing up at once. The acquisition motion is built into the product, not bolted on.

### Channel 1 — Solana Mobile / Seeker users (primary launch surface)

Solana Seeker has shipped 150K+ devices to 50+ countries with $1.3M Q1 2026 phone sales and an active Builder Grants program (launched March 19, 2026). Seeker users are pre-qualified — they bought hardware specifically for Solana-native experiences. WRAP is built for them: Mobile Wallet Adapter integration, Seed Vault signing, Seeker Genesis Token detection, mintable cNFTs, native APK distribution.

**Plan:** Submit to Solana dApp Store post-Frontier (Q3 2026 after mainnet deployment + Privacy/ToS pages). Apply for Solana Mobile Builder Grants. Aim for inclusion in Seeker featured-app rotation.

**Target signal:** 5,000 Seeker users mint at least one card in the first 90 days post-dApp-Store launch.

### Channel 2 — Viral X loop ("Share your Wrapped")

WRAP cards are designed to be shared. Each mint generates a square portrait image. Battle results generate a versus image with both wallets, scores, and the winning category. The hashtag is already live (`#getwrap`).

**Plan:** "Share to X" as primary CTA after every mint. Pre-generate share images on Pinata IPFS for permalink stability. Run a "First 100 Wrapped" campaign — first 100 wallets to mint receive a permanent OG badge that appears on every future card.

**Target signal:** 1,000 unique share posts on X within the first 30 days post-launch. 5x viral coefficient. 50K weekly impressions sustained.

### Channel 3 — Solana ecosystem partnerships via SAS

WRAP's SAS integration makes it embeddable. A wallet app (Phantom, Backpack) can show "Your 2026 Wrapped" inside their UI by reading the SAS attestation — no re-analysis needed. A protocol (Jupiter, Tensor, Drift) can verify a wallet's WRAP score for personalization or reputation gating.

**Plan:** Post-Frontier, ship a public WRAP API documentation site. Pitch directly to Phantom (50M+ users), Backpack (5M+), Jupiter (1M+ DAU). Position as identity-as-a-service for Solana apps, with SAS as the composability layer.

**Target signal:** 3 ecosystem partner integrations live within 6 months of mainnet launch.

### Channel 4 — Build-in-public marketing

Public GitHub from day one. Weekly Frontier video updates submitted via Loom. Daily build cadence on @getwrap. The execution narrative resonates with Solana's builder-first culture: mobile-native identity layer, shipped end-to-end during Frontier, every commit visible.

**Plan:** Daily build-in-public posts on @getwrap. Open-source the core scoring engine post-Frontier to attract contributors. Engage Solana Mobile, Helius, and Anza accounts directly with build updates.

**Target signal:** 5K X followers within 90 days. 50+ GitHub stars within 30 days post-Frontier.

### Acquisition funnel summary

```
Awareness   →  X posts, share-images, Frontier visibility, dApp Store featured
Activation  →  Onboarding sample-wallet flow (no signup required)
Retention   →  Battle, Leaderboard, "Your monthly Wrapped" updates
Referral    →  Share-to-X built into every mint + battle result
Composable  →  SAS attestations enable third-party apps to integrate WRAP scores
Revenue     →  Follows distribution (see Monetization)
```

---

## 3. Monetization

WRAP is **free for users. Forever.**

The product is consumer-grade. We don't gate identity behind a paywall. Cards mint freely. Battles are unlimited. Leaderboard is public. The user pays only the Solana gas fee for cNFT mints (~$0.001 per mint).

This is a deliberate strategic choice. Spotify Wrapped is free — its value isn't the paywall, it's the giveaway that strengthens the platform. WRAP follows the same pattern: identity primitive that grows the network, with revenue capture happening at the infrastructure layer where willingness-to-pay actually exists.

### Revenue paths under exploration (post-mainnet, Q3-Q4 2026)

WRAP has not committed to a single revenue model pre-launch because **value capture follows usage.** We will validate during the pilot phase:

**1. On-chain royalties on secondary trades.** Each WRAP card mints with a creator royalty enforced by Solana Token Extensions on-chain. Treasury accumulates when cards trade — aligns our incentives with users finding cards valuable enough to collect or trade. Honest model: if cards aren't worth keeping, no revenue.

**2. B2B integrations with Solana wallets and protocols.** WRAP's scoring engine + LLM commentary + Bubblegum mint flow + SAS attestation infrastructure are reusable. We plan to pilot with 2-3 partners (wallet apps, DEX aggregators, NFT marketplaces) who want personalization features without building from scratch. **Pricing TBD** — we'll learn what partners actually pay for during the pilot before publishing tiers.

**3. Solana ecosystem grants.** WRAP qualifies for multiple programs:
- Solana Mobile Builder Grants (launched March 2026)
- Solana Foundation consumer app grants
- Partnership opportunities with Helius, Pinata, and Bubblegum providers for free-tier expansion

**4. Token issuance — open option, not today.** We're not issuing a WRAP token at launch. The cNFT *is* the asset. If clear utility emerges (e.g., on-chain governance for Leaderboard curation, or proof-of-engagement points), we'll revisit with the community. Premature tokenization dilutes focus and introduces regulatory complexity.

### What we're optimizing for (next 12 months)

Post-Frontier, the goal is **distribution before revenue**:
- 50,000+ wallets minted at least one card
- 3+ external integrations (wallet embed, dApp Store featured, protocol partnership)
- 1,000+ daily active wallets engaging with Battle / Leaderboard

These metrics signal product-market fit. Revenue follows. Trying to extract subscription dollars from 50K consumers is a $300K/year ceiling. Building the identity primitive that 5M+ Solana wallets plug into, composable via SAS, is a multi-million-dollar opportunity that requires distribution first.

We're choosing the latter.

### Cost structure (transparent, current)

- Helius RPC: free tier (sufficient through 1M req/day at scale)
- Gemini + Groq LLM: free tier with fallback chain (resilient at our current scale)
- Pinata IPFS: free tier (1GB, sufficient for ~10K mints with image storage)
- Vercel hosting: free tier
- SAS: open infrastructure, no licensing fees
- Solana devnet: free; mainnet costs ~$0.001 per cNFT mint at scale

**Total infrastructure cost today: ~$0/month.** This is by design. Scaling 100× raises infrastructure to ~$100-200/month, still negligible. Revenue optionality stays open at every scale.

---

## 4. Team

**Founder: Vow** — Bangkok-based, 5 years on Solana since 2021, mobile-native focus.

![Vow](/founder.png)

WRAP is led by Vow with a small team scaling up post-Frontier. Background spans frontend (React, React Native, TypeScript), Solana program development (Anchor, Bubblegum cNFTs, Mobile Wallet Adapter, Solana Attestation Service), and AI integration (Gemini, Groq, prompt engineering for structured generation).

WRAP shipped from idea to live APK in 14 days during the Frontier hackathon — 4 product phases (cards, mint, battle, leaderboard), SAS identity infrastructure layer, Seeker Genesis integration, landing live with email capture, APK in production. The execution velocity reflects a team optimized for shipping over committee.

### Track record (current)

- **GitHub `vowctminibro/wrap`** — 4 product phases + identity infra, daily commits, public from day one
- **Live deliverables** — landing, APK, email capture, Frontier weekly updates all running in production
- **Public build cadence** — weekly Frontier video updates on YouTube, build-in-public on @getwrap
- **5 years Solana experience** — building on the chain since 2021

### Post-Frontier hires

- **Solana program engineer** — audit + program ownership ahead of mainnet
- **Growth / community lead** — community management + ecosystem partnership pipeline

### Advisor pipeline (forming)

WRAP is actively building advisor relationships across Solana Mobile, Helius, and consumer-product founders. Updates will be shared during Colosseum interview phase if invited.

---

## 5. The Frontier Ask

WRAP's submission is built around two distinct outcomes — the cash prize and the accelerator slot — each unlocking a different layer of growth.

### What the cash prize unlocks ($30K Grand Champion / $10K Standout)

- **Solana program audit** — pre-mainnet security review (~$15K)
- **Mainnet deployment** — Merkle tree provisioning + monitoring + SAS Credential migration to mainnet
- **Pinata Pro storage** — IPFS scaling for 10K+ mints
- **6 months focused runway** — execution post-Frontier without distraction

The cash prize sustains the polish work. WRAP ships either way — the cash extends the polish runway from 3 months to 9 months.

### What the accelerator slot unlocks ($250K + Network)

This is the multiplier. WRAP's path from "Spotify Wrapped for Solana" to "the identity layer every Solana app plugs into via SAS" is 12-18 months with the accelerator's network. Without it, 3-5 years.

**The $250K extends runway:**
- 8 months team runway (founder + Solana program engineer)
- Mainnet deployment + audit (covered)
- Pilot integrations with 2-3 wallet partners (paid pilots, not free)
- Marketing budget for X campaign + dApp Store featured listing
- Buffer for audit findings + performance optimization

**The network unlocks the integrations:**
- Direct introductions to Phantom, Backpack, Solflare leadership
- Solana Mobile partnership pathway for dApp Store featuring
- Helius / Anza connections for infrastructure scaling
- Solana Identity Group connections via SAS adoption
- LP introductions for institutional Pre-Seed if traction warrants

Cash funds the polish. Network funds the company.

---

## Closing

The product is shipped. Live on devnet. APK in users' hands. The hero flow works on a real Solana Seeker phone — sample wallet, AI cards, mint, attestation, battle, leaderboard. Judges can install and verify in 5 minutes.

The wedge works. The cards mint. The attestations verify. The battles run. The market is 5M+ Solana wallets that have stories to tell, and zero existing identity primitives to tell them.

Time to wrap.

---

**Live demo:** [getwrap.vercel.app](https://getwrap.vercel.app)  
**APK download:** [github.com/vowctminibro/wrap/releases/latest](https://github.com/vowctminibro/wrap/releases/latest)  
**Source code:** [github.com/vowctminibro/wrap](https://github.com/vowctminibro/wrap)  
**Pitch video:** *[YouTube URL]*  
**Demo video:** *[YouTube URL]*  
**Twitter:** [@getwrap](https://x.com/getwrap)  
**Founder:** [@VowIMTX](https://x.com/VowIMTX)
