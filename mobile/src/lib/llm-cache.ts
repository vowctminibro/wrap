// Quota-aware insight cache.
//
// LLM-generated card prose is stable for a given (wallet, cardType,
// day-of-year) tuple — the user's wallet history doesn't shift enough
// in one day to make a new line warranted. Caching across app restarts
// means re-opens, judge re-taps, and demo retakes don't burn fresh
// quota every time.
//
// Backed by AsyncStorage (survives app restarts; one row per cache key).
// 24h TTL is a defensive safety net on top of the day-of-year keying
// — clock-skew or timezone weirdness can't keep a stale entry alive
// past a day.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Provider } from '../services/llm';

export type InsightSource = Provider | 'mock';

export type CachedInsight = {
  prose: string;
  generatedAt: number; // unix ms
  source: InsightSource;
};

const TTL_MS = 24 * 60 * 60 * 1000;
const KEY_PREFIX = 'wrap:insight:';

function dayOfYearUTC(): number {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 1);
  return Math.floor((now.getTime() - start) / 86_400_000);
}

function makeKey(walletPubkey: string, cardType: string): string {
  // Composite, deterministic, human-readable for debugging. AsyncStorage
  // accepts arbitrary string keys, no need to hash.
  return `${KEY_PREFIX}${cardType}:${walletPubkey}:${dayOfYearUTC()}`;
}

export async function getCachedInsight(
  walletPubkey: string,
  cardType: string
): Promise<CachedInsight | null> {
  try {
    const raw = await AsyncStorage.getItem(makeKey(walletPubkey, cardType));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedInsight;
    if (
      typeof parsed.prose !== 'string' ||
      typeof parsed.generatedAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() - parsed.generatedAt > TTL_MS) {
      // Stale entry — best-effort delete so the row doesn't linger.
      AsyncStorage.removeItem(makeKey(walletPubkey, cardType)).catch(() => {});
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedInsight(
  walletPubkey: string,
  cardType: string,
  value: CachedInsight
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      makeKey(walletPubkey, cardType),
      JSON.stringify(value)
    );
  } catch {
    // Cache writes are best-effort; never let a storage error reach
    // the UI path.
  }
}

/**
 * Clear every cached insight (across all wallets / card types / days).
 * Used by a "Regenerate" affordance if we add one in a later phase.
 */
export async function clearAllInsights(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const insightKeys = keys.filter((k) => k.startsWith(KEY_PREFIX));
    if (insightKeys.length > 0) {
      await AsyncStorage.multiRemove(insightKeys);
    }
  } catch {
    // best-effort
  }
}
