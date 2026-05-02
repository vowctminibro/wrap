// Local-first battle history persistence (Phase 1 leaderboard).
//
// AsyncStorage-backed single-array, capped at MAX_RECORDS (FIFO drop).
// All writes are fire-and-forget — failures log a warning, never throw,
// so a busted storage layer can't break the result reveal animation.
//
// Storage key: wrap:battles:history (JSON array, newest by timestamp).

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'wrap:battles:history';
const MAX_RECORDS = 50;

export type BattleHistoryRound = {
  cardType: string;
  aScore: number;
  bScore: number;
  winner: 'a' | 'b' | 'tie';
};

export type BattleHistoryRecord = {
  id: string;
  timestamp: number;
  winnerPubkey: string;
  loserPubkey: string;
  finalScore: { a: number; b: number };
  rounds: BattleHistoryRound[];
};

export async function getHistory(): Promise<BattleHistoryRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Sort by timestamp desc so insertion order doesn't matter — the
    // seed flow appends fake battles one at a time, and a real battle
    // can be persisted before seeds run on first leaderboard mount.
    return (parsed as BattleHistoryRecord[]).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  } catch (e) {
    console.warn('[battle-history] read failed', e);
    return [];
  }
}

export async function appendBattle(record: BattleHistoryRecord): Promise<void> {
  try {
    const existing = await getHistory();
    // De-dupe by id so a Result-screen re-mount can't double-write the
    // same battle. id = winnerPubkey-timestamp, so distinct battles
    // always have distinct ids.
    const filtered = existing.filter((r) => r.id !== record.id);
    const next = [record, ...filtered].slice(0, MAX_RECORDS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('[battle-history] write failed', e);
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[battle-history] clear failed', e);
  }
}
