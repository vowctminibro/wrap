# WRAP — Smoke Test Report

Run at sprint close. Goal was an end-to-end iOS-sim walkthrough. Below
is what was actually verifiable from this environment, what wasn't, and
why. Findings are split into machine-verifiable evidence and
unverifiable items that the human reviewer needs to confirm on a real
device.

---

## Environment constraints found

This Mac mini has **Command Line Tools only — no full Xcode**. As a
result:

- `xcodebuild` errors with "tool requires Xcode"
- `xcrun simctl list devices` errors with "unable to find utility simctl"
- `pod` not in PATH

That means `npx expo start --ios` cannot launch a simulator from here,
and `npx expo prebuild` + `xcodebuild` is not available either.
Additionally, `react-native-view-shot` and `expo-sharing` are native
modules **not** in Expo Go's bundled set — so even with `expo start`
+ Expo Go on a phone, the Share / Mint capture path would `Native
module not found` at tap time. A real device run requires a dev build
(prebuild + Xcode/Gradle) which this machine can't produce.

The human needs to run the on-device walkthrough on Seeker (or any
Android device with a dev build) to verify pixels and taps. What I
*could* do from here is exhaust the static + bundler-side checks —
those are below.

---

## What was verified

### ✅ Full Metro bundle compiles end-to-end (iOS target)

```
$ npx expo export --platform ios --output-dir /tmp/wrap-export-ios
…
iOS Bundled 5233ms index.ts (1689 modules)
ios bundles (1): _expo/static/js/ios/index-…hbc (4.76 MB)
Exported: /tmp/wrap-export-ios
```

1,689 modules transformed and combined into a 4.76 MB Hermes bundle
in 5.2 s with zero compile errors. This validates: every TypeScript
file in `mobile/src`, every `import` statement, every Babel transform,
asset resolution, and the entire dependency graph.

### ✅ Full Metro bundle compiles end-to-end (Android target)

```
$ npx expo export --platform android --output-dir /tmp/wrap-export-android
…
Android Bundled 4891ms index.ts (1687 modules)
android bundles (1): _expo/static/js/android/index-…hbc (4.77 MB)
```

Same 1,687-module clean bundle for the actual demo target.

### ✅ `tsc --noEmit` clean

Re-confirmed from sprint close — 0 type errors across all of `mobile/`.

### ✅ `expo-doctor` 17 / 17

Re-confirmed from sprint close — every check passes.

### ✅ Dev server boots and serves a valid bundle

```
$ npx expo start --no-dev --offline       # in background
…
Starting Metro Bundler
Waiting on http://localhost:8081
Logs for your project will appear below.

$ curl -s -o /dev/null -w "%{http_code} %{size_download}b" http://localhost:8081/
200 1570b

$ curl -s "http://localhost:8081/index.bundle?platform=ios&dev=false&minify=false"
HTTP 200 · 8.24 MB · served in 4 s
```

The bundle starts with the expected Metro preamble
(`__BUNDLE_START_TIME__`, `__DEV__`, `process.env`) and contains 446
references to React Native runtime symbols — the RN core is wired in
and the bundle would mount under the JS engine.

### ⚠️ Two non-fatal export-map warnings

Both warnings appear on iOS *and* Android bundles. Metro fell back to
file-based resolution and the modules loaded:

1. `rpc-websockets` — pulled in transitively by `@solana/web3.js`. The
   package's `exports` field doesn't list a `react-native` condition.
2. `@noble/hashes/crypto.js` — same root cause; `@noble/hashes` doesn't
   expose `./crypto.js` in its `exports`.

These resolve at runtime via legacy file-based resolution. Worth
noting because (a) future Metro versions may drop the fallback and (b)
strict resolvers could fail. **P2 — track but don't fix this sprint.**

---

## What I could not verify, and why

| Checklist item | Verifiable from here? | Why not |
|---|---|---|
| Onboarding screen renders correctly | ❌ | Need GUI output; no simulator |
| `Connect Wallet` tap behavior | ❌ | Need GUI input; no simulator |
| Helius fetch + analyze flow runs at runtime | ❌ on device, ✅ offline | Validated end-to-end via `npx tsx scripts/test-analyzer.ts` last sprint — same code path; the on-device call happens inside a working bundle |
| CardReveal renders 3 cards | ❌ | Need GUI output |
| LLM provider chain at runtime in app | ❌ on device, ✅ offline | Validated via `npx tsx scripts/test-insights.ts` last sprint |
| Swipe gesture + dot indicator | ❌ | Need GUI input |
| `Share to 𝕏` opens system share sheet | ❌ + would crash today | `expo-sharing` is a native module not in Expo Go; needs a dev build |
| `Mint as NFT` → MintConfirm with stub banner | ❌ + partially crashable | `view-shot.captureRef` is also native; same dev-build requirement |
| `View on Solscan` opens browser | ❌ | Need device browser |
| Gallery renders 7 thumbnails correctly | ❌ | Need GUI output |
| Slow-load behavior, layout issues, perf | ❌ | Need device |

**The full Mock-mode + simulator end-to-end walkthrough requested in
this task is genuinely not executable from this machine.** The right
escalation is a Seeker dev build, owned by the human.

---

## Findings (machine-verifiable layer)

### What worked

- Full app compiles for both target platforms
- Dev server boots, manifest + bundle endpoints serve clean
- Static type checking clean
- `expo-doctor` clean
- Dependency graph resolves with two cosmetic warnings

### What broke

- **Nothing at the static level.** Zero compile / type / lint errors,
  zero unresolved imports.

### Visual issues

- Cannot assess from a Metro bundle. The Card and Gallery components
  *do* use real device dp sizes (390 × 844-ish) which differ from the
  1080 × 2400 web-design canvas, so the human reviewer should
  specifically check that:
  - Card label "DIAMOND HAND" doesn't wrap awkwardly
  - 60-72 pt big stat doesn't overflow on narrow devices (we wired
    `adjustsFontSizeToFit` to defend against this — verify it's
    actually shrinking, not clipping)
  - Gallery thumbs at 48% width cells don't break grid spacing on
    iPhone SE

### Performance issues

- Cold bundle is ~8 MB (dev) / 4.77 MB (Hermes). Reasonable for a
  Solana mobile app; the umi + web3.js + bubblegum stack is the
  dominant cost. Tree-shaking is already on via `expo export`.

---

## P0 / P1 / P2 triage

- **P0 (blocks demo):** none found. All static + bundler checks pass.
- **P1 (Day 10 polish):**
  - Move to a dev build for actual demo runs — `expo prebuild` +
    `eas build` or local Xcode/Gradle on the human's box
  - Verify `view-shot` + `expo-sharing` paths on the dev build
- **P2 (cosmetic / nice-to-have):**
  - Squelch the two export-map warnings by patching call sites or
    pinning `rpc-websockets` / `@noble/hashes` versions

No P0 fix needed → no `Day 9.smoke` commit produced.

---

## Recommended next step for the human

```bash
# Once Hermes lands the unblocks (or independently):
cd ~/Projects/wrap/mobile
npx expo prebuild --platform android      # generates android/ project
npx expo run:android --device              # builds + installs on Seeker
# OR for iOS, install full Xcode, then:
npx expo prebuild --platform ios
npx expo run:ios
```

The walkthrough you wanted — connect → analyze → 3 cards → share →
mint stub → gallery — is the right test plan. The plan is ready; the
demo build environment is the missing piece, and that's a one-time
human action, not a sprint deliverable.
