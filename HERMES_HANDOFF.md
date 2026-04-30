# Hermes ⇄ Claude Code Handoff

Drop browser-side results here. Fill in fields, save the file, then tell
Claude Code to "read HERMES_HANDOFF.md and continue." Anything still set
to `TODO` is treated as not-yet-done and the corresponding Claude-side
task stays stubbed.

Last updated: 2026-04-30T18:15:00+07:00

---

## Task 1 — Devnet SOL airdrop

Wallet to fund: `6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx`
Required minimum: 1.5 SOL on devnet. Stop after the first faucet that
reaches the threshold.

Faucet attempts (in order):

| # | Faucet | Status | Amount granted | Tx hash |
|---|--------|--------|----------------|---------|
| 1 | https://faucet.solana.com | success (after 0.001 SOL mainnet seed for sybil check) | 2.5 SOL | — |
| 2 | https://www.alchemy.com/faucets/solana-devnet | not attempted | — | — |
| 3 | https://faucet.quicknode.com/solana/devnet | not attempted | — | — |
| 4 | https://solfaucet.com | not attempted | — | — |

**Final on-chain balance** (verify via
https://explorer.solana.com/address/6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx?cluster=devnet):
2.5 SOL

**Threshold met (≥ 1.5 SOL)?** yes

**Status:** complete

**Notes / anything weird** (faucet errors, captcha behavior, etc.):
faucet.solana.com required a 0.001 SOL mainnet seed first to pass sybil check, then granted 2.5 SOL devnet on first try.

---

## Task 2 — Pinata account + JWT

Account email used: vowctminibro@gmail.com
Project name set in Pinata UI: WRAP

API key created (https://app.pinata.cloud/developers/api-keys):
- Key name: WRAP-hackathon
- Permissions enabled: `pinFileToIPFS`, `pinJSONToIPFS`
- Created at: 2026-04-30T18:00:00+07:00

**API Key:** `532a92c08552e7c612cd`
**API Secret:** `bd19c44a414e0a9990c0041b282cdf7e853e2e9877d79127d75845d74b35e2fb`

**JWT** (long string starting with `eyJ...`, only shown once — paste below):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI2NGY0ZjcxYy00ODI1LTRhMDctOGMxMS03OWNlMmYzNzQzMzUiLCJlbWFpbCI6InZvd2N0bWluaWJyb0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiNTMyYTkyYzA4NTUyZTdjNjEyY2QiLCJzY29wZWRLZXlTZWNyZXQiOiJiZDE5YzQ0YTQxNGUwYTk5OTBjMDA0MWIyODJjZGY3ZTg1M2UyZTk4NzdkNzkxMjdkNzU4NDVkNzRiMzVlMmZiIiwiZXhwIjoxODA5MDkzNTQxfQ.uaWp1Q7c_btjCc5TEiYviTsyYio_WDHisfr5S3u3CZQ
```

**Gateway URL** (looks like `https://<adjective>-<adjective>-<animal>-NNN.mypinata.cloud`):

```
https://beige-capitalist-deer-104.mypinata.cloud
```

**Status:** complete ✓

**Notes:** Sign-in via Google OAuth (vowctminibro@gmail.com). Onboarding form required role/project type/discovery before dashboard access. MUI checkbox click via CDP failed (modal re-mount issue) — Vow toggled `pinFileToIPFS` + `pinJSONToIPFS` manually and pasted credentials. JWT exp=1809093541 (≈ Apr 2027, 1 year). Gateway URL still needs to be grabbed from the Pinata dashboard's "Gateways" section.

---

## What Claude Code does once these land

When `HERMES_HANDOFF.md` shows the threshold met and a real JWT, Claude
Code will:

- **Task 1 → unblock B-002 (Phase 5 cNFT mint).**
  Re-run `NODE_PATH=mobile/node_modules npx tsx scripts/setup-merkle-tree.ts`
  to actually create the Merkle tree on devnet, replace
  `EXPO_PUBLIC_MERKLE_TREE_PUBKEY` in `mobile/.env.local`, and flip
  `cnft-mint.ts` from stub to live path.

- **Task 2 → unblock B-003 (Pinata image hosting, future).**
  Append `EXPO_PUBLIC_PINATA_JWT` and `EXPO_PUBLIC_PINATA_GATEWAY` to
  `mobile/.env.local` (both are gitignored). Add a `pinFile` helper to
  `cnft-mint.ts` so the captured card PNG and metadata JSON go to IPFS
  via Pinata before the on-chain mint, replacing the
  `placeholder://wrap-card` URI.

Both `.env.local` keys stay out of git per the existing `.env*.local`
ignore rule. Verify after Claude Code edits with `git status`; flag
immediately if `mobile/.env.local` ever appears as tracked or staged.
