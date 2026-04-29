# WRAP — Pitch Deck v0

Markdown source for slide conversion via Claude Design. 10 sections,
each with a headline (≤ 8 words), 1–3 bullets (≤ 12 words each), and a
suggested visual the designer can build out.

Tone: confident, specific, no fluff. Read-back test: a panel hearing
just the headlines + visuals in a 3-minute pitch should get the value
prop without needing the bullets. Bullets are the speaker's safety net.

---

## 1 · Title

**WRAP — Spotify Wrapped for your Solana wallet**

- Built for Frontier Hackathon, native to Solana Seeker
- AI-written stories from real on-chain history, mintable as cNFTs
- One year of you, on a card you can share

**Visual.** Hero shot — gradient WRAP wordmark dropping into 3 floating
preview cards (Diamond / OG / Recap), the Onboarding screen render
from `01_Onboarding.png`, set against the near-black `#0A0A0F`
background with a soft red→violet ambient glow.

---

## 2 · Problem

**10M wallets. Zero stories told.**

- Wallets accumulate years of trades, mints, holds, communities
- That history is invisible, ungrabbable, unshareable
- No "Wrapped" moment for crypto's most active chain

**Visual.** A single anonymized Solana pubkey rendered in monospace on a
dark canvas with no other context — silent, identityless. Below it,
the same wallet rendered as a WRAP card to set up the punchline.

---

## 3 · Product

**3 card types live, 4 in v2**

- Diamond Hand · OG Status · Year Recap shipping today
- Top Tokens · Top Genre · Personality · Achievements next
- AI-generated 15-word lines from real on-chain data

**Visual.** Use `04_Card_Gallery.png` — 7-thumbnail grid showing the
3 active cards in full color and 4 v2 placeholders dimmed with a "v2"
badge. The roadmap reads itself.

---

## 4 · Demo flow

**Connect → Cards → Share → Mint.**

- Connect Phantom on Seeker via Mobile Wallet Adapter
- Helius pulls history; Gemini turns it into prose
- Share to X or mint as cNFT — both viral loops

**Visual.** 4-screen storyboard, left to right, using the existing
PNGs in `WRAP - Solana Colosseum/screenshots/`:
`01_Onboarding.png` → `02_Card_Reveal.png` → `03_Mint_Confirmation.png`
→ `04_Card_Gallery.png`. Add a thin gradient connector arrow between
each frame.

---

## 5 · Why now

**Seeker. AI. The conditions are here.**

- Seeker shipped 150K+ devices, growing
- Mobile app revenue hit $2.39B on Solana in 2025
- AI-native means lines like this are now cheap

**Visual.** Two-bar comparison chart: Seeker units shipped (2024 vs
2025) on the left; Solana mobile app revenue (2024 vs 2025) on the
right. Bars in the brand red→violet gradient. Source-cite line below.

---

## 6 · Differentiation

**Stats are flat. Stories ship.**

- solana-wrapped.app: basic numbers, no narrative
- Wallet trackers (Step, Helius dashboards): data, no soul
- WRAP: AI-written voice, mint-as-cNFT, on-Seeker native

**Visual.** 3-column comparison matrix. Rows: Narrative, Mintable,
Mobile-native, Per-card affiliate, Free tier. Columns: solana-wrapped /
trackers / WRAP. WRAP column ticks every row in solana-red.

---

## 7 · Open Source

**Insight engine: open source.**

- analyzeWallet + 3 prompt templates as a public good
- Other dApps can ship their own Wrapped in days
- License: MIT (planned, post-hackathon)

**Visual.** GitHub repo card mock for `vowctminibro/wrap` — repo
name, file tree silhouette, star count placeholder, MIT badge. Below,
3 partner-logo placeholders captioned "any of these could ship a
WRAP-powered Wrapped tomorrow."

---

## 8 · Business model

**Affiliate action, not ads.**

- Diamond Hand → Borrow without selling on MarginFi
- OG Status → Mint commemorative on Magic Eden
- Recap → Swap top token via Jupiter (referral baked in)

**Visual.** Funnel diagram. Top: 3 card types as pills. Middle: arrows
into 3 partner logos (MarginFi, Magic Eden, Jupiter). Bottom: a
single "?ref=WRAP_SOL" tag pulled out as the attribution mechanism.

---

## 9 · Founder + Stack

**Solo, non-technical, AI-native.**

- Vow · Bangkok · zero engineers, all leverage
- Stack: Claude Code · Gemini · Helius · Solana Mobile
- Browser unblocks delegated to Hermes (MCP-driven agent)

**Visual.** Centered founder photo on the left. To the right, a 4×2
logo grid: Claude · Gemini · Groq · Helius · Solana Mobile · Metaplex
· Expo · Hermes. Caption: "shipped Days 4–9 of a 9-day sprint."

---

## 10 · Ask

**Mobile Builder Grant. Public Goods.**

- Solana Mobile Builder Grant for Seeker shipping
- Public Goods funding for open-source insight engine
- 30 minutes with the Solana Foundation accelerator team

**Visual.** 3-row CTA card, each row a single ask with a one-line
qualifier and a contact link. Bottom of card: `wrap.app` placeholder
URL + Vow's handle. Background: the same primary gradient as the
Onboarding CTA so the deck closes on the same beat it opened on.
