// Seed leaderboard with 3 fake battles on first launch so judges
// never see an empty state. Real battles append on top. The seeded
// flag (wrap:battles:seeded) prevents duplicate inserts across launches.
//
// `clearHistory()` wipes records but leaves the flag set, which is the
// intended dev shortcut to verify the empty state — re-seeding only
// happens after a full storage wipe (e.g., `pm clear com.wrap.app`).
//
// TODO: replace with real pubkeys from research/demo-battle-pairs.md
// once the demo pair audit is finalized.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { appendBattle, type BattleHistoryRecord } from '../services/battleHistory';

const SEEDED_FLAG_KEY = 'wrap:battles:seeded';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function buildSeeds(): BattleHistoryRecord[] {
  const now = Date.now();
  return [
    {
      id: 'seed-anatoly-vs-trader',
      timestamp: now - 2 * HOUR_MS,
      winnerPubkey: 'AnatolyDvCsBfLPVGzvhEYkEEr5pNw7yTbmH3WkmSUZHZJ',
      loserPubkey: '5pK1nGQpmXh6vaJ8BcLMNeQuCMK4F2yL7XR8Uh3wA9zT',
      finalScore: { a: 3, b: 1 },
      rounds: [
        { cardType: 'diamond_hand', aScore: 8.4, bScore: 3.2, winner: 'a' },
        { cardType: 'og_status', aScore: 9.0, bScore: 4.5, winner: 'a' },
        { cardType: 'volume', aScore: 6.1, bScore: 7.4, winner: 'b' },
        { cardType: 'diversity', aScore: 8.7, bScore: 5.3, winner: 'a' },
      ],
    },
    {
      id: 'seed-builder-vs-trader',
      timestamp: now - 1 * DAY_MS,
      winnerPubkey: 'BuilderMan8VXCKp3DqRrNcJtL6Z4xV7HPsMYbT2eK9q',
      loserPubkey: 'TraderJoeBp9GwNbVmK3HfRcXqL5ZyT8eA2WpD4uJ7sE',
      finalScore: { a: 2, b: 1 },
      rounds: [
        { cardType: 'diamond_hand', aScore: 7.0, bScore: 7.2, winner: 'tie' },
        { cardType: 'og_status', aScore: 5.5, bScore: 8.1, winner: 'b' },
        { cardType: 'volume', aScore: 9.2, bScore: 4.8, winner: 'a' },
        { cardType: 'diversity', aScore: 8.0, bScore: 3.4, winner: 'a' },
      ],
    },
    {
      id: 'seed-anatoly-vs-newbie',
      timestamp: now - 3 * DAY_MS,
      winnerPubkey: 'AnatolyDvCsBfLPVGzvhEYkEEr5pNw7yTbmH3WkmSUZHZJ',
      loserPubkey: 'NewbieCo9oqKzS2MbTpL8EvRcWaHxF3DjY5VnQ1uM7iA',
      finalScore: { a: 4, b: 0 },
      rounds: [
        { cardType: 'diamond_hand', aScore: 8.4, bScore: 0.0, winner: 'a' },
        { cardType: 'og_status', aScore: 9.0, bScore: 0.5, winner: 'a' },
        { cardType: 'volume', aScore: 7.8, bScore: 1.2, winner: 'a' },
        { cardType: 'diversity', aScore: 8.7, bScore: 1.0, winner: 'a' },
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
