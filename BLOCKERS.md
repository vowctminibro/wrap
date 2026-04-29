# WRAP — Blockers Log

Issues hit during the Day 4-9 sprint. Each entry: problem, what was tried,
and the stub / workaround applied so the sprint kept moving.

---

## B-001 · Anthropic API key missing

**Problem.** Plan specified `ANTHROPIC_API_KEY` would be at one of:
`~/.config/anthropic/api_key`, env var `ANTHROPIC_API_KEY`, or somewhere in
`~/.claude/settings.json`. None of the three exist on this machine.

**Tried.**
- `ls ~/.config/anthropic/` → directory absent
- `ls ~/.anthropic/` → absent
- `env | grep -i anthropic` → no matches
- `grep anthropic ~/.claude/settings.json` → no matches

**Workaround.** `src/services/claude.ts` falls back to
`src/services/claude.mock.ts` whenever no key is detected (lazy
`getKey()` pattern, mirrors Helius). The mock returns hand-crafted,
on-brand 15-word lines per card type from a 5-strong pool with
deterministic-yet-varied selection so the same wallet doesn't keep
producing the same output.

**To unblock for real prose**, the human can drop the key into
`mobile/.env.local`:

```
EXPO_PUBLIC_ANTHROPIC_KEY=sk-ant-...
```

…and the lazy lookup picks it up on next run. No code change required.

**Status.** Resolved by Phase 3.5 — replaced Anthropic with
Gemini-primary + Groq-fallback. Both keys provided, both free-tier.

**Note on shipping a real key in a mobile app.** Bundling
`EXPO_PUBLIC_*` keys into the Expo build inlines them into the JS bundle
— anyone who decompiles the apk can extract them. Acceptable for the
hackathon demo on Seeker; **production must put a backend proxy in front
of every LLM** (e.g. a small Cloudflare Worker that signs requests
server-side). Logged here so it isn't forgotten.

---

## B-002 · Devnet airdrop rate-limited

**Problem.** `setup-merkle-tree.ts` needs ≥0.15 SOL on devnet to
`createTree`. The configured keypair
(`6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx`, at
`~/.config/solana/devnet.json`) has 0 SOL.

**Tried.**
- `umi.rpc.airdrop(1 SOL)` via public `api.devnet.solana.com` → `Internal error`
- Same via Helius devnet RPC at 0.5 and 0.25 SOL → `403 Forbidden Rate
  limit exceeded. The devnet faucet has a limit of …`

The devnet faucet is rate-limited per IP and the limit appears
exhausted. Helius proxies the same upstream so it doesn't help.

**Workaround.**
- `cnft-mint.ts` is built with the full production code path
  (capture → compose metadata → `mintV1`) but checks for a real
  `EXPO_PUBLIC_MERKLE_TREE_PUBKEY` and a non-stub flag at runtime. When
  either is missing, it returns a deterministic stub signature so the
  demo flow (CardReveal → Mint → MintConfirm) still works end-to-end on
  the simulator and the UI is fully exercised.
- A placeholder `EXPO_PUBLIC_MERKLE_TREE_PUBKEY=stub_phase5_no_devnet_sol`
  is written to `mobile/.env.local` so the env shape is stable.

**To unblock real mint:** fund the keypair manually
- Open https://faucet.solana.com in a browser
- Paste `6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx`, request 1 SOL
- Re-run `cd ~/Projects/wrap && NODE_PATH=mobile/node_modules npx tsx scripts/setup-merkle-tree.ts`
- The script appends/replaces `EXPO_PUBLIC_MERKLE_TREE_PUBKEY` in
  `mobile/.env.local`. No code change needed; cnft-mint.ts switches to
  the live path automatically.

**Status.** Stubbed. End-to-end UX runs; on-chain behavior pending
devnet SOL.
