# WRAP — Spotify Wrapped for your Solana wallet

Connect a Solana wallet → we read its on-chain history → an LLM turns
the data into 15-word punchy "card" stories you can share to X or mint
as a cNFT.

Built for the Frontier Hackathon, runs on Solana Seeker (Mobile Wallet
Adapter), targets devnet for cNFT mints and mainnet for wallet history.

## Tech stack

- **Expo SDK 54** (TypeScript blank template, React Native 0.81, React 19)
- **Solana Mobile Wallet Adapter** for Phantom-on-Seeker connect
- **Helius** (mainnet) for Enhanced Transactions + DAS (`getAssetsByOwner`,
  `showFungible`) — a single round trip yields fungible holdings *and*
  NFTs/cNFTs with USD price info
- **Gemini 2.5 Flash** (primary) → **Groq Llama 3.3 70B** (fallback) →
  hand-crafted mock pool. 10 s timeout per provider, 15-word voice
  enforced via system prompt + post-processor
- **Metaplex `mpl-bubblegum` 5.x + `umi`** for cNFT mint scaffolding on
  devnet (Merkle tree creation script + mint plumbing)
- **`react-native-view-shot` + `expo-sharing`** for capturing the
  current card to PNG and opening the system share sheet
- **`expo-linear-gradient`**, native-stack navigation, safe-area context

## Project layout

```
~/Projects/wrap/
├── README.md                         (you are here)
├── PROGRESS.md                       sprint progress log, phase by phase
├── BLOCKERS.md                       gaps that needed stubs to keep moving
├── HERMES_HANDOFF.md                 browser-side unblock results template
├── SPRINT_REPORT.md                  generated at end of sprint
├── scripts/
│   ├── test-analyzer.ts              smoke-test Helius + analyzer
│   ├── test-insights.ts              run all 3 LLM insights, log provider
│   └── setup-merkle-tree.ts          one-time devnet tree creation
├── mobile/                           Expo app
│   ├── App.tsx                       NavigationContainer, dark theme
│   ├── .env.local                    (gitignored) Helius/Gemini/Groq/Pinata keys
│   └── src/
│       ├── screens/
│       │   ├── OnboardingScreen.tsx
│       │   ├── CardRevealScreen.tsx
│       │   ├── MintConfirmScreen.tsx
│       │   ├── CardGalleryScreen.tsx
│       │   └── DebugAnalysisScreen.tsx
│       ├── components/
│       │   ├── Card.tsx              full + mini variants
│       │   ├── PixelIcon.tsx         16×16 grid, View-per-pixel
│       │   ├── Confetti.tsx          seeded, stable
│       │   └── AffiliateButton.tsx   per-cardType partner CTA
│       ├── services/
│       │   ├── helius.ts + helius.mock.ts
│       │   ├── llm.ts + llm.mock.ts
│       │   └── cnft-mint.ts          live + stub paths
│       ├── lib/
│       │   ├── wallet.ts             MWA wrapper + shortenAddress
│       │   ├── wallet-analyzer.ts    pure analyzeWallet()
│       │   ├── insight-engine.ts     templates → LLM → CardData
│       │   ├── share-card.ts         view-shot + share sheet
│       │   └── polyfills.ts
│       ├── prompts/
│       │   ├── diamond-hand.ts
│       │   ├── og-status.ts
│       │   └── year-recap.ts
│       ├── theme/tokens.ts           single source of design truth
│       └── types/index.ts            CardData, WalletAnalysis, nav params
└── WRAP - Solana Colosseum/          original web design system (read-only)
```

## Dev setup

```bash
cd mobile
pnpm install                          # already done; idempotent
cp .env.local.example .env.local      # if a fresh clone — fill keys below
```

`.env.local` (gitignored, all `EXPO_PUBLIC_*`):

```
EXPO_PUBLIC_HELIUS_KEY=<helius mainnet key>
EXPO_PUBLIC_GEMINI_KEY=<google ai studio key>      # optional, mock fallback
EXPO_PUBLIC_GROQ_KEY=<groq key>                    # optional, mock fallback
EXPO_PUBLIC_MERKLE_TREE_PUBKEY=<from setup-merkle-tree.ts>   # stub_ prefix = demo mode
EXPO_PUBLIC_PINATA_JWT=<once Pinata is wired>
EXPO_PUBLIC_PINATA_GATEWAY=<once Pinata is wired>
```

Verify the build:

```bash
cd mobile
npx tsc --noEmit                      # 0 errors expected
npx expo-doctor                       # 17/17 checks expected
```

## Smoke tests (no device required)

From the repo root:

```bash
npx tsx scripts/test-analyzer.ts                              # default test wallet
npx tsx scripts/test-analyzer.ts <PUBKEY>                     # any pubkey

npx tsx scripts/test-insights.ts                              # all 3 cards via Gemini→Groq→mock
```

`test-insights.ts` prints provider, raw output, sanitized output, and
final `CardData[]` for prose-quality review.

## On-device demo flow

1. **Onboarding** — `Connect Wallet` → MWA `transact()` on Android, dev
   fallback pubkey on iOS / web for sim testing
2. **CardReveal** — gradient pulse loader → 3 swipeable cards (Diamond,
   OG, Recap) → bottom CTAs: `Share to 𝕏`, `Mint as NFT`, plus a
   tertiary affiliate link based on the visible card
3. **MintConfirm** — confetti + glowing mini card, `View on Solscan` and
   `Share again`. Stub-mint flows show an italic banner so the demo
   doesn't promise an on-chain tx that doesn't exist
4. **Gallery** — 7 thumbnails (3 active + 4 v2 placeholders) accessible
   from CardReveal's top-right `≡` button

## Status

This is a sprint-scaffolded build. See `PROGRESS.md` for what was
shipped, `BLOCKERS.md` for the gaps that fell back to stubs (devnet
faucet rate-limit, MWA→umi signer bridge, Pinata image hosting), and
`SPRINT_REPORT.md` for the final readiness assessment.

Demo gif: *(placeholder — record on Seeker once the Pinata + devnet SOL
unblocks land via `HERMES_HANDOFF.md`)*

## License

TBD — pending hackathon-submission requirements.
