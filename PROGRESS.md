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
- `HELIUS_API_KEY`: **not found** — Phase 2 will use mock mode by default
  unless human supplies one
