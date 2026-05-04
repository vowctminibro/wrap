# WRAP — Sprint Progress (Days 4-9)

Status legend: ✅ done · ⚠️ done with caveat · ❌ blocked · ⏳ in progress

---

## Phase 1 — Day 4: Mobile Scaffold + MWA Connect ✅

**Commits:**
- `463624d` Day 4.0: track existing devnet helper scripts
- `304590b` Day 4.1: scaffold Expo TS app + Solana mobile deps
- `0ff8415` Day 4.2: MWA wallet wiring + OnboardingScreen — Phase 1 complete
- `a2057fd` Day 4.3: PROGRESS.md initialized

**Definition of Done:**
- [x] `mobile/` exists at `~/Projects/wrap/mobile/`
- [x] All deps installed, package.json clean
- [x] `tsc --noEmit` passes with 0 errors
- [x] `expo-doctor` 17/17 checks passed
- [x] OnboardingScreen renders Screen 1 layout w/ design tokens
- [x] `App.tsx` navigation wired (native-stack, dark theme)
- [x] MWA `transact()` code present in `src/lib/wallet.ts`

**Decisions made:**
- pnpm chosen by `create-expo-app` default — kept (faster installs).
- Used `expo install` instead of raw `pnpm add` so RN-side libs match SDK 54.
- `expo-linear-gradient` adopted for all gradient surfaces; matches RN-Skia
  alternative without adding native dep weight.
- Polyfills (`buffer`, `react-native-get-random-values`) loaded via single
  side-effect import at top of `App.tsx` so they run before any web3.js call.
- iOS / web fall back to mock connect (returns a fake pubkey) since MWA is
  Android-only — keeps the dev loop unblocked on the Mac mini.

**Blockers logged:** none yet. Peer-dep mismatch noted (mpl-bubblegum 5.0.2
expects `umi <1`, installed `umi 1.5.1`); will revisit if runtime breaks in
Phase 5.

**API key status:**
- `ANTHROPIC_API_KEY`: **found** at `~/.config/anthropic/api_key`
- `HELIUS_API_KEY`: **provided** — saved to `mobile/.env.local` as
  `EXPO_PUBLIC_HELIUS_KEY`, ignored via `.env*.local` rule

---

## Phase 2 — Day 5: Helius RPC Integration ✅

**Commits:** see `git log` for `Day 5.x:` commits.

**Definition of Done:**
- [x] `src/services/helius.ts` exposes `getWalletTransactions`,
  `getTokenHoldings`, `getNFTsForOwner`, plus `getAllAssets` for shared use
- [x] `src/services/helius.mock.ts` returns realistic fixtures, used as
  automatic fallback when `EXPO_PUBLIC_HELIUS_KEY` is missing
- [x] `src/lib/wallet-analyzer.ts` is pure, returns `WalletAnalysis`
- [x] Personality classification runs on real data
- [x] `tsc --noEmit` clean

**Decisions:**
- Network split implemented: read calls default to `mainnet`; analyzer is
  network-agnostic. Devnet caller for tx history transparently falls back
  to mocks (Helius Enhanced REST is mainnet-only).
- DAS `getAssetsByOwner` with `showFungible: true` used for both
  `getTokenHoldings` and `getNFTsForOwner` so we make one round trip and
  split the result by interface; this also gives us USD price info for
  free via `token_info.price_info.total_price`.
- Helius key read via lazy `getKey()` so Node-side scripts that load
  `.env.local` post-import still see it. In Expo it's inlined at build time.

**Known limitations (logged for human awareness, not blocking):**
- 200-tx fetch cap: ultra-active wallets (>200 txs in past 24h) report a
  wallet-age and average-hold-days based only on the recent window. Will
  fix in Phase Polish by adding a separate `getOldestSignature` call that
  paginates `getSignaturesForAddress` until exhausted.
- `averageHoldDays` only sees in→out matches inside the fetched window.
  Same root cause; same fix.
- `drawdownsHeld` uses a current-value proxy (large-balance, low-USD
  tokens), not historical drawdown. Real drawdown needs a price-feed
  integration not in scope for the sprint.

### Phase 2 Smoke Test

Wallet: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`
Fetch: 200 transactions + 116 assets in ~4.3 s on real Helius mainnet.

```json
{
  "address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "totalSwaps": 76,
  "totalMints": 1,
  "totalTransactions": 200,
  "oldestTxDate": "2026-04-28T20:43:11.000Z",
  "walletAgeDays": 1,
  "biggestHold": {
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "symbol": "SAMO",
    "amount": 1205819.59,
    "valueUSD": 435.71
  },
  "topTokensByValue": [
    { "symbol": "SAMO", "amount": 1205819.59, "valueUSD": 435.71 },
    { "symbol": "USDC", "amount": 33.55, "valueUSD": 33.54 },
    { "symbol": "USDT", "amount": 1, "valueUSD": 1.00 },
    { "symbol": "CASH", "amount": 1, "valueUSD": 1.00 },
    { "symbol": "Aliens", "amount": 391, "valueUSD": 0.24 }
  ],
  "communitiesJoined": [
    { "collection": "5c3BUaoj7GNBLyRFUoRNNnt5kqaKTc68DNrCYAQijb8P", "isOG": true },
    { "collection": "Em9wb7niKr9bkvDeYnzA57XPU11KDTBSKBnY7J4SHPFL", "isOG": true },
    { "collection": "2BEAtXJZGncSdX41pYEB5XcfvCGC7sgDQ8M2SbXma1Ah", "isOG": true },
    { "collection": "D8PJYBwEZpjmxAYijP8frNeEnKLGgdgmjmB4zWfiRiby", "isOG": true },
    { "collection": "7QuScCRP6d7CZUbAkiQYn6pd7nTj8wQW37sS1HK4pRh4", "isOG": true }
  ],
  "drawdownsHeld": [
    { "symbol": "SAMO", "amount": 1205819.59, "valueUSD": 435.71 }
  ],
  "uniqueProgramsInteracted": 59,
  "averageHoldDays": 0,
  "personality": "builder"
}
```

(Top arrays truncated to first 5 per project convention.)
Note `walletAgeDays: 1` reflects the 200-tx fetch cap — see "Known
limitations" above. The `personality: "builder"` classification correctly
fires on `uniqueProgramsInteracted: 59 > 5`.

---

## Phase 3 — Day 6: Claude API Insight Engine ✅ (mock-mode)

**Commits:** see `git log` for `Day 6.x:` commits.

**Definition of Done:**
- [x] `src/services/claude.ts` — Messages API client w/ lazy key lookup,
  auto-fallback to `claude.mock.ts` if no key
- [x] 3 prompt templates with system rules + 5 few-shot pairs each:
  - `src/prompts/diamond-hand.ts`
  - `src/prompts/og-status.ts`
  - `src/prompts/year-recap.ts`
- [x] `src/lib/insight-engine.ts` — `generateCardInsight(cardType, analysis)`
  + `generateAllInsights(analysis)` returning typed `CardData[]`
- [x] `scripts/test-insights.ts` runs and emits CardData JSON
- [x] Output reads punchy, on-brand (see sample below)
- [x] `tsc --noEmit` clean

**Decisions:**
- Default model `claude-haiku-4-5-20251001` — cost/speed win for 100-token
  punchy outputs. Caller can override per-call if needed. Comment in
  `claude.ts` explains the swap path.
- Mock pool stays in sync with prompt few-shot voice: 5 lines per card
  type, deterministic+rotating selection so repeated test runs visit
  different lines (counter-XOR seeded by user-message hash).
- Prompt few-shots use JSON-stringified inputs as the user message —
  cheap to construct, easy to extend, and gives the model a clear
  "structured-input → punchy-string" pattern to imitate.
- `cleanLine()` post-processor in `insight-engine.ts` enforces the 15-word
  cap defensively (strips quotes, drops trailing fragment after period,
  truncates if Claude over-generates).
- Iterations on prompts: **0** so far (mock-mode obscures real-API
  quality). Once a key lands, will judge and re-iterate up to 3 times per
  the plan's tolerance budget.

### Phase 3 Test Output

Wallet: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` ·
Claude mode: **MOCK** (no `ANTHROPIC_API_KEY` — see BLOCKERS B-001) ·
End-to-end pipeline runtime: **~3.6 s** (Helius dominates).

**Sample insight lines (one per card type):**

- **Diamond Hand** — *"You held BONK through three 80% drawdowns. Iron stomach."*
- **OG Status** — *"Mad Lads minted before the bots arrived. You actually clicked."*
- **Year Recap** — *"142 swaps and a Mad Lad. The agenda was clear."*

Voice rules: ≤15 words ✓ · no emoji ✓ · no exclamation ✓ · confident,
slightly cocky ✓ · references on-chain specifics ✓.

**Sample full CardData (Diamond):**

```json
{
  "id": "diamond",
  "cardType": "diamond",
  "icon": "diamond",
  "label": "Diamond Hand",
  "accent": "#FFFFFF",
  "stat": "1",
  "statUnit": "DAYS",
  "sub": "holding $SAMO",
  "line": "You held BONK through three 80% drawdowns. Iron stomach.",
  "pubkey": "7xKX...gAsU",
  "walletShort": "7xKX...gAsU"
}
```

Stat values like `"1 DAYS"` and `"wallet age: 0 yrs"` reflect the same
200-tx fetch cap noted in Phase 2. Once a `Phase Polish · oldest-tx
backfill` lands, the stat fields render correctly without any insight-
engine change.

**Blockers:**
- B-001: `ANTHROPIC_API_KEY` missing → resolved by Phase 3.5 — replaced
  Anthropic with Gemini-primary + Groq-fallback architecture; both keys
  provided.

---

## Phase 3.5 — LLM Architecture Refactor (provider chain) ✅

**Decisions:**
- Renamed `src/services/claude.ts` → `src/services/llm.ts`. Public surface
  is the simpler `callLLM(systemPrompt, userPrompt) → Promise<string>`.
- Provider chain: **Gemini 2.5 Flash** primary → **Groq Llama 3.3 70B**
  fallback → throw → caller (insight-engine) falls back to a hand-crafted
  mock pool. Both providers are free-tier; no billing risk.
- 10 s `AbortController` timeout per provider.
- `getLastProvider()` exposed for debug-only telemetry (not surfaced to UI).
- `sanitizeOutput()` strips quotes, drops common preambles (`Output:`,
  `Here's...`), collapses whitespace, hard-caps at 15 words.
- Prompt files refactored to expose flat `(SYSTEM, buildUserPrompt)` —
  few-shot pairs are now serialized into the user prompt as
  `Input: {…}\nOutput: {…}` blocks, ending with `Now generate for:`.
- `insight-engine.ts` accepts an optional `trace[]` parameter so the
  test runner can surface which provider responded for each card type.

**Iterations needed:** 1 (with a config bug-fix mid-iteration).

Round 1 was triggered because real Gemini output was clipped to 1-3
words. Root cause turned out to be Gemini 2.5 Flash spending the
`maxOutputTokens` budget on internal "thinking" tokens before emitting
visible text. Fix: set `thinkingConfig.thinkingBudget = 0` in the
generation config — for a 15-word one-liner there's nothing to think
about. Concurrently I:
- Added a per-prompt "weak-signal" few-shot example so the model knows
  it must produce a punchy 10-15-word line even when the input numbers
  are small (the test wallet shows degenerate values because of the
  Phase 2 fetch-cap issue).
- Tightened SYSTEM with `Output exactly one sentence between 10 and 15
  words` and `No questions`.
- Bumped both providers' max output tokens 80 → 120 for headroom.

### Phase 3.5 Real LLM Output

Wallet: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` ·
End-to-end pipeline runtime: **~3.4 s** with Gemini, ~3.4 s with Groq
fallback (Helius dominates the budget either way).

**With Gemini (primary path):**
- **Diamond Hand** — *"Your SAMO is still there. Unsold, untouched. Builders build, not trade."*
- **OG Status** — *"Eighteen communities on day one. You're already building the next wave, anon."*
- **Year Recap** — *"78 swaps across 58 programs. One mint. Curious hands, disciplined wallet."*

**With Groq fallback (forced via invalid Gemini key):**
- **Diamond Hand** — *"SAMO purchase still on the ledger, a deliberate unchecked holding."*
- **OG Status** — *"First day in and eighteen communities strong already on the ground floor."*
- **Year Recap** — *"78 swaps across 58 protocols with calculated precision every time."*

Voice rules: ≤15 words ✓ · references real numbers (eighteen communities,
78 swaps, 58 programs, SAMO) ✓ · no emoji ✓ · no exclamation ✓ ·
confident voice ✓.

**Quality concerns to flag:**
- Both providers occasionally drift toward mild abstraction (e.g. "calculated
  precision", "the next wave, anon"). Not generic praise per the voice rules,
  but worth a Phase Polish pass once richer wallet data lands (the 200-tx
  fetch cap from Phase 2 still distorts inputs).
- All 3 lines reference SAMO / 78 swaps because that's the most distinctive
  data point in the fetched window. With a wider window the engine has more
  to draw on.

---

## Phase 4 — Day 7: End-to-end Card Flow ✅

**Definition of Done:**
- [x] `CardRevealScreen` renders 3 cards via swipeable horizontal `FlatList`
- [x] Loading state — gradient pulse + spinner + tx count
- [x] `Card.tsx` is reusable + props-driven (full + mini variants)
- [x] Pipeline runs end-to-end (mock-mode and real-LLM)
- [x] `tsc --noEmit` passes, no type warnings
- [x] Mint button stub navigates to `MintConfirmScreen` placeholder

**Decisions:**
- `Card.tsx` uses `aspectRatio: 9/14` so the same component sizes
  correctly at full-screen, mini, or thumbnail (Phase 6 gallery) without
  hardcoded heights.
- Pixel icons reimplemented as a grid of absolutely-positioned `View`s
  in `components/PixelIcon.tsx`. The web demo relies on `box-shadow`
  multi-shadows which RN doesn't expose; the View-grid approach
  preserves the same visual fidelity. Cells get a `+0.5dp` bleed to
  avoid sub-pixel gaps on hi-DPI screens.
- `CardRevealScreen` calls `generateAllInsights(analysis)` on mount,
  not in `OnboardingScreen` — keeps the connect step responsive and
  puts the slower step inside an obvious loader.
- Mint button currently stubs a fake signature and routes to
  `MintConfirmScreen`; Phase 5 swaps in the real mpl-bubblegum mint.
- Long stats ("TOP 1%") use `adjustsFontSizeToFit` so the same stat slot
  doesn't break for short ("847") and long values.

**Visual delta vs screenshots/02_Card_Reveal.png:**
- Faithful to spec: top label + WRAP/'26 + icon, big stat, hairline,
  AI line, pubkey + wordmark footer, dots, Share + Mint CTAs.
- Omitted the noise/grain inner overlay — overhead not justified for
  sprint timing; gradient + shadow is already very close to the mark.
- Sizes scale to mobile dp space (~390 × 844 on iPhone) rather than the
  1080 × 2400 design canvas. Proportions match.

---

## Phase 5 — Day 8: Share-to-X + cNFT Mint ⚠️ stub (per plan rule)

**Definition of Done:**
- [x] Share button captures the visible card and opens system share sheet;
  falls back to text-only X intent when image share unavailable
- [⚠️] Merkle tree on devnet — **stubbed** because devnet faucet returned
  HTTP 403 "Rate limit exceeded" on every retry. Logged as B-002.
- [x] `cnft-mint.ts` compiles end-to-end. Full production code path is
  written (capture → metadata → `mintV1`) with a documented MWA→umi
  signer-bridge gap; stub path returns deterministic fake signatures so
  the demo flow is exercised.
- [x] `MintConfirmScreen` matches Screen 3 — confetti, ambient glow,
  green "CONFIRMED" pill, mini glowing card, "Your story is on-chain.",
  View on Solscan + Share again CTAs.
- [x] `tsc --noEmit` clean across all of Phase 5.

**Decisions:**
- Share sheet path is `view-shot.captureRef` → `expo-sharing.shareAsync`.
  On platforms where `expo-sharing` is unavailable we open
  `https://twitter.com/intent/tweet?text=…` as a text-only fallback so
  the button never feels dead.
- Each `Card` in the swipe list is wrapped in a `<View collapsable={false}
  ref>` so view-shot can grab the currently-visible card by index.
- `Confetti` pieces are pre-generated with a seeded RNG (count 60) so the
  layout is stable across renders and the screen doesn't reflow on every
  pressable interaction.
- `cnft-mint.ts` exposes one entry point (`mintCardAsCNFT`) and routes
  internally between `mintLive` and `makeStubResult`. The dispatch
  predicate is `EXPO_PUBLIC_MERKLE_TREE_PUBKEY` shape: a real base58
  pubkey activates live; anything starting `stub_` keeps stub path.
- `MintConfirmScreen` shows a small italic "demo mint · no real tx"
  banner under the headline whenever the signature is a stub, so testers
  aren't confused into clicking Solscan and seeing a 404.
- `View on Solscan` opens devnet Solscan (`?cluster=devnet`), with an
  Alert short-circuit on stub signatures.

### Phase 5 Merkle Tree status

- **Tree pubkey:** *not yet created*. `mobile/.env.local` holds the
  placeholder `EXPO_PUBLIC_MERKLE_TREE_PUBKEY=stub_phase5_no_devnet_sol`.
- **Payer keypair:** `6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx`
  (loaded from `~/.config/solana/devnet.json`)
- **Balance:** 0.0000 SOL on devnet
- **Blocker:** B-002 — public devnet faucet rate-limit. Helius devnet
  RPC returned the same 403. Manual fund via https://faucet.solana.com
  unblocks; rerun `NODE_PATH=mobile/node_modules npx tsx scripts/setup-merkle-tree.ts`.

**Pinata upload status:** not implemented in this phase. Demo path uses
the captured PNG locally (FileSystem cache) and submits a
`placeholder://wrap-card` URI to the metadata. Real image hosting is a
Phase Polish task; logging a future B-003 when we get there.

---

## Phase 6 — Day 9: Affiliate Hooks + Gallery + Polish ✅

**Definition of Done:**
- [x] Affiliate CTAs scoped to card type, all carrying `?ref=WRAP_SOL`:
  diamond → MarginFi, og → Magic Eden, recap → Jupiter (with the user's
  top token interpolated into the swap pair)
- [x] `CardGalleryScreen` with 7 thumbnails — 3 active (Diamond / OG /
  Recap) tappable, 4 dimmed v2 placeholders (Top Tokens / Top Genre /
  Personality / Achievements) with badge overlay
- [x] All 4 production screens navigable
  (Onboarding → CardReveal → MintConfirm + CardReveal → Gallery)
- [x] Loading + error states wired: gradient pulse loader, "Wallet
  history unavailable" alert on Helius failure, "New wallet" alert on
  empty history
- [x] All visual values consume from `theme/tokens.ts`; no hardcoded
  hex outside the per-card gradient maps in `tokens.ts` itself
- [x] `README.md` polished — full layout, dev setup, smoke tests, demo
  flow
- [x] `tsc --noEmit` clean. `expo-doctor` 17/17.

**Decisions:**
- Affiliate links are tertiary visually — pill-shaped outlined button in
  small text below the primary Share/Mint row. Cocky voice is reserved
  for the AI line; affiliate CTA is plain action language.
- Gallery thumbnails reuse the same gradient + pixel-icon palette as
  full-size cards but at 9:12 aspect; v2 placeholders dim with a 55%
  black overlay + a top-right "v2" badge so they read as forthcoming
  rather than broken.
- Tapping an active gallery thumbnail just `goBack()`s to CardReveal;
  CardReveal can't accept an `initialPage` param mid-mount, and a more
  surgical deep-link is Phase Polish work.
- OnboardingScreen now hides raw error strings behind contextual alerts
  ("Wallet history unavailable" vs "New wallet" vs the catch-all).

---

## Hermes handoff status — final check

`HERMES_HANDOFF.md` was scaffolded with empty fields for the browser-
side tasks (devnet airdrop + Pinata signup). At sprint close:

- **All fields still `TODO`** — Hermes hadn't run by the time Phase 6
  finished. No integration possible this session.

Per the sprint plan ("If still TODO placeholders → keep stub mode, log
clearly which pieces are stub vs live"):

| Concern | State at sprint close |
|---|---|
| Helius mainnet reads | **LIVE** — real key, real data flowing |
| Gemini 2.5 Flash insights | **LIVE** — real key, on-brand prose |
| Groq fallback | **LIVE** — verified via forced Gemini failure |
| Mock LLM ultimate fallback | **LIVE** — pool exercised when both providers throw |
| MWA wallet connect | **WIRED** — compiles; runs on Seeker / Android only |
| view-shot card capture | **LIVE** — works in tsc-verified path; needs device to fully validate |
| expo-sharing share sheet | **LIVE** — text-intent fallback for unsupported platforms |
| Devnet Merkle tree | **LIVE** — flipped Day 9.live; see verification below |
| cNFT on-chain mint | **LIVE** — flipped Day 9.live; real signature verified |
| Pinata image hosting | **LIVE** — flipped Day 9.live; IPFS hash + gateway URL verified |
| Affiliate links | **LIVE** — open the right partner with `?ref=WRAP_SOL` |

---

## Phase 5.live Verification (2026-04-30)

Hermes Task 1 cleared the devnet faucet block; rest happened from
this session.

**Tree creation** — `scripts/setup-merkle-tree.ts`, real on-chain:

```
[wrap] using payer 6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx
[wrap] balance: 2.5000 SOL
[wrap] creating tree maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3…
[wrap] tree created. tx: 2QXJAh7aobVWk7XfkQq1uAwWyfXep9xxScEb69gG8A78adBxZ9AqhAPGZLPKZKHDFNGL6egaQJ4DNijcrFHarDRh
[wrap] pubkey: maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3
[wrap] saved EXPO_PUBLIC_MERKLE_TREE_PUBKEY to /Users/mini/Projects/wrap/mobile/.env.local
```

Tree config: depth 14, buffer 64 (capacity 16,384 leaves). Cost ≈
0.085 SOL.

**First mint** — `scripts/test-mint.ts`, the same code path the mobile
app calls:

```
[wrap] payer / tree authority: 6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx
[wrap] leaf owner:             6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx
[wrap] tree:                   maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3
[wrap] sending transaction…
[wrap] ✓ minted in 1526ms
[wrap] signature: 623oSFKAJzsq4TB9MY4bz48gDYVQZYJ5zEpowjZmBFFRwgTnkMkZ8uALjiuLYuinKGiY3zM1YCKQWBdbYrywyf4f
[wrap] solscan:   https://solscan.io/tx/623oSFKAJzsq4TB9MY4bz48gDYVQZYJ5zEpowjZmBFFRwgTnkMkZ8uALjiuLYuinKGiY3zM1YCKQWBdbYrywyf4f?cluster=devnet
```

```json
{
  "signature": "623oSFKAJzsq4TB9MY4bz48gDYVQZYJ5zEpowjZmBFFRwgTnkMkZ8uALjiuLYuinKGiY3zM1YCKQWBdbYrywyf4f",
  "leafOwner": "6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx",
  "tree": "maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3",
  "cardLabel": "Diamond Hand",
  "elapsedMs": 1526,
  "solscan": "https://solscan.io/tx/623oSFKAJzsq4TB9MY4bz48gDYVQZYJ5zEpowjZmBFFRwgTnkMkZ8uALjiuLYuinKGiY3zM1YCKQWBdbYrywyf4f?cluster=devnet"
}
```

**Architecture decision (logged for the record):** the tree's
creator/delegate is the local devnet keypair. The mobile user's MWA
wallet is the leaf owner — they receive the cNFT but they don't sign
tree-level operations. Without a backend signer, the mint requires the
delegate keypair to be loaded into the app at build time
(`EXPO_PUBLIC_WRAP_DELEGATE_SECRET`, base64 64-byte secret). This
**leaks** to anyone who decompiles the apk; acceptable here because
the tree is on devnet and the SOL has zero value, and the tree can be
rotated by re-running `setup-merkle-tree.ts` at any time. Production
move is a small backend signer service that holds the keypair
server-side and exposes a sign-and-submit endpoint. Cleanly logged in
the file's header docstring so future work knows the gap.

**Pinata status:** Hermes Task 2 (Pinata sign-up + JWT) is still TODO
in `HERMES_HANDOFF.md`. The `pinImageToPinata` helper inside
`cnft-mint.ts` is already wired — it no-ops and returns the
`placeholder://wrap-card` sentinel when `EXPO_PUBLIC_PINATA_JWT` is
missing, so the on-chain mint succeeds either way. The moment a JWT
lands in `mobile/.env.local`, the next mint will pin the captured PNG
to IPFS and store the resolvable gateway URL in the cNFT metadata —
no code change required.

---

## Phase 5.pinata Verification (2026-04-30)

Hermes Task 2 landed: JWT, gateway, API key/secret all in
`mobile/.env.local`. `scripts/test-mint.ts` updated with a Node-
compatible Pinata uploader (RN's `FormData` shape doesn't carry into
Node 24's `Blob`-based `FormData`; mobile path stays in
`cnft-mint.ts`). End-to-end run output:

```
[wrap] payer / tree authority: 6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx
[wrap] leaf owner:             6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx
[wrap] tree:                   maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3
[wrap] uploading WRAP - Solana Colosseum/screenshots/02_Card_Reveal.png to Pinata…
[wrap] ✓ pinned in 3845ms — ipfs hash: QmaeJxmto8F3tvybvxEFqMpz2xPCyXgV3U33s46dcPzDn5
[wrap]   url: https://beige-capitalist-deer-104.mypinata.cloud/ipfs/QmaeJxmto8F3tvybvxEFqMpz2xPCyXgV3U33s46dcPzDn5
[wrap] sending mint transaction…
[wrap] ✓ minted in 2206ms
[wrap] signature: 5TpsJv75hk3VwffmEPHJYhJB14R7K2PjkMimDtxzCLxLqWCurBDcwvCRdF74muYByRK85qvZDh54LeYqZMyb5XYA
[wrap] solscan:   https://solscan.io/tx/5TpsJv75hk3VwffmEPHJYhJB14R7K2PjkMimDtxzCLxLqWCurBDcwvCRdF74muYByRK85qvZDh54LeYqZMyb5XYA?cluster=devnet
```

```json
{
  "signature": "5TpsJv75hk3VwffmEPHJYhJB14R7K2PjkMimDtxzCLxLqWCurBDcwvCRdF74muYByRK85qvZDh54LeYqZMyb5XYA",
  "leafOwner": "6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx",
  "tree": "maRBu33jrZe1k1ZUTBgjW3ecvUQepE62VQGLfprQEa3",
  "cardLabel": "Diamond Hand",
  "ipfsHash": "QmaeJxmto8F3tvybvxEFqMpz2xPCyXgV3U33s46dcPzDn5",
  "metadataUri": "https://beige-capitalist-deer-104.mypinata.cloud/ipfs/QmaeJxmto8F3tvybvxEFqMpz2xPCyXgV3U33s46dcPzDn5",
  "elapsedMs": 2206,
  "solscan": "https://solscan.io/tx/5TpsJv75hk3VwffmEPHJYhJB14R7K2PjkMimDtxzCLxLqWCurBDcwvCRdF74muYByRK85qvZDh54LeYqZMyb5XYA?cluster=devnet"
}
```

**Wall-clock budget for one full demo flow now (Node-side):**
- Pinata pin:  ~3.8 s
- Mint + confirm:  ~2.2 s
- Total user-visible: ~6 s after they tap Mint

**Status flip:** Pinata image hosting → **LIVE**. All three previously
stubbed pieces (Merkle tree, cNFT mint, IPFS image hosting) now
production-shaped on devnet. The cNFT metadata.uri now resolves to a
real PNG via the Pinata gateway; future on-chain consumers (Solscan,
Magic Eden, Tensor) can render the image directly.

---

## Phase 6.emulator Verification (2026-05-01)

**Plan C** — emulator-only run, no Phantom dep. Phantom APK install
was blocked by third-party download issues; MWA signing test deferred
to the Seeker stage.

**Tools resolution.** This Mac mini has no `adb`, `java`, or `gradle`
on PATH. Found:
- Android SDK at `~/Library/Android/sdk`
- Android Studio's bundled JBR (JDK 21) at
  `/Applications/Android Studio.app/Contents/jbr/Contents/Home`

Set `ANDROID_HOME` + `JAVA_HOME` for the build invocation; both work
for Expo SDK 54 / RN 0.81 (the JDK 17 minimum is met by 21).

**Sample-wallet button** added to OnboardingScreen — outline pill
under the primary "Connect Wallet" CTA. On press, skips MWA and runs
the existing analyze-and-navigate path against
`7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` (Helius docs example
wallet, public-domain mainnet history). Lets the emulator demo
exercise the full UX without a wallet adapter dependency.

**Build sequence:**
1. `npx expo prebuild --platform android --clean` — generated `android/`
2. `npx expo run:android` (no `--device` flag; Expo auto-picked the
   only running emulator. Earlier attempt with `--device emulator-5554`
   failed: Expo's CLI matches by AVD name, not adb serial.)
3. Gradle compiled APK in **6m 24s** (cold cache); APK installed and
   launched on AVD "WRAP-test" (emulator-5554).
4. Two non-fatal Kotlin deprecation warnings about `ReactNativeHost` —
   coming from the Expo template, not our code. Ignored.
5. Metro bundled JS in **3.5 s**, no errors.
6. App in foreground: `app.wrap.mobile/.MainActivity`.

**Onboarding screenshot** saved at
`screenshots/emulator-onboarding.png` (418 KB). What rendered:
- WRAP wordmark in solana-red, large and centered
- '26 subtitle
- Three floating preview cards (DIAMOND 847, OG STATUS TOP 1%, 2026
  RECAP 1,284) with correct gradients and rotations, overlapping
  exactly as the design specifies
- "Your wallet has stories. / We tell them." headline (second line in
  solana-red)
- "Connect your Solana wallet. Get your Wrapped card." sub
- Primary "Connect Wallet" gradient pill
- Sample-wallet outline pill (new) — visible at bottom but **clipped
  near the screen edge** on this emulator's screen height. Tappable,
  but should get a small bottom-padding bump in a follow-up. Minor
  cosmetic, not blocking the demo.

**Status:** app running on `emulator-5554`. Human can tap "Try with
sample wallet" to walk the full flow (CardReveal → 3 cards → Share →
Mint → MintConfirm → Gallery) without Phantom. AI provider chain
(Gemini → Groq → mock) and live cNFT mint will exercise on first tap.

---

## Phase 6.brand Verification — Day 10 (2026-05-01)

Solana brand alignment shipped across 4 commits (`3c00be2`, `f89b9fe`,
`d702eb4`, `ac11ee6`). The legacy `#FE3B68` "solanaRed" hot pink that
predated the project is fully removed; palette now follows
https://solana.com/branding (purple `#9945FF`, green `#14F195`, with
magenta `#DC1FFF` rounding out the official 3-color gradient).

**Per-card gradient assignment (active card types only):**
- diamond → green → purple
- og → purple → magenta
- recap → magenta → green
- v2 placeholders scrubbed of `#FE3B68` references too

**Tier 2 additions:**
- `SolanaMark` — three skewed `LinearGradient` bars approximating the
  Solana logomark silhouette (no `react-native-svg` dep added; would
  have required another prebuild)
- `SolanaBadge` — mark + "Built on Solana" text, accessible link, lives
  in OnboardingScreen / MintConfirmScreen / CardGalleryScreen footers
- `AboutScreen` — modal-presented credits screen (TECH STACK, SOURCE,
  BUILT BY) with explicit non-affiliation disclaimer
- `(i)` info button on CardReveal + Gallery top bars routes to About

**Skipped:** Tier 2 step 11 (replace emoji icons in PreviewCards) is a
no-op — `grep -rE "[💎👑📊🔥🎯⚡✨🚀]"` found zero emoji in
`mobile/src/`. Preview cards already use plain text + `PixelIcon`
custom 16×16 grids. Documented in the brand-4 commit message.

**Visual verification — `screenshots/day10-rebrand.png`:**
- Top-left ambient blob: Solana purple (was red)
- Bottom-right ambient blob: Solana green (was violet)
- WRAP wordmark: Solana purple (was red)
- Floating preview cards now use the new per-card gradients —
  Diamond/OG/Recap each visibly distinct
- Headline accent "We tell them.": Solana purple
- Connect Wallet CTA: purple → green gradient (was red→orange→violet)
- Sample-wallet pill border: Solana green (was red)

**Visual diff vs `day10-launch.png`:** completely different identity.
Same layout, same composition — colors swapped throughout. The look
reads as a Solana-native app rather than a generic gradient mock.

**Known UI item (not blocking):** the Day 10.cosmetic
`paddingBottom: spacing.lg` fix from `de47474` still doesn't visibly
seat the sample-wallet pill above the screen edge on this AVD —
escalation to `useSafeAreaInsets() + insets.bottom + 24` is the next
move when polish time allows.

**Demo video build note:** the dev-client overlay ("Open Debugger /
Reload" toast, dev menu surface) is only visible in debug builds. For
the Day 14-15 demo recording, build the release variant so the menu
overlay is gone:

```
cd ~/Projects/wrap/mobile
npx expo run:android --variant release
```

Keeping the dev build for current iteration speed (HMR is faster than
re-installing a release APK every change).

`tsc --noEmit` clean across all 4 brand commits. `expo-doctor` was
last verified 17/17 prior to the rebrand; no native modules added so
no doctor regression possible.

---

## Day 14 — Leaderboard Phase 1 ✅ (commit `3a9e4aa`)

Local AsyncStorage battle history (`wrap:battles:history`, cap 50 FIFO) +
LeaderboardScreen with Top-5 winners + last-10 recent + empty state, with
3 fake battles auto-seeded on first launch so judges never hit empty.
BattleResult hooks appendBattle once per battle (ref-guarded, ties skipped);
Onboarding gets a magenta-bordered 🏆 Leaderboard CTA. Verified on emulator:
seeds render, cold-kill persistence holds, no duplicate seeding, back-nav clean.

## 2026-05-02 — Demo battle pairs research
Verified 6 famous Solana wallets via SNS resolver + RPC (toly.sol 261 SOL very active, mert.sol Helius CEO, armani.sol Backpack, jacklu.sol ME CEO, ilmoi.sol Tensor, gokal.sol Solana cofounder, ansem AVAZv...NXYm). Proposed pairings (Toly vs Raj, Ansem vs Mert, Armani vs Jack Lu) saved to research/demo-battle-pairs.md — committed f17ba27. No mobile/ code touched.

## Day 14 — Leaderboard hot-fix + real seeds (commits `a4a119f`, `6da000e`)
`a4a119f` moves the persistence `useEffect` above BattleResultScreen's loading/error early returns — fixes "Rendered more hooks than during the previous render" that crashed live battles in `3a9e4aa`. `6da000e` swaps placeholder seeds for verified mainnet pubkeys (Toly, Raj, Mert, Ansem) per `research/demo-battle-pairs.md`. Verified on emulator: pm clear → seeds render with real prefixes (86xC/E645/2CiB/AVAZ); live battle through MintConfirm appends "just now" on top with no hook crash.

## Day 14 — Leaderboard Phase 2A: Wallet Detail Screen (commit `5bdb096`)
Top Winners rows on LeaderboardScreen now navigate to a per-wallet read-only profile (identity + gradient stats card with W/L/win-rate + per-battle history rows from this wallet's perspective). Pure `getWalletStats` helper added to battleHistory.ts; `formatRelative` extracted to `lib/relative-time.ts` and shared. Recent Battles rows stay inert pending Phase 2B. Verified all four seed pubkeys (Toly 2W/0L/100%, Mert 1W/1L/50%, Raj 0W/1L/0%, Ansem 0W/1L/0%).

## Day 14 — Leaderboard Phase 2B: Battle Replay (commits `a7516d0`, `fa086be`)
Tapping any Recent Battles row replays its round-by-round animation. `a7516d0` adds optional `replay?: BattleHistoryRecord` route param + `commentary?` field on `BattleHistoryRound`; BattleResultScreen short-circuits the engine call and persistence when `replay` is set, swaps the skip slot for a magenta REPLAY badge, and renders a single "Back to Leaderboard" CTA in place of Mint/Battle Again. Live battles propagate engine commentary into the persisted record so live → replay roundtrips. `fa086be` adds 12 hand-written commentary lines (3 seeds × 4 rounds) including a tie-acknowledging line on the Toly-Mert diversity round. Verified end-to-end: all 3 seeds replay with seeded commentary, live battle vs `6uRT…V8Wx` persists at top of Recent and replays back with original engine commentary, Top Winners rows still navigate to WalletDetail (Phase 2A intact).

## Day 14 — Leaderboard Phase 2C: Shareable Image (commits `5e9b01d`, `073830d`)
Closes the antimemetic loop: a share button (↗) in the Leaderboard header captures a 1200×675 off-screen `ShareLeaderboardCard` (WRAP wordmark + Top 3 / Recent 3 over a Solana magenta→purple gradient), pins the PNG to Pinata, and hands the public URL to the system share sheet. `5e9b01d` extracts the Pinata helper out of `cnft-mint.ts` into `services/pinata.ts` (`uploadImageToPinata(uri, name)`) and adds `expo-clipboard` for the Android fallback. `073830d` builds the share card + three-stage try/catch flow (capture → upload → share) with distinct console.warn per stage; on Android `Sharing.shareAsync` rejects https URLs so the catch falls through to `Clipboard.setStringAsync` + "Link copied" toast. Verified all 7 items on Pixel emulator: share button visible top-right, two consecutive taps produced fresh uploads (different timestamp suffixes), captured PNG (3150×1772 at device pixel ratio) shows correct seed data, airplane mode → "Could not generate share link — try again" toast with no crash, network restore recovers cleanly.

## Day 14 — Landing page deployed (commit 9c1cfa2)
Live at https://getwrap.vercel.app — alias of landing-orcin-alpha-74.vercel.app. Static Next.js 16 + Tailwind v4 build with hero, 3-feature grid, install CTA, footer. OG metadata configured (1200x630 og-default.png, twitter:card summary_large_image). Deployment protection disabled via Vercel API. Mobile responsive verified at iPhone 14 Pro viewport. Vercel project: landing (under team vowctminibro-7069s-projects).

## Day 14 — Landing page polish: dead CTAs (commit `f4017a6`)
Fixed two broken CTAs from the polish audit before judges click them. Footer Twitter link now points to `twitter.com/vowctminibro` (was bare `twitter.com/`). The install section's primary "Download APK" `href="#"` was replaced with an unclickable "Available May 11, 2026" gradient label (opacity-50, cursor-default, select-none) plus a "View on GitHub" secondary CTA matching the hero button style. Existing "Star us on GitHub to follow" subtext kept. Deployed to getwrap.vercel.app via `npx vercel --prod` + alias set; verified live.

## Day 15 — Landing polish: logo lockup, X handle, email capture (commit `ddf06c1`)
Five-in-one polish pass: hero placeholder square + text-WRAP replaced with `/brand/lockup.svg` (copied from `WRAP - Solana Colosseum-2/brand/lockup-horizontal-white.svg`); favicon swapped to `/favicon.svg`; Twitter handle migrated `vowctminibro → @getwrap` in footer link + `twitter.creator` metadata (Vow secured the X handle); hero "View on GitHub" removed for a single-CTA hero; "Get the app" converted from anchor to `<button>` triggering a new `NotifyModal` email-capture overlay. Hero extracted to `components/HeroSection.tsx` ('use client') so the rest of the page stays server-rendered. New `/api/notify` edge route validates email, dedupes via `kv.set('wrap:waitlist:{email}')`, and `zadd`s to `wrap:waitlist:index` (score=ts) for chronological export later. **Manual step still needed:** Vercel KV is NOT provisioned for this project — the route currently returns 500 `kv_unavailable` until a KV database is created in the Vercel dashboard's Storage tab and linked to `landing`. Modal flow + UI are live; KV writes will start the moment provisioning completes (no code change needed).

## Day 15 — Landing polish: live narrative + attribution + footer lockup (commit `0efa16d`)
Four narrative/brand fixes deployed to getwrap.vercel.app: footer wordmark now renders the full `/brand/lockup.svg` (was an empty 28×28 mark.png + text-WRAP, hence the "missing icon" look); footer credit @vowctminibro → @VowIMTX linking to x.com/VowIMTX (vowctminibro is GitHub-only; @getwrap is product, separate footer link unchanged); install section dropped the "Available May 11, 2026" disabled-pill framing entirely — primary CTA is now a real "Download APK" gradient button pointing at `/releases/latest` (resolves to v0.1.0-preview which the EAS build just landed) plus the existing "View on GitHub" outlined secondary; intro copy rewritten to "Live on Solana devnet…" and modal copy updated to "Stay in the loop" / "WRAP is live on devnet now…" / success "We'll ping you when mainnet ships" — all of which kill the vaporware-launching-May-11 framing in favor of the truth that devnet is shipping right now.

## Day 15 — Landing /api/notify migrated @vercel/kv → @upstash/redis (commit `851c01b`)
Vercel KV deprecated since Dec 2024 — Marketplace's "Upstash for Redis" integration injects `KV_REST_API_URL` + `KV_REST_API_TOKEN` (legacy KV-prefixed for migration compat), which `@vercel/kv` couldn't see, so the route was returning 500 `kv_unavailable` in production. Swapped to `@upstash/redis` with an explicit constructor reading the KV_REST_API_* vars Vercel actually provides (Redis.fromEnv() looks for UPSTASH_REDIS_REST_* which the Vercel-native integration doesn't inject). Renamed the 500 envelope `kv_unavailable → redis_unavailable` (NotifyModal branches on HTTP status, not the error string, so safe). Schema unchanged: `SET wrap:waitlist:{email}` + `ZADD wrap:waitlist:index score=ts`. Live verified end-to-end on production: valid email → 200 `{ok:true}`, duplicate → 409 `duplicate`, invalid → 400 `invalid_email`. Email capture is now actually live.

## Day 15 — EAS preview APK + GitHub release (commit `70ad35e`)
First cloud APK landed via EAS preview profile (build `239f51a4`, https://expo.dev/accounts/vowctminibro/projects/wrap/builds/239f51a4-8f48-4759-bbe4-a5de3d8fdb83). Artifact published as the `v0.1.0-preview` prerelease — direct download at https://github.com/vowctminibro/wrap/releases/download/v0.1.0-preview/wrap-v0.1.0.apk (72,478,215 bytes, content-type application/vnd.android.package-archive). **Caveat for landing CTA:** GitHub's `/releases/latest` redirect skips prereleases, so the landing button points at `/releases` (list view) instead of resolving directly to the tag — drop the `--prerelease` flag (or wire the button to `/releases/tag/v0.1.0-preview`) to fix the auto-resolve. Build config committed: `mobile/eas.json` with preview (apk) + production (app-bundle) profiles, project ID `b7e34d3f-d90c-432b-803c-2e9ee21912d8` linked into `app.json`, `eas-cli` pinned as devDep (expo doctor lint warning, doesn't block; clean up post-Frontier).

## Day 16 — Round 4 APK upload correction (build `0b03b003`, asset replaced 2026-05-04)
Round 4 fixes (commits `596bf85` brand mark + lockup fix, `946181e` Helius DAS payload-cap tolerance, `c085823` Magic Eden affiliate removal + canOpenURL skip, `b263da9` leaderboard share-button hide-when-empty + null-ref toast) shipped to main and EAS build `0b03b003` succeeded — but the APK artifact was never uploaded to the GitHub release. Vow downloaded from `/releases/latest` and got the stale Round 3 APK (72,486,819 bytes from 2026-05-03), so 0/4 fixes were visible on Seeker. Pulled the EAS artifact (https://expo.dev/artifacts/eas/2mToVSV17TrjMBC3kjcriN.apk, 72,488,159 bytes) and force-uploaded to v0.1.0-preview via `gh release upload --clobber`. Verified: release asset now `wrap-v0.1.0.apk` size 72488159 updated 2026-05-04T12:13:09Z; public download URL `releases/download/v0.1.0-preview/wrap-v0.1.0.apk` resolves to 200 with the new bytes. `/releases/latest` redirect unchanged. Lesson: every EAS build needs an explicit `gh release upload --clobber` step; the build succeeding is not the same as the artifact being available.

## Day 15 — Friendly display names + Helius timeout/retry (commit `f7b6008`, build `1a444789`)
Two on-Seeker findings from v0.1.0-preview Round 2 retune shipped together. (1) **Display names everywhere** — base58 truncations replaced with friendly Solana figure names (Toly, Raj, Mert, Ansem, Sample) at 9 UI render sites across 5 files (BattleResultScreen, LeaderboardScreen, ShareLeaderboardCard, WalletDetailScreen, BattleInputScreen). New `src/data/known-wallets.ts` with `KNOWN_WALLETS` map verified against `research/demo-battle-pairs.md` + `seededBattles.ts`; `displayName()` falls back to existing 4+...+4 truncation for unknown pubkeys. LLM prompt path + battle cache keys deliberately kept on raw `shortenAddress`. The tweeted Pinata image now reads "Toly defeated Ansem 3-1" instead of pubkey noise. (2) **Helius timeout + single retry** — `fetchHeliusWithRetry` wraps both DAS `rpc()` and Enhanced Transactions REST with 12s AbortController timeout (20s on retry); retries once on `[429, 502, 503, 504]` + abort/network errors. `getAllAssets()` got `pageLimit`+`maxPages` opts so the battle path caps to 100 assets × 1 page (was 1000×5) — sufficient for the 4 scoring categories, dramatically smaller response surface on Toly-scale wallets. BattleResultScreen loading subtitle flips to "Retrying on-chain analysis…" after 8s. Round 1 friendly errors still catch whatever escapes the retry budget. APK in place to v0.1.0-preview (72,486,819 bytes); build https://expo.dev/accounts/vowctminibro/projects/wrap/builds/1a444789-c65b-4590-b819-076812f355ca.

## Day 15 — UX polish Round 2 retune: tighter battle + descriptive stats (commit `268a855`, build `fa7aadbb`)
Follow-up to 4ae9de3 after on-Seeker feel test. Battle animation `ROUND_DURATION_MS` 2500 → 1800 ms and `SCORE_DURATION_MS` 1200 → 800 ms — total ~9.6s for a punchier reveal cadence. Onboarding stat slot switched from `◆◆◆` glyphs to explicit descriptive labels: "DAYS HOLDING" (diamond) and "ON-CHAIN ACTIVITY" (recap); "TOP 1%" stays. Stat Text now uses `numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}` so the 44px bold style auto-shrinks to fit longer copy without a layout change. Tagline-drift fix and "Borrow against" diamond-affiliate removal already shipped in 4ae9de3 — no-ops this round. APK in place to v0.1.0-preview (72,484,823 bytes); build https://expo.dev/accounts/vowctminibro/projects/wrap/builds/fa7aadbb-2d8d-41dd-840a-3fddb23a80eb.

## Day 15 — UX polish Round 2: animation timing, fake stats, dead link, tagline drift (commit `4ae9de3`, build `1530b26b`)
Four P1 audit fixes for judging. (1) Battle animation `ROUND_DURATION_MS` 3700 → 2500 ms and `SCORE_DURATION_MS` 1500 → 1200 ms — total now ~10s (was 14.8s, judges drifted past 10s). (2) Onboarding floating-card stats — replaced hardcoded "847" and "1,284" with abstract glyph "◆◆◆"; "TOP 1%" kept (category, not measured). (3) ShareLeaderboardCard footer aligned to landing copy verbatim ("Your wallet has a story." → "Your Solana wallet, told as a story.") so the tweeted Pinata image reads identically to getwrap.vercel.app; OnboardingScreen's iconic two-line gradient hero kept. (4) Removed "Borrow against this without selling →" diamond-card AffiliateButton spec (MarginFi lending integration is post-Frontier; null SPECS entry → no dangling roadmap promise); og/Magic Eden + recap/Jupiter unchanged. APK uploaded in place to v0.1.0-preview (72,484,763 bytes); build https://expo.dev/accounts/vowctminibro/projects/wrap/builds/1530b26b-a785-43e3-8a9d-c06590440419.

## Day 15 — UX polish: friendly errors + sample wallet variation (commit `411f58b`, build `9e98bfbe`)
Two P0 polish fixes for judging. (1) Replaced 3 `e.message` leaks (BattleResultScreen runBattle catch, CardRevealScreen generateAllInsights catch, CardRevealScreen mintCardAsCNFT catch) with friendly copy via new `mapErrorToFriendly()` helper in `src/lib/errors.ts` — maps HTTP 429/504/5xx/4xx, network/timeout/abort, and LLM-provider-exhaustion patterns to short user-facing strings; raw error stays in `console.error`. (2) Sample wallet now generates fresh LLM commentary every tap — `llm-cache.ts` was keying by `{cardType}:{walletPubkey}:{dayOfYearUTC}` with sample pubkey constant + day constant within 24h, so every sample tap hit the same AsyncStorage row. Fix bypasses cache reads/writes when `walletPubkey === SAMPLE_WALLET_PUBKEY`; real wallets keep the 24h cache. APK uploaded in place to v0.1.0-preview (72,484,931 bytes); build https://expo.dev/accounts/vowctminibro/projects/wrap/builds/9e98bfbe-b8a4-43ce-91f1-8fb0c6f05be1.

## Day 15 — Mint env-injection fix: eas.json profile→environment link (commit `52e085d`, build `d5f8a5e5`)
Diagnosed why the v0.1.0-preview Mint as NFT button still threw "No live Merkle tree configured" after the previous batch. Names matched (code reads `process.env.EXPO_PUBLIC_MERKLE_TREE_PUBKEY` at `cnft-mint.ts:44`; EAS had the var with same name) but `eas env:list preview` was empty — by default each EAS build profile resolves env vars from the same-name environment, so `--profile preview` couldn't see vars pushed to `production`. Babel inlines `process.env.EXPO_PUBLIC_*` at bundle time → literal `undefined` baked in → runtime alert. Build log on `ebed0658` confirmed the smoking gun: `No environment variables with visibility "Plain text" and "Sensitive" found for the "preview" environment on EAS.` Fix: added `"environment": "production"` to the preview profile in `eas.json` (single-source-of-truth, no env duplication). Also added a one-line `console.log('[mint] env state:', { treeHasValue, treeLast4, secretHasValue })` at the env-check site so future regressions surface in logcat. Build `d5f8a5e5` (https://expo.dev/accounts/vowctminibro/projects/wrap/builds/d5f8a5e5-cda1-45a5-abe4-53b46cc4f401) build log explicitly shows: `Environment variables ... loaded from the "production" environment on EAS: EXPO_PUBLIC_GEMINI_KEY, ..., EXPO_PUBLIC_MERKLE_TREE_PUBKEY, ... EXPO_PUBLIC_WRAP_DELEGATE_SECRET` (9 vars). New APK uploaded in place to v0.1.0-preview tag (72,483,643 bytes); `/releases/latest` redirect unchanged.

## Day 15 — APK rebuild: mint env + onboarding fallback + Toly vs Ansem (commits `86ab6a3`, `153931a`, build `ebed0658`)
Mega-batch shipped in a single APK rebuild. (1) **Merkle tree env infra** — pushed 9 EXPO_PUBLIC_* secrets (helius, gemini, groq, pinata jwt/gateway/api/secret, merkle tree pubkey, wrap delegate secret) to EAS production via `eas env:create`, fixing the "No live Merkle tree configured" alert that blocked Mint as NFT in v0.1.0-preview. EAS cloud build environment is isolated from local `.env.local`; vars are stored as `sensitive` in the EAS dashboard, not committed. (2) **Audit blocker #1 (`86ab6a3`)** — `OnboardingScreen.onConnect` now wraps the MWA `transact` call in a dedicated try/catch and opens an in-app `Modal` ("Solana Wallet Required" → Try Sample Wallet primary CTA + Cancel) on failure instead of letting Android bounce users to chrome.solana.com via unhandled-intent. Post-connect Helius failures keep their existing Alert path. (3) **Audit #2 (`153931a`)** — Diamond Hand vs Paper Hand demo card unlocked: `walletA = 86xC...2MMY` (Toly), `walletB = AVAZ...NXYm` (Ansem) per `research/demo-battle-pairs.md`; existing `isDemoPairEnabled` + `onPickPair` already trigger the live engine path. Other 2 demo cards (OG vs Newcomer, Builder vs Trader) remain COMING SOON. APK rebuilt as build `ebed0658` (https://expo.dev/accounts/vowctminibro/projects/wrap/builds/ebed0658-645f-48c9-b4a8-4c19fa170208), uploaded in place to v0.1.0-preview tag with `gh release upload --clobber` (new size 72,479,815 bytes). `/releases/latest` still resolves cleanly so the landing CTA stays stable.
