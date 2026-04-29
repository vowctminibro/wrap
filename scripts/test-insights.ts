// Run all 3 active insights against a real WalletAnalysis and print
// CardData JSON. Used to manually review prose quality.
//
// Usage:
//   cd ~/Projects/wrap
//   npx tsx scripts/test-insights.ts [PUBKEY]
//
// Loads mobile/.env.local so EXPO_PUBLIC_HELIUS_KEY and
// EXPO_PUBLIC_ANTHROPIC_KEY are available. Falls back to mocks for
// missing keys.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getAllAssets, getWalletTransactions } from '../mobile/src/services/helius';
import { analyzeWallet } from '../mobile/src/lib/wallet-analyzer';
import { generateAllInsights } from '../mobile/src/lib/insight-engine';
import { isMockMode } from '../mobile/src/services/claude';

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
  } catch {
    // .env.local missing — engines fall back to mocks.
  }
}

async function main() {
  loadDotEnv(resolve(process.cwd(), 'mobile/.env.local'));
  const pk = process.argv[2] ?? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  console.error(`[wrap] generating insights for ${pk}…`);
  console.error(`[wrap] Claude mode: ${isMockMode() ? 'MOCK' : 'LIVE'}`);

  const t0 = Date.now();
  const [transactions, assets] = await Promise.all([
    getWalletTransactions(pk, 200),
    getAllAssets(pk),
  ]);
  const analysis = analyzeWallet({ address: pk, transactions, assets });
  console.error(`[wrap] analysis ready in ${Date.now() - t0}ms`);

  const insights = await generateAllInsights(analysis);
  console.error(`[wrap] insights ready in ${Date.now() - t0}ms total`);

  process.stdout.write(JSON.stringify(insights, null, 2) + '\n');
}

main().catch((err) => {
  console.error('[wrap] FAILED:', err);
  process.exit(1);
});
