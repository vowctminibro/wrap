// Smoke test for battle-engine.
//
// Usage:
//   cd ~/Projects/wrap
//   npx tsx mobile/src/services/__tests__/battle-engine.smoke.ts
//
// Loads mobile/.env.local so EXPO_PUBLIC_HELIUS_KEY / GEMINI / GROQ are
// available. Tests:
//   1. same wallet → throws CANNOT_BATTLE_SELF (synchronous, runs anywhere)
//   2. Anatoly vs devnet sample wallet → valid BattleResult, 4 rounds
//      (needs network + LLM keys)
//   3. cache hit on second call → all rounds show provider='cache'
//      (RN-only — AsyncStorage is a no-op in plain Node, so the second
//      call re-hits the LLM; flagged as "deferred to RN runtime")

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv(path: string): void {
  try {
    const text = readFileSync(path, 'utf8');
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim().replace(/^"|"$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    // .env.local missing — let downstream fallbacks kick in.
  }
}

loadDotEnv(resolve(__dirname, '../../../.env.local'));

import { runBattle } from '../battle-engine';

const ANATOLY = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const DEVNET_WALLET = '6uRTvYnEWJNmDayu7unoyTjqCRyuENwWVUyEDjbbV8Wx';

type Outcome = 'pass' | 'fail' | 'skip';

async function test1(): Promise<Outcome> {
  console.log('TEST 1: same wallet should throw CANNOT_BATTLE_SELF');
  try {
    await runBattle(ANATOLY, ANATOLY);
    console.log('  FAIL — expected throw, got result');
    return 'fail';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'CANNOT_BATTLE_SELF') {
      console.log('  PASS');
      return 'pass';
    }
    console.log(`  FAIL — wrong error: ${msg}`);
    return 'fail';
  }
}

async function test2(): Promise<Outcome> {
  console.log('TEST 2: Anatoly vs devnet wallet returns valid BattleResult');
  try {
    const result = await runBattle(ANATOLY, DEVNET_WALLET);
    if (result.rounds.length !== 4) {
      console.log(`  FAIL — expected 4 rounds, got ${result.rounds.length}`);
      return 'fail';
    }
    if (result.walletA !== ANATOLY || result.walletB !== DEVNET_WALLET) {
      console.log('  FAIL — walletA/walletB mismatch');
      return 'fail';
    }
    if (!['A', 'B', 'tie'].includes(result.overallWinner)) {
      console.log(`  FAIL — invalid overallWinner: ${result.overallWinner}`);
      return 'fail';
    }
    console.log(
      `  PASS — overallWinner=${result.overallWinner}  score=${result.finalScore.a}-${result.finalScore.b}`
    );
    for (const r of result.rounds) {
      console.log(
        `    ${r.category.padEnd(14)} ${r.scoreA.toFixed(1).padStart(4)} vs ${r.scoreB
          .toFixed(1)
          .padStart(4)} → ${r.winner.padEnd(3)} [${r.provider}]  "${r.commentary}"`
      );
    }
    return 'pass';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  FAIL — ${msg}`);
    return 'fail';
  }
}

async function test3(): Promise<Outcome> {
  console.log("TEST 3: cache hit on second call → provider='cache' on all rounds");
  try {
    const result = await runBattle(ANATOLY, DEVNET_WALLET);
    const cachedCount = result.rounds.filter((r) => r.provider === 'cache').length;
    if (cachedCount === result.rounds.length) {
      console.log('  PASS — all 4 rounds served from cache');
      return 'pass';
    }
    const providers = result.rounds.map((r) => r.provider).join(',');
    console.log(
      `  SKIP — ${cachedCount}/${result.rounds.length} cached (providers=${providers})`
    );
    console.log(
      "         AsyncStorage is a no-op in plain Node; cache hit is verified at runtime in the RN app."
    );
    return 'skip';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`  FAIL — ${msg}`);
    return 'fail';
  }
}

async function main(): Promise<void> {
  const outcomes: Outcome[] = [];
  outcomes.push(await test1());
  outcomes.push(await test2());
  outcomes.push(await test3());

  const pass = outcomes.filter((o) => o === 'pass').length;
  const fail = outcomes.filter((o) => o === 'fail').length;
  const skip = outcomes.filter((o) => o === 'skip').length;
  console.log(`\n=== ${pass} passed / ${fail} failed / ${skip} skipped ===`);
  process.exit(fail > 0 ? 1 : 0);
}

void main();
