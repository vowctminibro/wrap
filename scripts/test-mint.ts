// Node-side end-to-end mint proof — now with real Pinata image upload.
//
//   1. Read a sample card PNG from the design system as the test image.
//   2. Upload to Pinata via the JWT in mobile/.env.local — get IPFS hash.
//   3. Compose gateway URL (`${GATEWAY}/ipfs/${HASH}`).
//   4. Call mintV1 with that real URL as metadata.uri (the mobile app
//      hits the same code path; this is the canonical proof).
//   5. Print signature, IPFS hash, gateway URL, Solscan link.
//
// Usage:
//   cd ~/Projects/wrap
//   NODE_PATH=mobile/node_modules npx tsx scripts/test-mint.ts [LEAF_OWNER_PUBKEY]
//
// LEAF_OWNER_PUBKEY defaults to the dev keypair pubkey. Pass any other
// base58 pubkey to mint into a different wallet.

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
const TEST_IMAGE = resolve(
  SCRIPT_DIR,
  '../WRAP - Solana Colosseum/screenshots/02_Card_Reveal.png'
);

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

/**
 * Node-compatible Pinata pin. Mobile (RN) uses a different FormData
 * shape; we keep that in cnft-mint.ts and inline the Node variant here.
 */
async function pinImageToPinataNode(filePath: string): Promise<{
  ipfsHash: string;
  url: string;
} | null> {
  const jwt = process.env.EXPO_PUBLIC_PINATA_JWT;
  const gateway = process.env.EXPO_PUBLIC_PINATA_GATEWAY;
  if (!jwt) return null;

  const buf = readFileSync(filePath);
  const blob = new Blob([buf], { type: 'image/png' });
  const form = new FormData();
  form.append('file', blob, 'wrap-card.png');
  // Optional: add pinata metadata for searchability in their dashboard.
  form.append(
    'pinataMetadata',
    JSON.stringify({ name: 'WRAP — test card', keyvalues: { source: 'test-mint.ts' } })
  );

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Pinata HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { IpfsHash?: string };
  if (!json.IpfsHash) throw new Error('Pinata: no IpfsHash in response');
  const url = gateway
    ? `${gateway.replace(/\/$/, '')}/ipfs/${json.IpfsHash}`
    : `ipfs://${json.IpfsHash}`;
  return { ipfsHash: json.IpfsHash, url };
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

  if (!existsSync(KEYPAIR_PATH)) {
    throw new Error(`keypair not found at ${KEYPAIR_PATH}`);
  }
  const secret = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  const signer = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
  umi.use(keypairIdentity(signer));
  console.log(`[wrap] payer / tree authority: ${signer.publicKey}`);

  const leafOwnerArg = process.argv[2] ?? signer.publicKey.toString();
  const leafOwner = publicKey(leafOwnerArg);
  console.log(`[wrap] leaf owner: ${leafOwner}`);
  console.log(`[wrap] tree:       ${treePubkey}`);

  // 1. Pin the design screenshot to Pinata.
  let metadataUri = 'placeholder://wrap-card';
  let ipfsHash: string | undefined;
  if (existsSync(TEST_IMAGE)) {
    console.log(`[wrap] uploading ${TEST_IMAGE} to Pinata…`);
    const pinT0 = Date.now();
    const pin = await pinImageToPinataNode(TEST_IMAGE);
    if (pin) {
      ipfsHash = pin.ipfsHash;
      metadataUri = pin.url;
      console.log(
        `[wrap] ✓ pinned in ${Date.now() - pinT0}ms — ipfs hash: ${pin.ipfsHash}`
      );
      console.log(`[wrap]   url: ${pin.url}`);
    } else {
      console.log(`[wrap] no PINATA_JWT — using placeholder URI`);
    }
  } else {
    console.warn(`[wrap] test image missing at ${TEST_IMAGE}; using placeholder`);
  }

  // 2. Build a realistic CardData fixture.
  const cardData = {
    label: 'Diamond Hand',
    cardType: 'diamond',
    line: 'You held BONK through three 80% drawdowns. Iron stomach.',
  };

  // 3. Mint with the real metadata.uri.
  const builder = mintV1(umi, {
    merkleTree: publicKey(treePubkey),
    leafOwner,
    metadata: {
      name: `WRAP — ${cardData.label}`.slice(0, 32),
      symbol: 'WRAP',
      uri: metadataUri,
      sellerFeeBasisPoints: 0,
      collection: none(),
      creators: [],
    },
  });

  console.log(`[wrap] sending mint transaction…`);
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
        ipfsHash,
        metadataUri,
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
