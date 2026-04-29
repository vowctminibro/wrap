// One-time setup: create a Merkle tree on devnet for cNFT mints.
//
// Tree config: maxDepth 14, maxBufferSize 64 — capacity ~16k leaves with
// concurrent-write tolerance of 64. More than enough for the demo.
//
// Reads the user's existing devnet keypair from ~/.config/solana/devnet.json
// (per `solana config get`). Will airdrop a top-up if balance < 0.15 SOL.
//
// On success appends the tree pubkey to mobile/.env.local as
// EXPO_PUBLIC_MERKLE_TREE_PUBKEY=<pubkey>. The mobile cnft-mint service
// reads it at runtime.
//
// Usage:
//   cd ~/Projects/wrap
//   npx tsx scripts/setup-merkle-tree.ts

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

import { createTree, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import {
  generateSigner,
  keypairIdentity,
  sol,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';

const KEYPAIR_PATH = resolve(homedir(), '.config/solana/devnet.json');
// Resolve mobile/.env.local relative to this script's location so the
// command works whether you run it from the repo root or from mobile/.
const SCRIPT_DIR = resolve(process.argv[1], '..');
const ENV_LOCAL = resolve(SCRIPT_DIR, '../mobile/.env.local');
// Prefer Helius devnet (key in .env.local) — public api.devnet.solana.com
// rate-limits airdrops aggressively and often returns "Internal error".
function readEnvKey(envPath: string, name: string): string | undefined {
  if (!existsSync(envPath)) return undefined;
  for (const raw of readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line.startsWith(`${name}=`)) continue;
    return line.slice(name.length + 1).replace(/^['"]|['"]$/g, '');
  }
  return undefined;
}
const HELIUS_KEY = readEnvKey(ENV_LOCAL, 'EXPO_PUBLIC_HELIUS_KEY');
const RPC_URL = HELIUS_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_KEY}`
  : 'https://api.devnet.solana.com';
const MIN_BALANCE_SOL = 0.15;

async function main() {
  if (!existsSync(KEYPAIR_PATH)) {
    throw new Error(
      `keypair not found at ${KEYPAIR_PATH}. Run: solana-keygen new -o ${KEYPAIR_PATH}`
    );
  }
  const secret = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  if (!Array.isArray(secret) || secret.length !== 64) {
    throw new Error(`malformed keypair at ${KEYPAIR_PATH}`);
  }
  const secretBytes = new Uint8Array(secret);

  const umi = createUmi(RPC_URL).use(mplBubblegum());
  const signer = umi.eddsa.createKeypairFromSecretKey(secretBytes);
  umi.use(keypairIdentity(signer));

  console.log(`[wrap] using payer ${signer.publicKey}`);

  // Top up if needed (devnet faucet — 1 SOL per request, may rate-limit).
  const balance = await umi.rpc.getBalance(signer.publicKey);
  const balanceSol = Number(balance.basisPoints) / 1_000_000_000;
  console.log(`[wrap] balance: ${balanceSol.toFixed(4)} SOL`);
  if (balanceSol < MIN_BALANCE_SOL) {
    console.log(`[wrap] balance below ${MIN_BALANCE_SOL}, requesting airdrop…`);
    let success = false;
    for (const amount of [0.5, 0.25]) {
      try {
        await umi.rpc.airdrop(signer.publicKey, sol(amount));
        const after = await umi.rpc.getBalance(signer.publicKey);
        const afterSol = Number(after.basisPoints) / 1_000_000_000;
        console.log(`[wrap] airdrop ${amount} ok. balance: ${afterSol.toFixed(4)} SOL`);
        if (afterSol >= MIN_BALANCE_SOL) {
          success = true;
          break;
        }
      } catch (e) {
        console.warn(`[wrap] airdrop ${amount} SOL failed: ${(e as Error).message.slice(0, 120)}`);
      }
    }
    if (!success) {
      throw new Error(
        `Devnet airdrop unavailable. Fund ${signer.publicKey} manually at` +
          ` https://faucet.solana.com or run \`solana airdrop 1\` and retry.`
      );
    }
  }

  const merkleTree = generateSigner(umi);
  console.log(`[wrap] creating tree ${merkleTree.publicKey}…`);

  const builder = await createTree(umi, {
    merkleTree,
    maxDepth: 14,
    maxBufferSize: 64,
  });
  const tx = await builder.sendAndConfirm(umi);
  const sigBytes = tx.signature;
  // umi signatures are byte arrays — render the standard base58 form.
  const sigB58 = uint8ArrayToBase58(sigBytes);
  console.log(`[wrap] tree created. tx: ${sigB58}`);
  console.log(`[wrap] pubkey: ${merkleTree.publicKey}`);

  // Append to .env.local (don't clobber existing keys).
  const existing = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, 'utf8') : '';
  const cleaned = existing
    .split('\n')
    .filter((line) => !line.startsWith('EXPO_PUBLIC_MERKLE_TREE_PUBKEY='))
    .filter((line) => line.length > 0)
    .join('\n');
  const next =
    (cleaned ? cleaned + '\n' : '') +
    `EXPO_PUBLIC_MERKLE_TREE_PUBKEY=${merkleTree.publicKey}\n`;
  writeFileSync(ENV_LOCAL, next, 'utf8');
  console.log(`[wrap] saved EXPO_PUBLIC_MERKLE_TREE_PUBKEY to ${ENV_LOCAL}`);
}

// Small base58 encoder — avoids pulling another dep into a one-time script.
function uint8ArrayToBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  let n = 0n;
  for (const b of bytes) n = (n << 8n) + BigInt(b);
  let s = '';
  while (n > 0n) {
    const r = Number(n % 58n);
    n /= 58n;
    s = ALPHABET[r] + s;
  }
  return '1'.repeat(zeros) + s;
}

main().catch((err) => {
  console.error('[wrap] FAILED:', err);
  process.exit(1);
});
