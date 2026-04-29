// Smoke test: run analyzeWallet against a known Solana power-user wallet
// and print the resulting WalletAnalysis. Uses real Helius via the live
// EXPO_PUBLIC_HELIUS_KEY in mobile/.env.local.
//
// Usage:
//   cd ~/Projects/wrap
//   npx tsx scripts/test-analyzer.ts [PUBKEY]

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getAllAssets, getWalletTransactions } from '../mobile/src/services/helius';
import { analyzeWallet } from '../mobile/src/lib/wallet-analyzer';

function loadDotEnv(path: string) {
  try {
    const text = readFileSync(path, 'utf8');
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  } catch (e) {
    // No .env.local — analyzer falls back to mocks.
  }
}

async function main() {
  loadDotEnv(resolve(process.cwd(), 'mobile/.env.local'));
  const pk = process.argv[2] ?? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  console.error(`[wrap] analyzing ${pk}…`);
  const t0 = Date.now();
  const [transactions, assets] = await Promise.all([
    getWalletTransactions(pk, 200),
    getAllAssets(pk),
  ]);
  console.error(
    `[wrap] fetched ${transactions.length} txs, ${assets.length} assets in ${Date.now() - t0}ms`
  );
  const analysis = analyzeWallet({ address: pk, transactions, assets });
  // Truncate large arrays to first 5 for readability before printing.
  const truncated = {
    ...analysis,
    topTokensByValue: analysis.topTokensByValue.slice(0, 5),
    drawdownsHeld: analysis.drawdownsHeld.slice(0, 5),
    communitiesJoined: analysis.communitiesJoined.slice(0, 5),
  };
  process.stdout.write(JSON.stringify(truncated, null, 2) + '\n');
}

main().catch((err) => {
  console.error('[wrap] FAILED:', err);
  process.exit(1);
});
