// Round 5 Phase 2 — Seeker Genesis Token detection.
//
// Solana Mobile's Genesis Token is a free, holder-style NFT/SPL token
// gifted to early Seeker buyers. WRAP detects it as identity flair —
// the holder gets a "Seeker OG" badge across the app. CRITICAL: this
// MUST NOT affect Battle scores or any gameplay surface. Pay-to-win
// perception kills WRAP's narrative; Genesis is purely cosmetic.
//
// PLACEHOLDER MINT (TODO): the official Genesis Token mint address
// wasn't published to public docs at Phase 2 build time. Hermes is
// researching in parallel and will drop the mint in HERMES_HANDOFF.md
// (TASK 1) when found. Until then `GENESIS_TOKEN_MINT` is empty, and
// `checkSeekerGenesis` short-circuits to `holds: false` without
// hitting Helius — keeps the architecture wired end-to-end while
// avoiding wasted RPC calls. When the real mint arrives, a one-line
// swap of `GENESIS_TOKEN_MINT` lights up the whole flow.

import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO(genesis-mint): replace with the real Seeker Genesis Token mint
// address once Solana Mobile publishes it (or it's confirmed via
// HERMES_HANDOFF.md TASK 1). Empty string = detection disabled, all
// wallets report holds: false.
const GENESIS_TOKEN_MINT = '';

const CACHE_KEY_PREFIX = 'wrap:seeker-genesis:';
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 min — Genesis transfers
                                           // are rare; stale-by-15min is fine.

export interface GenesisStatus {
  holds: boolean;
  balance: number;
  fetchedAt: number;
}

const FALSE_RESULT: Omit<GenesisStatus, 'fetchedAt'> = {
  holds: false,
  balance: 0,
};

/**
 * Check whether `walletPubkey` holds a Seeker Genesis Token. Cached
 * for 15 minutes per pubkey in AsyncStorage. Network failures
 * gracefully return `holds: false` so the badge UI never blocks the
 * caller's render path.
 */
export async function checkSeekerGenesis(
  walletPubkey: string
): Promise<GenesisStatus> {
  // Detection disabled (placeholder mint) — short-circuit so we don't
  // waste a Helius round trip and so judges who install before the
  // real mint lands don't see misleading false-positive RPC traffic
  // in logcat.
  if (!GENESIS_TOKEN_MINT) {
    return { ...FALSE_RESULT, fetchedAt: Date.now() };
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${walletPubkey}`;

  // Cache check
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: GenesisStatus = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_DURATION_MS) {
        return parsed;
      }
    }
  } catch {
    // Cache reads are best-effort; never block on AsyncStorage.
  }

  const heliusKey = process.env.EXPO_PUBLIC_HELIUS_KEY;
  if (!heliusKey) {
    console.warn('[seeker-genesis] EXPO_PUBLIC_HELIUS_KEY missing');
    return { ...FALSE_RESULT, fetchedAt: Date.now() };
  }

  try {
    // Use mainnet — Genesis Token lives there, not devnet.
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`;
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'wrap-genesis',
        method: 'getTokenAccountsByOwner',
        params: [
          walletPubkey,
          { mint: GENESIS_TOKEN_MINT },
          { encoding: 'jsonParsed' },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`getTokenAccountsByOwner HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      result?: {
        value: Array<{
          account: {
            data: {
              parsed: {
                info: { tokenAmount: { uiAmount: number | null } };
              };
            };
          };
        }>;
      };
      error?: { message: string };
    };

    if (json.error) {
      throw new Error(`getTokenAccountsByOwner: ${json.error.message}`);
    }

    const balance = (json.result?.value ?? []).reduce(
      (sum, acc) =>
        sum + (acc.account.data.parsed.info.tokenAmount.uiAmount ?? 0),
      0
    );

    const status: GenesisStatus = {
      holds: balance > 0,
      balance,
      fetchedAt: Date.now(),
    };

    // Best-effort cache write; never block the caller.
    AsyncStorage.setItem(cacheKey, JSON.stringify(status)).catch(() => {});

    return status;
  } catch (e) {
    console.warn(
      `[seeker-genesis] check failed for ${walletPubkey.slice(0, 8)}…:`,
      (e as Error).message
    );
    return { ...FALSE_RESULT, fetchedAt: Date.now() };
  }
}

export function isGenesisDetectionEnabled(): boolean {
  return GENESIS_TOKEN_MINT !== '';
}
