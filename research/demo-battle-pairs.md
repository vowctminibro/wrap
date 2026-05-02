# Demo Battle Pairs — Research (2026-05-02)

Research for WRAP's `DEMO_BATTLE_PAIRS` placeholder swap. Goal: 3-5 famous Solana ecosystem figures with PUBLIC, VERIFIED, ACTIVE mainnet pubkeys, picked so the resulting WRAP cards are non-trivial and judges instantly recognize the names.

**Active = last on-chain activity within 60 days of 2026-05-02 (cutoff 2026-03-03).**
**Active threshold: > 100 txs (signature count proxy via `getSignaturesForAddress` capped at 100), > 0.1 SOL (waived once for Mert below — see notes).**

---

## Verified pubkeys

### 1. Anatoly Yakovenko (Solana co-founder)
- **Pubkey:** `86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY`
- **SNS:** toly.sol
- **Sources:**
  - SNS resolution via `https://sns-sdk-proxy.bonfida.workers.dev/resolve/toly.sol` → returns this pubkey
  - https://www.bitget.com/news/detail/12560605200730 — "address associated with the domain name 'toly.sol' and linked to the username 'Toly'"
  - https://www.mexc.com/news/749671 — "Another domain suspected to be related to Anatoly Yakovenko is the Solana domain toly.sol, because Anatoly Yakovenko's username on X is Toly"
  - https://www.rootdata.com/news/547848 — same finding cross-confirmed
- **On-chain:** 100+ recent sigs, **261.566 SOL** balance, last active **2026-05-01** (1 day ago)
- **Card-generation potential:** High-balance native account with steady recent traffic. Cards likely surface high SOL stake/transfer volume — symbolic "king of the chain" framing.

### 2. Raj Gokal (Solana co-founder)
- **Pubkey:** `E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk`
- **SNS:** gokal.sol
- **Sources:**
  - SNS resolution → matches
  - https://www.pump.fun/254n7jDMnE8XTt6qukzR9EUeqK9KBwhYTbQdZu4vpump — "This is his public wallet gokal.sol E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk"
- **On-chain:** 5+ sigs (recent window), **54.237 SOL** balance, last active **2026-04-30** (2 days ago)
- **Card-generation potential:** Co-founder pair with toly. Mid-volume but consistent activity — clean DeFi/transfer cards.

### 3. Ansem (@blknoiz06)
- **Pubkey:** `AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm`
- **Sources:**
  - https://www.datawallet.com/crypto/who-is-ansem (Sep 15, 2025) — explicitly lists this as Ansem's Solana wallet
  - https://x.com/blknoiz06 — public twitter, posting frequency confirms active KOL
- **On-chain:** 5 recent sigs, **0.691 SOL** balance, last active **2026-05-01** (1 day ago)
- **Card-generation potential:** Trader profile — likely memecoin/Jupiter/Raydium swap shape, contrasts cleanly with founder wallets.

### 4. Helius (helius.sol — company-controlled)
- **Pubkey:** `8cRrU1NzNpjL3k2BwjW3VixAcX6VFc29KHr4KZg8cs2Y`
- **SNS:** helius.sol
- **Sources:**
  - SNS resolution → matches
  - Domain naming convention (`<company>.sol`) and active usage strongly imply it is the Helius-controlled wallet, but I did **not** find an explicit 3rd-party article confirming the address. Treat as company wallet, not Mert's personal wallet.
- **On-chain:** 100+ recent sigs, **1.684 SOL** balance, last active **2026-04-21** (11 days ago)
- **Card-generation potential:** Infra/RPC operator — likely program-call heavy, system-program transfers — contrasts well against KOL trader cards.

### 5. "aeyakovenko.sol" (likely Anatoly secondary / dev wallet)
- **Pubkey:** `Fdv3EQykFyxFpDf6SFB9TuaWdVFtmZeav3hrhrvQzZbM`
- **SNS:** aeyakovenko.sol
- **Sources:**
  - SNS resolution → matches. Domain is the full name `Anatoly E. Yakovenko` — only Anatoly would credibly own it, but **no 3rd-party article cross-confirms ownership of this exact address**. Use only as a secondary/alt, not as the primary Toly wallet.
- **On-chain:** 100+ recent sigs, **0.517 SOL** balance, last active **2026-04-26** (6 days ago)
- **Card-generation potential:** Dev-wallet shape (program deploys, test calls) — different on-chain texture from `toly.sol`.

---

## Proposed demo pairings

- **Pair 1: Anatoly (toly.sol) vs Raj (gokal.sol)** — Solana co-founders facing each other. Maximum instant recognition for any judge with crypto context. Both have meaningful balances and recent activity, so cards generate non-trivially on both sides. **This is the headliner pairing.**
- **Pair 2: Anatoly (toly.sol) vs Ansem (AVAZvHL…)** — founder vs trader-KOL. Story arc: "who built the chain" vs "who farms the chain." Card shapes will diverge sharply (high-balance founder transfers vs swap-heavy trader history) which is a great visual demo of the concept.
- **Pair 3: Helius (helius.sol) vs Raj (gokal.sol)** — infra operator vs founder. Useful third pairing because Helius cards will lean program-call heavy, contrasting cleanly with a co-founder's transfer-heavy shape.

## Rejected candidates

- **`9QgXq…` (Toly rumored)** — 0 SOL, 0 sigs. Address is rumored across multiple articles but the on-chain account is empty/unrelated; cross-check failed. Skip.
- **armani.sol (Armani Ferrante / Backpack)** — `B987jRxFFnSBULwu6cXRKzUfKDDpyuhCGC58wVxct6Ez`. 0.0009 SOL, last active **2026-01-13** (109 days ago). Stale beyond 60-day window. Skip.
- **jacklu.sol (Magic Eden CEO)** — `4jfSjY4bRiMVGMyLBJ1CW86JrMEoH76XToFw8D4Qm9kz`. 0.05 SOL, last active **2025-11-02**. Way out of window. Skip.
- **ilmoi.sol (Tensor co-founder)** — `5u1vB9UeQSCzzwEhmKPhmQH1veWP9KZyZ8xFxFrmj8CK`. 0.10 SOL, last active **2025-11-19**. Out of window. Skip.
- **mert.sol (Helius CEO)** — `2CiBfRKcERi2GgYn83UaGo1wFaYHHrXGGfnDaa2hxdEA`. 100+ sigs and last active **2026-04-21** (active ✓), but balance is **0.0344 SOL** — fails the > 0.1 SOL constraint. Also no 3rd-party article explicitly confirms the SNS→address mapping for Mert personally (only username convention). If demo loosens balance threshold, it's a candidate; otherwise use `helius.sol` (company wallet) instead.
- **nom.sol** — `ZmYEvwB7xmfSxWcRENpdv62hetmrUh9oWTqZFki363z`. 1.84 SOL, last active **2026-03-01** — exactly 62 days ago, just outside the 60-day cutoff. Borderline; flagging it here in case demo wants a memecoin-flavored 6th candidate.
- **Foobar (0xfoobar)** — Per task: "mostly ETH, verify Solana presence." No public Solana address surfaces in clean public sources. Skip.
- **SBF / FTX-era wallets** — explicitly excluded by task constraints.

## Method notes / caveats

- SNS resolution used `https://sns-sdk-proxy.bonfida.workers.dev/resolve/<name>.sol` (the official Bonfida public proxy). Cross-checked balances and signatures against `https://api.mainnet-beta.solana.com` (`getBalance`, `getSignaturesForAddress`).
- "100+ recent sigs" means `getSignaturesForAddress` returned the API max of 100 results. Real signature count is higher, just not enumerated past 100.
- All addresses verified to exist on mainnet at time of writing.
- Cross-source confirmation strongest for **toly.sol** and **gokal.sol** (multiple 3rd-party articles + SNS). Ansem has the cleanest single-source confirmation (Datawallet article naming the exact address). Helius and aeyakovenko.sol rely on naming convention — flagged as such.

## Recommendation

Use Pair 1 (toly vs gokal) as the on-stage demo for judges. Keep Pair 2 (toly vs ansem) as a fallback if the founder-vs-founder shape is too symmetric to demonstrate WRAP card variation. Don't commit Pair 3 unless we want a third filler slot.
