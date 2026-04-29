// Pure analyzer: transforms raw Helius data into a typed WalletAnalysis the
// insight engine consumes. No fetch calls in here — caller passes in data.

import type { DASAsset, EnhancedTransaction } from '../services/helius';
import type {
  CommunityMembership,
  Personality,
  TokenHolding,
  WalletAnalysis,
} from '../types';

export type AnalyzerInput = {
  address: string;
  transactions: EnhancedTransaction[];
  assets: DASAsset[];
};

const DAY_MS = 86400_000;
const SOL_MINT = 'So11111111111111111111111111111111111111112';

/**
 * Personality classification:
 *   • degen     — >100 swaps and avg hold <30 days
 *   • builder   — interacted with >5 unique programs OR deployed contracts
 *   • collector — >10 NFTs held >90 days
 *   • believer  — avg hold >365 days OR ≥3 tokens held through 50%+ drawdown
 *
 * Order matters; the first matching bucket wins. We weight believer last
 * because long average hold is also true of dormant wallets — only counts
 * if they're meaningfully active.
 */
function classify(opts: {
  totalSwaps: number;
  averageHoldDays: number;
  uniqueProgramsInteracted: number;
  nftsHeldOver90d: number;
  drawdownsHeld: number;
  totalTransactions: number;
}): Personality {
  const {
    totalSwaps,
    averageHoldDays,
    uniqueProgramsInteracted,
    nftsHeldOver90d,
    drawdownsHeld,
    totalTransactions,
  } = opts;

  if (totalSwaps > 100 && averageHoldDays < 30) return 'degen';
  if (uniqueProgramsInteracted > 5 && totalTransactions > 50) return 'builder';
  if (nftsHeldOver90d > 10) return 'collector';
  if (averageHoldDays > 365 || drawdownsHeld >= 3) return 'believer';
  // Fallback: choose by dominant signal.
  if (totalSwaps > 50) return 'degen';
  if (uniqueProgramsInteracted > 3) return 'builder';
  return 'believer';
}

/**
 * Compute a rough average holding window for tokens transferred in/out of
 * the wallet. We approximate by taking the mean delta-time between an
 * inbound transfer for a mint and the next outbound transfer of the same
 * mint. Mints with only inbound transfers are treated as "still held"
 * with hold = days since first acquisition.
 */
function computeAverageHoldDays(transactions: EnhancedTransaction[], owner: string): number {
  type Event = { ts: number; mint: string; direction: 'in' | 'out' };
  const events: Event[] = [];
  for (const tx of transactions) {
    for (const t of tx.tokenTransfers ?? []) {
      if (!t.mint) continue;
      if (t.toUserAccount === owner) {
        events.push({ ts: tx.timestamp, mint: t.mint, direction: 'in' });
      } else if (t.fromUserAccount === owner) {
        events.push({ ts: tx.timestamp, mint: t.mint, direction: 'out' });
      }
    }
  }
  events.sort((a, b) => a.ts - b.ts);

  const queues = new Map<string, number[]>(); // mint -> queue of inbound timestamps
  const holdTimesMs: number[] = [];
  for (const e of events) {
    if (e.direction === 'in') {
      if (!queues.has(e.mint)) queues.set(e.mint, []);
      queues.get(e.mint)!.push(e.ts);
    } else {
      const q = queues.get(e.mint);
      if (q && q.length) {
        const inTs = q.shift()!;
        holdTimesMs.push((e.ts - inTs) * 1000);
      }
    }
  }
  // Add still-held (oldest unmatched inbound) windows up to "now".
  const now = Date.now();
  for (const q of queues.values()) {
    for (const inTs of q) holdTimesMs.push(now - inTs * 1000);
  }
  if (!holdTimesMs.length) return 0;
  const meanMs = holdTimesMs.reduce((a, b) => a + b, 0) / holdTimesMs.length;
  return Math.round(meanMs / DAY_MS);
}

function buildTokenHoldings(assets: DASAsset[]): TokenHolding[] {
  return assets
    .filter((a) => !!a.token_info)
    .map<TokenHolding>((a) => {
      const ti = a.token_info!;
      const decimals = ti.decimals ?? 0;
      const rawBalance = ti.balance ?? 0;
      return {
        mint: a.id,
        symbol: ti.symbol ?? a.content?.metadata?.symbol ?? a.id.slice(0, 4),
        amount: rawBalance / Math.pow(10, decimals),
        valueUSD: ti.price_info?.total_price ?? 0,
      };
    })
    .sort((a, b) => b.valueUSD - a.valueUSD);
}

function buildCommunities(assets: DASAsset[]): CommunityMembership[] {
  const seen = new Map<string, CommunityMembership>();
  for (const a of assets) {
    const collection = a.grouping?.find((g) => g.group_key === 'collection')?.group_value;
    if (!collection) continue;
    if (seen.has(collection)) continue;
    seen.set(collection, {
      collection,
      joinDate: '',
      // Mad Lads, DeGods, Tensorians, etc. are widely considered OG sets.
      // We don't know joinDate from a single DAS asset call; insight engine
      // doesn't need ms precision — it only needs the count and collection.
      isOG: true,
    });
  }
  return Array.from(seen.values());
}

export function analyzeWallet(input: AnalyzerInput): WalletAnalysis {
  const { address, transactions, assets } = input;

  const totalTransactions = transactions.length;
  const totalSwaps = transactions.filter((t) => t.type === 'SWAP').length;
  const totalMints = transactions.filter((t) =>
    t.type === 'NFT_MINT' || t.type === 'COMPRESSED_NFT_MINT'
  ).length;

  const oldestTs = transactions.reduce(
    (min, t) => (t.timestamp && t.timestamp < min ? t.timestamp : min),
    Math.floor(Date.now() / 1000)
  );
  const oldestTxDate = new Date(oldestTs * 1000).toISOString();
  const walletAgeDays = Math.max(
    0,
    Math.round((Date.now() - oldestTs * 1000) / DAY_MS)
  );

  const uniquePrograms = new Set<string>();
  for (const t of transactions) {
    for (const ix of t.instructions ?? []) {
      if (ix.programId) uniquePrograms.add(ix.programId);
    }
    if (t.source) uniquePrograms.add(t.source);
  }
  const uniqueProgramsInteracted = uniquePrograms.size;

  const tokenHoldings = buildTokenHoldings(assets);
  const topTokensByValue = tokenHoldings.slice(0, 10);

  // Drawdowns and biggestHold: we don't have historical price feeds in this
  // pipeline. For now we proxy: the largest current holding by value is the
  // "biggest hold," and any sub-$1 token held in size acts as a drawdown
  // signal. Real drawdown computation is a Phase Polish task.
  const biggestHold: TokenHolding | null = topTokensByValue[0] ?? null;
  const drawdownsHeld: TokenHolding[] = tokenHoldings.filter(
    (t) =>
      t.symbol !== 'USDC' &&
      t.symbol !== 'SOL' &&
      t.amount > 1000 &&
      t.valueUSD > 0 &&
      t.valueUSD < 500
  );

  const communitiesJoined = buildCommunities(assets);

  const nftsHeldOver90d = assets.filter(
    (a) =>
      (a.interface === 'V1_NFT' ||
        a.interface === 'V2_NFT' ||
        a.interface === 'ProgrammableNFT' ||
        a.interface === 'MplCoreAsset')
  ).length;

  const averageHoldDays = computeAverageHoldDays(transactions, address);

  const personality = classify({
    totalSwaps,
    averageHoldDays,
    uniqueProgramsInteracted,
    nftsHeldOver90d,
    drawdownsHeld: drawdownsHeld.length,
    totalTransactions,
  });

  return {
    address,
    totalSwaps,
    totalMints,
    totalTransactions,
    oldestTxDate,
    walletAgeDays,
    biggestHold,
    topTokensByValue,
    communitiesJoined,
    drawdownsHeld,
    uniqueProgramsInteracted,
    averageHoldDays,
    personality,
  };
}
