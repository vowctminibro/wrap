// cNFT mint service — LIVE on devnet via mpl-bubblegum 5.x.
//
// Architecture:
//   • Tree was created server-side via scripts/setup-merkle-tree.ts.
//     The tree creator/delegate keypair signs every mint instruction.
//   • The mobile user (MWA wallet) is the LEAF OWNER — they receive
//     the cNFT but they're not the tree authority. The tree-authority
//     keypair is loaded into the app at build time via
//     EXPO_PUBLIC_WRAP_DELEGATE_SECRET (base64 64-byte secret) and
//     attached as the umi identity.
//
//   • SECURITY NOTE: bundling the delegate secret into the app bundle
//     leaks it to anyone who decompiles the apk. This is **only**
//     acceptable because the tree is on devnet and devnet SOL is
//     valueless. The tree can be rotated (re-run setup-merkle-tree.ts)
//     at any time if the secret is exposed. Production migration path
//     is a backend signer service that holds the keypair server-side
//     and exposes a sign-and-submit endpoint to the mobile app.
//
// Image hosting:
//   • Pinata JWT lands via Hermes Task 2. Until then we point cNFT
//     metadata.uri at the placeholder sentinel; on-chain mint succeeds
//     either way (bubblegum doesn't validate the URI). Real Pinata
//     wiring lights up the moment EXPO_PUBLIC_PINATA_JWT is present.

import type { View } from 'react-native';
import { captureCardPng } from '../lib/share-card';
import { uploadImageToPinata } from './pinata';
import type { CardData } from '../types';

export type MintResult = {
  signature: string;
  assetId: string;
  imageUri: string;
};

export type MintArgs = {
  cardData: CardData;
  walletAddress: string;
  cardView: View | number | null;
};

function getTreePubkey(): string | undefined {
  return process.env.EXPO_PUBLIC_MERKLE_TREE_PUBKEY;
}

function getDelegateSecret(): string | undefined {
  return process.env.EXPO_PUBLIC_WRAP_DELEGATE_SECRET;
}

function getHeliusKey(): string | undefined {
  return process.env.EXPO_PUBLIC_HELIUS_KEY;
}

function decodeBase64ToBytes(b64: string): Uint8Array {
  // RN polyfills the global Buffer via src/lib/polyfills.ts; in Node
  // tests Buffer is native. Either way Buffer.from(b64, 'base64') is
  // available where this function runs.
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export async function mintCardAsCNFT(args: MintArgs): Promise<MintResult> {
  const tree = getTreePubkey();
  const secret = getDelegateSecret();
  if (!tree || tree.startsWith('stub_')) {
    throw new Error('No live Merkle tree configured. Run scripts/setup-merkle-tree.ts.');
  }
  if (!secret) {
    throw new Error('EXPO_PUBLIC_WRAP_DELEGATE_SECRET missing — cannot sign mint.');
  }

  // Capture the card to PNG. Failure here is non-fatal: bubblegum doesn't
  // require the URI to resolve at mint time.
  let localImageUri = '';
  if (args.cardView) {
    try {
      localImageUri = await captureCardPng(args.cardView);
    } catch (e) {
      console.warn(`[cnft] capture failed: ${(e as Error).message}`);
    }
  }

  // Try to pin to IPFS; fall back to the placeholder if not configured.
  let metadataImageUri = 'placeholder://wrap-card';
  if (localImageUri) {
    try {
      const pinned = await uploadImageToPinata(localImageUri, 'wrap-card');
      if (pinned) metadataImageUri = pinned;
    } catch (e) {
      console.warn(`[cnft] pinata pin failed: ${(e as Error).message}`);
    }
  }

  // Lazy-import metaplex deps so they don't bloat the cold path.
  const bubblegum = await import('@metaplex-foundation/mpl-bubblegum');
  const umiCore = await import('@metaplex-foundation/umi');
  const umiBundle = await import('@metaplex-foundation/umi-bundle-defaults');

  const heliusKey = getHeliusKey();
  const rpcUrl = heliusKey
    ? `https://devnet.helius-rpc.com/?api-key=${heliusKey}`
    : 'https://api.devnet.solana.com';

  const umi = umiBundle.createUmi(rpcUrl).use(bubblegum.mplBubblegum());

  // Tree delegate signs as both payer and treeCreatorOrDelegate. Devnet
  // SOL → effectively free per mint.
  const delegateBytes = decodeBase64ToBytes(secret);
  const delegateSigner = umi.eddsa.createKeypairFromSecretKey(delegateBytes);
  umi.use(umiCore.keypairIdentity(delegateSigner));

  const merkleTree = umiCore.publicKey(tree);
  const leafOwner = umiCore.publicKey(args.walletAddress);

  const builder = bubblegum.mintV1(umi, {
    merkleTree,
    leafOwner,
    metadata: {
      name: `WRAP — ${args.cardData.label}`.slice(0, 32),
      symbol: 'WRAP',
      uri: metadataImageUri,
      sellerFeeBasisPoints: 0,
      collection: umiCore.none(),
      creators: [],
    },
  });
  const tx = await builder.sendAndConfirm(umi);

  // umi's signature is a Uint8Array; render base58 for Solscan.
  const signature = uint8ArrayToBase58(tx.signature);

  return {
    signature,
    // Deriving the precise leaf assetId requires reading the tree's
    // current leaf index from on-chain state. For the demo we surface
    // the tree pubkey + signature, which is enough for the user to
    // find the asset on Solscan via the tx page.
    assetId: tree,
    imageUri: metadataImageUri,
  };
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
