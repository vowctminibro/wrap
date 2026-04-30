# WRAP — Sprint Report (Days 4–9)

Generated at sprint close. Source-of-truth for what shipped, what's
stubbed, and what the human picks up at Day 10+.

---

## Commits

11 commits in the autonomous sprint window (Days 4–9):

| Day | Hash | Subject |
|---|---|---|
| 4 | `463624d` | Day 4.0: track existing devnet helper scripts |
| 4 | `304590b` | Day 4.1: scaffold Expo TS app + Solana mobile deps |
| 4 | `0ff8415` | Day 4.2: MWA wallet wiring + OnboardingScreen — Phase 1 complete |
| 4 | `a2057fd` | Day 4.3: PROGRESS.md initialized |
| 4 | `26f1242` | Day 4.4: backfill commit hashes in PROGRESS.md |
| 5 | `460ceb0` | Day 5.1: Helius client + wallet analyzer — Phase 2 complete |
| 6 | `41651b1` | Day 6.1: Claude insight engine + 3 prompts — Phase 3 complete (mock-mode) |
| 6 | `f7d9f4a` | Day 6.2: LLM provider chain — Gemini primary + Groq fallback (Phase 3.5) |
| 7 | `c9bfd2f` | Day 7.1: end-to-end card flow — Phase 4 complete |
| 8 | `98c2a33` | Day 8.1: Share-to-X + cNFT mint scaffolding — Phase 5 complete (stub) |
| 9 | `5d337dc` | Day 9.1: affiliate hooks + gallery + polish — Phase 6 complete |

Plus the `Day 9.final` commit appended at the end of this file.

All 11 commits are pushed to `origin/main`.

---

## Blockers encountered + resolutions

### B-001 · Anthropic API key absent

The plan expected `ANTHROPIC_API_KEY` at `~/.config/anthropic/api_key`,
in env, or in `~/.claude/settings.json`. None existed on this machine.

**Resolution.** Phase 3.5 LLM-architecture refactor replaced Anthropic
with **Gemini 2.5 Flash (primary) → Groq Llama 3.3 70B (fallback) →
hand-crafted mock pool (ultimate fallback)**. Both Gemini and Groq run
on free tier with 10 s timeout per provider; both keys provided
mid-sprint. Real prose now ships.

### B-002 · Devnet faucet rate-limited — **RESOLVED 2026-04-30**

The configured devnet keypair
`6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx` was at 0 SOL through
sprint close. Both the public `api.devnet.solana.com` faucet and the
Helius devnet RPC returned `403 Rate limit exceeded` at every airdrop
amount (1, 0.5, 0.25 SOL).

**Initial workaround (sprint close).** `cnft-mint.ts` shipped with the
full mintV1 code path but stubbed at runtime when
`EXPO_PUBLIC_MERKLE_TREE_PUBKEY` started with `stub_`.

**Resolution.** Hermes operator funded the keypair via
`https://faucet.solana.com` (browser, sybil-checked with a 0.001 SOL
mainnet seed — different rate-limit pool than the RPC airdrop), 2.5
SOL granted. `setup-merkle-tree.ts` then created the real tree
(`maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3`) and the stub branch
was removed from `cnft-mint.ts`. First on-chain mint
(`623oSFKAJzsq4TB9MY4bz48gDYVQZYJ5zEpowjZmBFFRwgTnkMkZ8uALjiuLYuinKGiY3zM1YCKQWBdbYrywyf4f`)
confirmed in 1.5 s. Banner removed from `MintConfirmScreen`. See
`PROGRESS.md` § "Phase 5.live Verification" for full output.

### B-003 · Pinata image hosting not yet implemented

Captured PNGs land in the device FileSystem cache; cNFT metadata
points to the placeholder `placeholder://wrap-card` URI.

**Resolution.** Logging Pinata signup as `HERMES_HANDOFF.md` Task 2;
once the JWT lands in `mobile/.env.local` the unblock is purely
adding a `pinFile` helper inside `cnft-mint.ts`.

### MWA → umi signer bridge gap — sidestepped via embedded delegate

`mpl-bubblegum 5.x` doesn't ship an adapter to wrap a Mobile Wallet
Adapter session as a umi `Signer`. The deeper architectural reality
is that even with a perfect bridge, the **mobile user's MWA wallet
isn't the tree authority** — only the tree creator/delegate keypair
can sign mint instructions for our shared tree.

**Resolution.** The tree-delegate keypair is bundled into the app via
`EXPO_PUBLIC_WRAP_DELEGATE_SECRET` (base64 64-byte secret). On mint,
`cnft-mint.ts` attaches it as the umi keypair identity so it signs
both the payer and treeCreatorOrDelegate slots; the user's MWA pubkey
is the leaf owner. This **leaks the secret on apk decompile** —
acceptable on devnet where SOL is valueless and the tree is rotatable.
Production migration is a backend signer service holding the keypair
server-side; documented in the file header.

---

## API keys — current state

| Key | Source | State at sprint close |
|---|---|---|
| `EXPO_PUBLIC_HELIUS_KEY` | provided mid-sprint | **live** — wallet history flowing from mainnet |
| `EXPO_PUBLIC_GEMINI_KEY` | provided mid-sprint | **live** — primary LLM |
| `EXPO_PUBLIC_GROQ_KEY` | provided mid-sprint | **live** — fallback LLM |
| `EXPO_PUBLIC_MERKLE_TREE_PUBKEY` | created Day 9.live | **live** — `maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3` |
| `EXPO_PUBLIC_WRAP_DELEGATE_SECRET` | local devnet keypair (b64) | **live** — signs mints; rotatable |
| `EXPO_PUBLIC_PINATA_JWT` | pending Hermes Task 2 | not present — cNFT uses placeholder URI |
| `EXPO_PUBLIC_PINATA_GATEWAY` | pending Hermes Task 2 | not present |
| (legacy `ANTHROPIC_API_KEY`) | obsolete | not used; replaced by Gemini/Groq |

All keys live in `mobile/.env.local`, gitignored via the existing
`.env*.local` rule. Verified untracked at every commit.

---

## Demo readiness assessment

### Mock + simulator (Mac mini, no device, no devnet SOL)

**Fully runnable.** End-to-end:

1. Onboarding renders Screen 1 with the gradient CTA
2. `Connect Wallet` substitutes a known power-user pubkey (no MWA on iOS / web)
3. Helius mainnet returns ~200 transactions + ~116 assets in ~3 s
4. `analyzeWallet` produces a typed `WalletAnalysis`
5. `CardRevealScreen` shows the gradient pulse loader, then renders 3 cards
6. Gemini 2.5 Flash generates 10–13 word punchy lines per card type
7. Swipe between cards, dot indicator updates
8. `Share to 𝕏` captures the visible card and opens the share sheet
9. `Mint as NFT` returns a deterministic stub signature
10. `MintConfirm` confetti screen renders with stub banner
11. Affiliate buttons under primary CTAs open the right partner site
12. Top-right `≡` opens Gallery (3 active + 4 v2 placeholder thumbnails)

`tsc --noEmit` reports 0 errors. `expo-doctor` reports 17/17 checks
passed.

### Real device (Solana Seeker, Phantom installed)

**Partially runnable.** Pieces that work on first run:
- MWA `transact()` wallet connect on Android
- All Helius reads against the connected wallet
- All LLM insights
- view-shot card capture and system share sheet
- Gallery, affiliate links, navigation

Pieces that **need the unblock work** to flip live:
- ~~cNFT mint actually transacting on devnet~~ — **resolved Day 9.live**
  via Hermes-funded keypair + real tree + bundled delegate secret.
  First mint sig recorded in `PROGRESS.md`.
- cNFT metadata image pointing to a real IPFS URL — pending Hermes
  Task 2 (Pinata JWT). Code path already wired; flips on automatically.

### Known data limitations (not bugs, document as caveats)

- `walletAgeDays` and `averageHoldDays` are computed from the 200-tx
  fetch window. For ultra-active wallets (>200 tx in 24 h) both come
  out artificially low. Phase Polish item: add an exhaustive
  `getOldestSignature` walk before analyze.
- `drawdownsHeld` uses a current-value proxy (high-balance + low-USD).
  Real drawdown computation needs a price-history feed.
- 4 of 7 card types (`swaps`, `genre`, `personality`, `achievement`)
  exist as visual gallery thumbnails only. Adding their prompts and
  template entries to the insight engine is a small, scoped Phase
  Polish task.

---

## Next-step recommendations (Day 10+ human work)

Ordered roughly by demo impact for the hackathon judging window:

1. **Run Hermes** to fill `HERMES_HANDOFF.md`. Once values land, Claude
   Code can re-run `setup-merkle-tree.ts`, write the Pinata JWT to
   env, and flip both stubs to live in a single follow-up session.
2. **Fund the devnet keypair** via `https://faucet.solana.com` (web,
   different rate-limit pool than the RPC) — even 0.2 SOL is enough to
   demonstrate `createTree`.
3. **Build the MWA → umi signer bridge** (small wrapper file, ~80 LOC).
   This is the last gap between "stub mint" and "real on-chain mint
   from device."
4. **Record a demo gif/video on Seeker** once 1–3 are done; drop the
   path into `README.md` where the placeholder lives.
5. **Widen the Helius fetch window** for hyper-active wallets via a
   separate oldest-signature walk, so wallet age + avg hold days read
   honest.
6. **Add prompt + template entries** for the 4 v2 card types so they
   move from gallery placeholders to real insights.
7. **Add a backend proxy in front of Anthropic / Gemini / Groq** so
   bundled keys aren't exposed in the apk decompile. Cloudflare Worker
   is the cheapest path.
8. **Pinata helper in `cnft-mint.ts`** to upload the captured PNG +
   metadata JSON before the on-chain mint, replacing the placeholder
   image URI.

---

## File-by-file ship summary

```
mobile/
├── App.tsx                            nav stack, polyfills, dark theme
├── src/screens/
│   ├── OnboardingScreen.tsx           Screen 1 — connect + analyze
│   ├── CardRevealScreen.tsx           Screen 2 — swipe + Share/Mint/affiliate
│   ├── MintConfirmScreen.tsx          Screen 3 — confetti, Solscan, share again
│   ├── CardGalleryScreen.tsx          Screen 4 — 7-thumbnail gallery
│   └── DebugAnalysisScreen.tsx        internal dev tool
├── src/components/
│   ├── Card.tsx                       full + mini variants
│   ├── PixelIcon.tsx                  16×16 pixel-art (View grid)
│   ├── Confetti.tsx                   seeded, stable
│   └── AffiliateButton.tsx            per-cardType partner CTA
├── src/services/
│   ├── helius.ts + .mock.ts           mainnet reads, lazy key
│   ├── llm.ts + .mock.ts              Gemini → Groq → mock
│   └── cnft-mint.ts                   live + stub paths
├── src/lib/
│   ├── wallet.ts                      MWA wrapper
│   ├── wallet-analyzer.ts             pure analyzeWallet()
│   ├── insight-engine.ts              templates + LLM + CardData
│   ├── share-card.ts                  view-shot + expo-sharing
│   └── polyfills.ts
├── src/prompts/
│   ├── diamond-hand.ts                SYSTEM + 6 few-shot
│   ├── og-status.ts                   SYSTEM + 6 few-shot
│   └── year-recap.ts                  SYSTEM + 6 few-shot
├── src/theme/tokens.ts                single source of design truth
└── src/types/index.ts                 CardData, WalletAnalysis, nav

scripts/
├── test-analyzer.ts                   Helius+analyzer smoke test
├── test-insights.ts                   full LLM pipeline review
└── setup-merkle-tree.ts               one-time devnet tree creation
```

---

## Status

**Sprint complete. Ready for human testing.**

Stub paths are clearly labeled in the UI ("demo mint · no real tx"
banner) and in `BLOCKERS.md` for the human reviewer. Live paths
activate the moment the corresponding env value flips from a
`stub_*` / missing key to a real value — no code change required.

`PROGRESS.md` has the per-phase decision log; `BLOCKERS.md` has the
unblock recipes; `HERMES_HANDOFF.md` is waiting for browser-side input.
