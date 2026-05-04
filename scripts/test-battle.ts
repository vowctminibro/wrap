// Repro harness for Bug 2 ("Battle didn't start").
//
// Calls runBattle(walletA, walletB) end-to-end against live Helius +
// LLM, prints the actual error path, captures which layer fails.
//
// AsyncStorage is React-Native-only — we stub it via Module._resolveFilename
// before importing the engine so cache reads/writes silently no-op.
//
// Usage:
//   cd ~/Projects/wrap
//   npx tsx scripts/test-battle.ts
//   npx tsx scripts/test-battle.ts <pubkeyA> <pubkeyB>

import Module from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
  } catch {}
}

async function main() {
  loadDotEnv(resolve(__dirname, '../mobile/.env.local'));

  // AsyncStorage shim — engine cache wraps reads/writes in try/catch so
  // returning null + no-op is sufficient for a Node smoke test.
  const shimPath = resolve(__dirname, 'fake-asyncstorage.cjs');
  writeFileSync(
    shimPath,
    `module.exports = { default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined } };\n`
  );
  const realResolve = (Module as any)._resolveFilename;
  (Module as any)._resolveFilename = function (request: string, ...rest: any[]) {
    if (request === '@react-native-async-storage/async-storage') {
      return shimPath;
    }
    return realResolve.call(this, request, ...rest);
  };

  const { runBattle } = await import('../mobile/src/services/battle-engine');

  const SAMPLE = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
  const TOLY = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY';

  const walletA = process.argv[2] ?? SAMPLE;
  const walletB = process.argv[3] ?? TOLY;

  console.log(`[battle-repro] walletA=${walletA}\n[battle-repro] walletB=${walletB}`);
  console.log(`[battle-repro] env: HELIUS=${!!process.env.EXPO_PUBLIC_HELIUS_KEY} GEMINI=${!!process.env.EXPO_PUBLIC_GEMINI_KEY} GEMINI_2=${!!process.env.EXPO_PUBLIC_GEMINI_KEY_2} GROQ=${!!process.env.EXPO_PUBLIC_GROQ_KEY}`);

  const t0 = Date.now();
  try {
    const result = await runBattle(walletA, walletB);
    console.log(`\n[battle-repro] OK in ${Date.now() - t0}ms`);
    console.log(`overallWinner=${result.overallWinner} score=${result.finalScore.a}-${result.finalScore.b}`);
    for (const r of result.rounds) {
      console.log(`  ${r.category}: ${r.scoreA.toFixed(1)} vs ${r.scoreB.toFixed(1)} → ${r.winner} [${r.provider}]`);
      console.log(`    "${r.commentary}"`);
    }
  } catch (e) {
    console.error(`\n[battle-repro] FAILED in ${Date.now() - t0}ms`);
    console.error('  name:', (e as Error).name);
    console.error('  message:', (e as Error).message);
    console.error('  stack:', (e as Error).stack);
    process.exit(1);
  }
}

main();
