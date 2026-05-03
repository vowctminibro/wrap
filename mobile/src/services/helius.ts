// Helius client — wallet history, token holdings, and NFT ownership.
//
// Network split per project rules:
//   • Read calls (history / holdings / NFTs) default to MAINNET. The user's
//     real activity lives on mainnet; devnet has no meaningful Wrapped data.
//   • Wallet connect (MWA) and cNFT mint (Phase 5) target DEVNET separately
//     and are not handled in this file.
//
// Key is loaded from EXPO_PUBLIC_HELIUS_KEY. When missing we transparently
// fall back to fixtures in helius.mock.ts so the dev loop never breaks.

import * as Mock from './helius.mock';

export type Network = 'mainnet' | 'devnet';

export type EnhancedTransaction = {
  signature: string;
  timestamp: number; // unix seconds
  type: string; // SWAP, TRANSFER, NFT_MINT, ...
  source: string;
  fee: number;
  feePayer: string;
  description?: string;
  events?: Record<string, unknown>;
  tokenTransfers?: Array<{
    fromUserAccount?: string;
    toUserAccount?: string;
    fromTokenAccount?: string;
    toTokenAccount?: string;
    tokenAmount?: number;
    mint?: string;
  }>;
  nativeTransfers?: Array<{
    fromUserAccount?: string;
    toUserAccount?: string;
    amount?: number;
  }>;
  instructions?: Array<{ programId: string }>;
};

export type DASAsset = {
  id: string;
  interface: string;
  content?: {
    metadata?: { name?: string; symbol?: string };
    files?: Array<{ uri?: string }>;
    json_uri?: string;
  };
  ownership?: { owner?: string };
  grouping?: Array<{ group_key: string; group_value: string }>;
  token_info?: {
    symbol?: string;
    decimals?: number;
    balance?: number;
    price_info?: { price_per_token?: number; total_price?: number };
    associated_token_address?: string;
  };
  compression?: { compressed?: boolean };
};

// Read lazily so Node-side scripts that load .env.local *after* import still
// see the key. In the Expo runtime this is inlined at build time anyway.
function getKey(): string | undefined {
  return process.env.EXPO_PUBLIC_HELIUS_KEY;
}

function keyMissing(): boolean {
  const k = getKey();
  return !k || k.length < 8;
}

function rpcUrl(network: Network): string {
  return `https://${network}.helius-rpc.com/?api-key=${getKey()}`;
}

// Whole-wallet asset enumeration on Toly-scale pubkeys can blow past
// the default fetch timeout on free-tier Helius. Wrap every call with
// an AbortController-driven timeout + a single retry on transient
// failures (504/502/503/429 + network/abort). Mint and Battle paths
// both flow through here; the friendly-error layer in lib/errors.ts
// swallows whatever still escapes after the retry budget is spent.

const FETCH_TIMEOUT_MS = 12_000;
const RETRY_TIMEOUT_MS = 20_000;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isAbortLike(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === 'AbortError' ||
    err.message.toLowerCase().includes('network') ||
    err.message.toLowerCase().includes('aborted') ||
    err.message.toLowerCase().includes('timeout')
  );
}

async function fetchHeliusWithRetry(
  url: string,
  init: RequestInit,
  label: string
): Promise<Response> {
  for (let attempt = 0; attempt <= 1; attempt++) {
    const timeout = attempt === 0 ? FETCH_TIMEOUT_MS : RETRY_TIMEOUT_MS;
    try {
      const res = await fetchWithTimeout(url, init, timeout);
      if (res.ok) return res;
      if (attempt === 0 && RETRYABLE_STATUSES.has(res.status)) {
        console.log(
          `[helius] retry ${label} after HTTP ${res.status} (attempt 1/1)`
        );
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === 0 && isAbortLike(err)) {
        console.log(
          `[helius] retry ${label} after abort/network (attempt 1/1):`,
          (err as Error).message
        );
        continue;
      }
      throw err;
    }
  }
  // Unreachable — the loop always exits via return/throw on attempt 1.
  throw new Error(`Helius ${label}: retry exhausted`);
}

async function rpc<T>(network: Network, method: string, params: unknown): Promise<T> {
  const res = await fetchHeliusWithRetry(
    rpcUrl(network),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'wrap',
        method,
        params,
      }),
    },
    method
  );
  if (!res.ok) {
    throw new Error(`Helius ${method} HTTP ${res.status}`);
  }
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`Helius ${method}: ${json.error.message}`);
  return json.result as T;
}

/**
 * Fetch up to `limit` parsed transactions for an address. Uses the REST
 * Enhanced Transactions endpoint which returns categorized actions
 * (SWAP, NFT_MINT, TRANSFER, etc.) — much richer than raw RPC.
 */
export async function getWalletTransactions(
  address: string,
  limit: number = 100,
  opts: { network?: Network } = {}
): Promise<EnhancedTransaction[]> {
  if (keyMissing()) return Mock.getWalletTransactions(address, limit);

  // Helius Enhanced REST API is mainnet-only. Devnet callers fall back to mocks.
  if ((opts.network ?? 'mainnet') === 'devnet') {
    return Mock.getWalletTransactions(address, limit);
  }

  const cap = Math.min(limit, 1000);
  const out: EnhancedTransaction[] = [];
  let before: string | undefined;
  // REST endpoint returns max 100 per call; page until we hit cap.
  while (out.length < cap) {
    const pageLimit = Math.min(100, cap - out.length);
    const url =
      `https://api.helius.xyz/v0/addresses/${address}/transactions` +
      `?api-key=${getKey()}&limit=${pageLimit}` +
      (before ? `&before=${before}` : '');
    const res = await fetchHeliusWithRetry(url, { method: 'GET' }, 'transactions');
    if (!res.ok) throw new Error(`Helius transactions HTTP ${res.status}`);
    const page = (await res.json()) as EnhancedTransaction[];
    if (!Array.isArray(page) || page.length === 0) break;
    out.push(...page);
    before = page[page.length - 1].signature;
    if (page.length < pageLimit) break;
  }
  return out;
}

/**
 * DAS getAssetsByOwner with showFungible — returns BOTH SPL tokens (with
 * USD price info) AND NFTs / cNFTs in one call. We split downstream.
 *
 * `pageLimit` and `maxPages` give callers a way to cap fetch size for
 * latency-sensitive paths (Battle scoring only needs ~100 assets to
 * differentiate the 4 categories; the cNFT mint and CardReveal flows
 * keep the default 1000 × 5 because card commentary benefits from full
 * enumeration).
 */
export async function getAllAssets(
  address: string,
  opts: { network?: Network; pageLimit?: number; maxPages?: number } = {}
): Promise<DASAsset[]> {
  if (keyMissing()) return Mock.getAllAssets(address);
  const network = opts.network ?? 'mainnet';
  const pageLimit = opts.pageLimit ?? 1000;
  const maxPages = opts.maxPages ?? 5;
  const out: DASAsset[] = [];
  let page = 1;
  while (true) {
    const res = await rpc<{ items: DASAsset[]; total: number }>(network, 'getAssetsByOwner', {
      ownerAddress: address,
      page,
      limit: pageLimit,
      displayOptions: { showFungible: true, showNativeBalance: false },
    });
    if (!res?.items?.length) break;
    out.push(...res.items);
    if (res.items.length < pageLimit) break;
    page += 1;
    if (page > maxPages) break;
  }
  return out;
}

export async function getTokenHoldings(
  address: string,
  opts: { network?: Network } = {}
): Promise<DASAsset[]> {
  const all = await getAllAssets(address, opts);
  return all.filter(
    (a) =>
      a.interface === 'FungibleToken' ||
      a.interface === 'FungibleAsset' ||
      !!a.token_info
  );
}

export async function getNFTsForOwner(
  address: string,
  opts: { network?: Network } = {}
): Promise<DASAsset[]> {
  const all = await getAllAssets(address, opts);
  return all.filter(
    (a) =>
      a.interface === 'V1_NFT' ||
      a.interface === 'V2_NFT' ||
      a.interface === 'ProgrammableNFT' ||
      a.interface === 'MplCoreAsset' ||
      a.compression?.compressed === true
  );
}
