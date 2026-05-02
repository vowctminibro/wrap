// Seed leaderboard with 3 fake battles on first launch so judges
// never see an empty state. Real battles append on top. The seeded
// flag (wrap:battles:seeded) prevents duplicate inserts across launches.
//
// `clearHistory()` wipes records but leaves the flag set, which is the
// intended dev shortcut to verify the empty state — re-seeding only
// happens after a full storage wipe (e.g., `pm clear app.wrap.mobile`).
//
// Pubkeys: verified mainnet addresses from research/demo-battle-pairs.md
// (Hermes audit, commit f17ba27). Toly + Raj + Mert + Ansem all have
// recent on-chain activity within the 60-day recency cutoff. Judges
// land on Leaderboard and see recognizable Solana ecosystem matchups.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { appendBattle, type BattleHistoryRecord } from '../services/battleHistory';

const SEEDED_FLAG_KEY = 'wrap:battles:seeded';

const HOUR_MS = 60 * 60 * 1000;

// Verified mainnet pubkeys (research/demo-battle-pairs.md, f17ba27)
const TOLY = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY'; // Anatoly Yakovenko, toly.sol
const RAJ = 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk'; // Raj Gokal, gokal.sol
const MERT = '2CiBfRKcERi2GgYn83UaGo1wFaYHHrXGGfnDaa2hxdEA'; // Mert Mumtaz, mert.sol
const ANSEM = 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm'; // Ansem, @blknoiz06

function buildSeeds(): BattleHistoryRecord[] {
  const now = Date.now();
  return [
    // Pair 1 — Solana co-founders. Headliner pairing for judges.
    {
      id: 'seed-toly-vs-raj',
      timestamp: now - 4 * HOUR_MS,
      winnerPubkey: TOLY,
      loserPubkey: RAJ,
      finalScore: { a: 3, b: 1 },
      rounds: [
        { cardType: 'diamond_hand', aScore: 8.5, bScore: 6.0, winner: 'a' },
        { cardType: 'og_status', aScore: 10.0, bScore: 9.5, winner: 'a' },
        { cardType: 'volume', aScore: 8.2, bScore: 5.4, winner: 'a' },
        { cardType: 'diversity', aScore: 6.1, bScore: 7.8, winner: 'b' },
      ],
    },
    // Pair 2 — founder vs ecosystem. Toly dominant, one diversity tie.
    // (Final 3-0 with a tie round; see PROGRESS.md and the engine's
    // finalScore semantics — ties don't score for either side.)
    {
      id: 'seed-toly-vs-mert',
      timestamp: now - 8 * HOUR_MS,
      winnerPubkey: TOLY,
      loserPubkey: MERT,
      finalScore: { a: 3, b: 0 },
      rounds: [
        { cardType: 'diamond_hand', aScore: 8.5, bScore: 4.2, winner: 'a' },
        { cardType: 'og_status', aScore: 10.0, bScore: 7.5, winner: 'a' },
        { cardType: 'volume', aScore: 9.0, bScore: 8.7, winner: 'a' },
        { cardType: 'diversity', aScore: 6.5, bScore: 6.5, winner: 'tie' },
      ],
    },
    // Pair 3 — builder vs trader. Card shapes diverge sharply.
    {
      id: 'seed-mert-vs-ansem',
      timestamp: now - 24 * HOUR_MS,
      winnerPubkey: MERT,
      loserPubkey: ANSEM,
      finalScore: { a: 3, b: 1 },
      rounds: [
        { cardType: 'diamond_hand', aScore: 7.8, bScore: 3.2, winner: 'a' },
        { cardType: 'og_status', aScore: 8.5, bScore: 6.0, winner: 'a' },
        { cardType: 'volume', aScore: 7.5, bScore: 9.6, winner: 'b' },
        { cardType: 'diversity', aScore: 8.9, bScore: 5.5, winner: 'a' },
      ],
    },
  ];
}

export async function seedHistoryIfNeeded(): Promise<void> {
  try {
    const flag = await AsyncStorage.getItem(SEEDED_FLAG_KEY);
    if (flag === '1') return;
    const seeds = buildSeeds();
    for (const seed of seeds) {
      await appendBattle(seed);
    }
    await AsyncStorage.setItem(SEEDED_FLAG_KEY, '1');
  } catch (e) {
    console.warn('[battle-history] seed failed', e);
  }
}
