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
  // Optional — added in Phase 2B for replay. Records persisted before this
  // commit may not carry it; render path falls back to empty string.
  commentary?: string;
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

export type WalletStats = {
  wins: number;
  losses: number;
  total: number;
  winRate: number; // 0-100, raw — caller renders the decimal precision.
  battles: BattleHistoryRecord[]; // newest first.
};

// Pure derivation — no I/O, no side effects. Stat math stays out of the
// component so the screen only handles render concerns.
export function getWalletStats(
  history: BattleHistoryRecord[],
  pubkey: string
): WalletStats {
  const battles = history
    .filter((r) => r.winnerPubkey === pubkey || r.loserPubkey === pubkey)
    .sort((a, b) => b.timestamp - a.timestamp);
  let wins = 0;
  let losses = 0;
  for (const r of battles) {
    if (r.winnerPubkey === pubkey) wins += 1;
    else losses += 1;
  }
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  return { wins, losses, total, winRate, battles };
}
