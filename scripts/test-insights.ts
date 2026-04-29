// Run all 3 active insights against a real WalletAnalysis and emit:
//   • Provider used per call (gemini / groq / mock)
//   • Raw output before sanitization
//   • Final sanitized output that ships to the UI
//   • Final CardData JSON
//
// Usage:
//   cd ~/Projects/wrap
//   npx tsx scripts/test-insights.ts [PUBKEY]
//
// Loads mobile/.env.local so EXPO_PUBLIC_HELIUS_KEY, EXPO_PUBLIC_GEMINI_KEY,
// EXPO_PUBLIC_GROQ_KEY are available. Falls back to mocks for missing keys.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getAllAssets, getWalletTransactions } from '../mobile/src/services/helius';
import { analyzeWallet } from '../mobile/src/lib/wallet-analyzer';
import {
  generateAllInsights,
  type InsightTrace,
} from '../mobile/src/lib/insight-engine';

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

  const t0 = Date.now();
  const [transactions, assets] = await Promise.all([
    getWalletTransactions(pk, 200),
    getAllAssets(pk),
  ]);
  const analysis = analyzeWallet({ address: pk, transactions, assets });
  console.error(`[wrap] analysis ready in ${Date.now() - t0}ms`);

  const trace: InsightTrace[] = [];
  const insights = await generateAllInsights(analysis, trace);
  console.error(`[wrap] insights ready in ${Date.now() - t0}ms total`);
  console.error('');

  for (const t of trace) {
    console.error(`[${t.cardType}] provider=${t.provider}`);
    console.error(`[${t.cardType}]    raw: ${t.raw}`);
    console.error(`[${t.cardType}]  final: ${t.line}`);
    console.error('');
  }

  process.stdout.write(JSON.stringify(insights, null, 2) + '\n');
}

main().catch((err) => {
  console.error('[wrap] FAILED:', err);
  process.exit(1);
});
