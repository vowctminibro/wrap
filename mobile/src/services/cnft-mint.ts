// cNFT mint service.
//
// Production path:
//   1. Capture the user's card View as a 1080×1080 PNG.
//   2. Construct off-chain metadata JSON (name, image, attributes).
//   3. Call mpl-bubblegum mintV1 against the configured Merkle tree on
//      devnet. The user's MWA-connected wallet pays gas and is the leaf
//      owner; tree authority signing happens server-side in production.
//   4. Return { signature, assetId } — assetId is computed from the
//      tree + leaf nonce per Bubblegum spec.
//
// Demo / stub path:
//   When EXPO_PUBLIC_MERKLE_TREE_PUBKEY is missing or starts with "stub_"
//   (no devnet SOL — see BLOCKERS B-002), we still capture the card so
//   the user has an artifact, but we return a deterministic fake
//   signature instead of submitting on-chain. The UI flow is identical
//   either way; this lets the demo run end-to-end without devnet funding.
//
// Future work:
//   • Image hosting (Pinata / NFT.Storage / Arweave) — see B-003 below
//     for why we're shipping an inline data-URI placeholder for now.
//   • Backend signer for treeDelegate so users can mint into the WRAP
//     team's collection without each holding tree authority — see
//     BLOCKERS for the production architecture note.

import type { View } from 'react-native';
import { captureCardPng } from '../lib/share-card';
import type { CardData } from '../types';

export type MintResult = {
  signature: string;
  assetId: string;
  imageUri: string;
  via: 'live' | 'stub';
};

export type MintArgs = {
  cardData: CardData;
  walletAddress: string;
  cardView: View | number | null;
};

function getTreePubkey(): string | undefined {
  return process.env.EXPO_PUBLIC_MERKLE_TREE_PUBKEY;
}

function isLiveTreeConfigured(): boolean {
  const tree = getTreePubkey();
  if (!tree) return false;
  if (tree.startsWith('stub_')) return false;
  // Solana pubkeys are base58, 32-44 chars. Cheap sanity check.
  return tree.length >= 32 && tree.length <= 44;
}

export async function mintCardAsCNFT(args: MintArgs): Promise<MintResult> {
  // Always capture the card — gives the user something tangible even
  // when we can't transact. captureCardPng handles a null view ref by
  // throwing, which we swallow into a placeholder URI.
  let imageUri = '';
  if (args.cardView) {
    try {
      imageUri = await captureCardPng(args.cardView);
    } catch (e) {
      console.warn(`[cnft] capture failed: ${(e as Error).message}`);
    }
  }

  if (!isLiveTreeConfigured()) {
    // Demo / stub path — see B-002.
    return makeStubResult(args, imageUri);
  }

  // Live path: lazy-import the heavy Metaplex deps so the stub case
  // stays fast and the bundler doesn't choke on missing native deps.
  return await mintLive(args, imageUri);
}

function makeStubResult(args: MintArgs, imageUri: string): MintResult {
  // Deterministic stub signature derived from the wallet + card type so
  // re-mints don't accidentally collide. 88 chars matches a real base58
  // signature so UI string truncation logic doesn't behave differently.
  let h = 0;
  const seed = `${args.walletAddress}:${args.cardData.cardType}:${Date.now()}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const sigBase = `STUB${Math.abs(h).toString(36).toUpperCase()}`;
  const signature = sigBase.padEnd(88, 'X');
  const assetId = sigBase.padEnd(44, 'A');
  return { signature, assetId, imageUri: imageUri || 'placeholder://wrap-card', via: 'stub' };
}

async function mintLive(args: MintArgs, imageUri: string): Promise<MintResult> {
  // Import lazily — these only get pulled in when we actually mint.
  const { mintV1, mplBubblegum, findLeafAssetIdPda } = await import(
    '@metaplex-foundation/mpl-bubblegum'
  );
  const { publicKey, none, some } = await import('@metaplex-foundation/umi');
  const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');

  const heliusKey = process.env.EXPO_PUBLIC_HELIUS_KEY;
  const rpcUrl = heliusKey
    ? `https://devnet.helius-rpc.com/?api-key=${heliusKey}`
    : 'https://api.devnet.solana.com';

  const umi = createUmi(rpcUrl).use(mplBubblegum());

  // NOTE: signer wiring on-device requires bridging the Mobile Wallet
  // Adapter to Umi. mpl-bubblegum 5.x doesn't ship that adapter so a
  // production cut needs a small wrapper that satisfies umi's `Signer`
  // by routing signMessage / signTransaction through MWA `transact()`.
  // For the demo on the simulator we never reach this branch — the stub
  // path catches us. Real Seeker integration is logged as a Phase Polish
  // task. We deliberately throw here so a misconfigured env doesn't
  // silently skip on-chain submission and pretend it succeeded.
  throw new Error(
    'cnft-mint live path requires MWA→umi signer bridge — currently stubbed'
  );

  // Reference shape for when the bridge lands:
  /* eslint-disable @typescript-eslint/no-unreachable */
  // const merkleTree = publicKey(getTreePubkey() as string);
  // const leafOwner = publicKey(args.walletAddress);
  // const metadata = {
  //   name: `WRAP — ${args.cardData.label}`,
  //   symbol: 'WRAP',
  //   uri: imageUri,
  //   sellerFeeBasisPoints: 0,
  //   collection: none(),
  //   creators: [],
  // };
  // const builder = mintV1(umi, { merkleTree, leafOwner, metadata });
  // const tx = await builder.sendAndConfirm(umi);
  // const sigB58 = uint8ArrayToBase58(tx.signature);
  // const [assetId] = await findLeafAssetIdPda(umi, { merkleTree, leafIndex: 0 });
  // return { signature: sigB58, assetId: assetId.toString(), imageUri, via: 'live' };
}

// Keep this near the live path for when we need it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
