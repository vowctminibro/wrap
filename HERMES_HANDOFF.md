# Hermes ⇄ Claude Code Handoff

Drop browser-side results here. Fill in fields, save the file, then tell
Claude Code to "read HERMES_HANDOFF.md and continue." Anything still set
to `TODO` is treated as not-yet-done and the corresponding Claude-side
task stays stubbed.

Last updated: 2026-04-30T17:44:00+07:00

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

Account email used: TODO
Project name set in Pinata UI: WRAP

API key created (https://app.pinata.cloud/developers/api-keys):
- Key name: WRAP-hackathon
- Permissions enabled: `pinFileToIPFS`, `pinJSONToIPFS`
- Created at: TODO (ISO timestamp)

**JWT** (long string starting with `eyJ...`, only shown once — paste below):

```
TODO_JWT_HERE
```

**Gateway URL** (looks like `https://<adjective>-<adjective>-<animal>-NNN.mypinata.cloud`):

```
TODO_GATEWAY_HERE
```

**Notes:** TODO (anything quirky during signup, account verification, etc.)

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
