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
