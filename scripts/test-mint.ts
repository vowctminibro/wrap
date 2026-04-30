// Node-side end-to-end mint proof. Loads the dev keypair, builds a
// realistic CardData fixture, calls into the same mintV1 code path
// the mobile app uses, and surfaces a real on-chain signature you can
// open on Solscan devnet.
//
// Usage:
//   cd ~/Projects/wrap
//   NODE_PATH=mobile/node_modules npx tsx scripts/test-mint.ts [LEAF_OWNER_PUBKEY]
//
// LEAF_OWNER_PUBKEY defaults to the dev keypair pubkey itself, so the
// keypair both pays gas, signs as tree delegate, and receives the leaf.
// Pass any other base58 pubkey to mint into a different wallet.

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

import { mintV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import {
  keypairIdentity,
  none,
  publicKey,
} from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';

const KEYPAIR_PATH = resolve(homedir(), '.config/solana/devnet.json');
const SCRIPT_DIR = resolve(process.argv[1], '..');
const ENV_LOCAL = resolve(SCRIPT_DIR, '../mobile/.env.local');

function loadDotEnv(path: string) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

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

async function main() {
  loadDotEnv(ENV_LOCAL);
  const treePubkey = process.env.EXPO_PUBLIC_MERKLE_TREE_PUBKEY;
  if (!treePubkey || treePubkey.startsWith('stub_')) {
    throw new Error(
      `EXPO_PUBLIC_MERKLE_TREE_PUBKEY missing/stub. Run setup-merkle-tree.ts first.`
    );
  }

  const heliusKey = process.env.EXPO_PUBLIC_HELIUS_KEY;
  const rpcUrl = heliusKey
    ? `https://devnet.helius-rpc.com/?api-key=${heliusKey}`
    : 'https://api.devnet.solana.com';

  const umi = createUmi(rpcUrl).use(mplBubblegum());

  // Use the same keypair the tree was created with — this script is
  // the canonical "tree authority signs a mint" path.
  if (!existsSync(KEYPAIR_PATH)) {
    throw new Error(`keypair not found at ${KEYPAIR_PATH}`);
  }
  const secret = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  if (!Array.isArray(secret) || secret.length !== 64) {
    throw new Error(`malformed keypair at ${KEYPAIR_PATH}`);
  }
  const signer = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
  umi.use(keypairIdentity(signer));
  console.log(`[wrap] payer / tree authority: ${signer.publicKey}`);

  const leafOwnerArg = process.argv[2] ?? signer.publicKey.toString();
  const leafOwner = publicKey(leafOwnerArg);
  console.log(`[wrap] leaf owner: ${leafOwner}`);
  console.log(`[wrap] tree:       ${treePubkey}`);

  // Realistic CardData fixture — same shape the mobile app produces.
  const cardData = {
    label: 'Diamond Hand',
    cardType: 'diamond',
    line: 'You held BONK through three 80% drawdowns. Iron stomach.',
  };

  const builder = mintV1(umi, {
    merkleTree: publicKey(treePubkey),
    leafOwner,
    metadata: {
      name: `WRAP — ${cardData.label}`.slice(0, 32),
      symbol: 'WRAP',
      uri: 'placeholder://wrap-card',
      sellerFeeBasisPoints: 0,
      collection: none(),
      creators: [],
    },
  });

  console.log(`[wrap] sending transaction…`);
  const t0 = Date.now();
  const tx = await builder.sendAndConfirm(umi);
  const sig = uint8ArrayToBase58(tx.signature);
  const elapsed = Date.now() - t0;

  console.log('');
  console.log(`[wrap] ✓ minted in ${elapsed}ms`);
  console.log(`[wrap] signature: ${sig}`);
  console.log(`[wrap] solscan:   https://solscan.io/tx/${sig}?cluster=devnet`);
  console.log('');
  process.stdout.write(
    JSON.stringify(
      {
        signature: sig,
        leafOwner: leafOwner.toString(),
        tree: treePubkey,
        cardLabel: cardData.label,
        elapsedMs: elapsed,
        solscan: `https://solscan.io/tx/${sig}?cluster=devnet`,
      },
      null,
      2
    ) + '\n'
  );
}

main().catch((err) => {
  console.error('[wrap] FAILED:', err);
  process.exit(1);
});
