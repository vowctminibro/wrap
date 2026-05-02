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
        {
          cardType: 'diamond_hand',
          aScore: 8.5,
          bScore: 6.0,
          winner: 'a',
          commentary:
            'Toly was here when this chain had three users. Raj came when it had three thousand.',
        },
        {
          cardType: 'og_status',
          aScore: 10.0,
          bScore: 9.5,
          winner: 'a',
          commentary:
            "Two co-founders, marginal call. Toly's address is older by months.",
        },
        {
          cardType: 'volume',
          aScore: 8.2,
          bScore: 5.4,
          winner: 'a',
          commentary:
            'Toly never stopped clicking. Raj watches. Toly executes.',
        },
        {
          cardType: 'diversity',
          aScore: 6.1,
          bScore: 7.8,
          winner: 'b',
          commentary:
            'Raj branches out. Toly stays in his lane and the lane is wide.',
        },
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
        {
          cardType: 'diamond_hand',
          aScore: 8.5,
          bScore: 4.2,
          winner: 'a',
          commentary:
            'Toly bought the dip when there was no one else around to sell to.',
        },
        {
          cardType: 'og_status',
          aScore: 10.0,
          bScore: 7.5,
          winner: 'a',
          commentary:
            'Mert has been here forever. Toly was the one who let him in.',
        },
        {
          cardType: 'volume',
          aScore: 9.0,
          bScore: 8.7,
          winner: 'a',
          commentary:
            '9.0 to 8.7. The founder out-traffics the infra guy by a hair.',
        },
        {
          cardType: 'diversity',
          aScore: 6.5,
          bScore: 6.5,
          winner: 'tie',
          commentary:
            '6.5 to 6.5. Both touch everything, neither blinks.',
        },
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
        {
          cardType: 'diamond_hand',
          aScore: 7.8,
          bScore: 3.2,
          winner: 'a',
          commentary:
            "Ansem trades like he's got a flight to catch. Mert plays the long game.",
        },
        {
          cardType: 'og_status',
          aScore: 8.5,
          bScore: 6.0,
          winner: 'a',
          commentary:
            'Mert was building when Ansem was still picking a username.',
        },
        {
          cardType: 'volume',
          aScore: 7.5,
          bScore: 9.6,
          winner: 'b',
          commentary:
            "Ansem doesn't sleep. The only thing higher than his volume is his timeline.",
        },
        {
          cardType: 'diversity',
          aScore: 8.9,
          bScore: 5.5,
          winner: 'a',
          commentary:
            'Mert touches every program on the chain. Ansem touches Jupiter.',
        },
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
