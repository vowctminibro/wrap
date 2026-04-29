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

**Status.** Phase 3 ran end-to-end on mocks. Real-API path is wired and
will activate the moment a key appears.

**Note on shipping a real key in a mobile app.** Bundling
`EXPO_PUBLIC_ANTHROPIC_KEY` into the Expo build inlines it into the JS
bundle — anyone who decompiles the apk can extract it. Acceptable for the
hackathon demo on Seeker, but **production must put a backend proxy in
front of Anthropic** (e.g. a small Cloudflare Worker that signs requests
server-side). Logged here so it isn't forgotten.
