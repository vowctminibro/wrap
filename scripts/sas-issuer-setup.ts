// Round 5 Phase 1 — one-time SAS issuer setup + 5 demo attestations.
//
// Creates the WRAP_IDENTITY Credential + Schema on Solana devnet, then
// issues an attestation for each of the 5 known wallets in
// data/known-wallets.ts (Toly, Raj, Mert, Ansem, Sample). The result
// is a verifiable on-chain record judges can inspect on Solscan, plus
// a static map the RN client uses to render the "✓ SAS-attested
// identity" badge without doing any cryptographic work at runtime.
//
// Why a Node script and not RN client-side issuance:
//   sas-lib depends on @solana/kit which uses crypto.subtle for
//   keypair signing. RN's Hermes JS engine doesn't ship crypto.subtle
//   natively. Polyfilling it for Phase 1 was deemed too risky given
//   the time budget; live attestation issuance is deferred to Phase
//   1.5 (post-Frontier). For the hackathon judging window, "5 real
//   attestations on devnet" plus "any dev can verify with sas-lib"
//   delivers the full strategic narrative.
//
// Usage:
//   cd ~/Projects/wrap
//   npx tsx scripts/sas-issuer-setup.ts
//
// Outputs:
//   - mobile/src/services/sas/constants.ts (PDAs + program address)
//   - mobile/src/services/sas/attestations.ts (wallet → attestation PDA map)
//   - mobile/.env.local (EXPO_PUBLIC_SAS_ISSUER_PRIVATE_KEY) appended

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

import {
  address,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getAddressEncoder,
  getProgramDerivedAddress,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
  type KeyPairSigner,
} from '@solana/kit';

import {
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  getCreateAttestationInstruction,
  deriveCredentialPda,
  deriveSchemaPda,
  deriveAttestationPda,
  serializeAttestationData,
  type Schema,
} from 'sas-lib';

const REPO_ROOT = resolve(process.argv[1], '../..');
const ENV_LOCAL = resolve(REPO_ROOT, 'mobile/.env.local');
const KEYPAIR_PATH = resolve(homedir(), '.config/solana/devnet.json');

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
const WSS_URL = RPC_URL.replace('https://', 'wss://');

// SAS field types per node_modules/sas-lib/dist/src/utils.js compactLayoutMapping:
//   0=u8, 1=u16, 2=u32, 3=u64, ..., 12=String
const SCHEMA_LAYOUT = new Uint8Array([
  0, // wrap_score        (u8)
  0, // og_percentile     (u8)
  2, // wallet_age_days   (u32)
  12, // card_type         (String)
  2, // issued_at         (u32 unix ts)
  12, // wrap_version      (String)
]);
const SCHEMA_FIELD_NAMES = [
  'wrap_score',
  'og_percentile',
  'wallet_age_days',
  'card_type',
  'issued_at',
  'wrap_version',
];
const CREDENTIAL_NAME = 'WRAP_IDENTITY';
const SCHEMA_NAME = 'WRAP_IDENTITY_V1';
const SCHEMA_VERSION = 1;
const SCHEMA_DESCRIPTION =
  'WRAP wallet identity attestation — composite score, OG percentile, card type, age. v1.';

// 5 known wallets (mirror src/data/known-wallets.ts). Each gets a demo
// attestation so the RN UI can render "✓ SAS-attested identity" for
// the demo flow. wrap_score / og_percentile are deterministic stubs
// per wallet — when Phase 1.5 ships live issuance, these get replaced
// with real-time wallet-analyzer outputs.
type DemoWallet = {
  pubkey: string;
  name: string;
  card: string;
  wrap_score: number;
  og_percentile: number;
  wallet_age_days: number;
};

const DEMO_WALLETS: DemoWallet[] = [
  { pubkey: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY', name: 'Toly', card: 'OG_STATUS', wrap_score: 98, og_percentile: 1, wallet_age_days: 1700 },
  { pubkey: 'E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk', name: 'Raj', card: 'OG_STATUS', wrap_score: 95, og_percentile: 2, wallet_age_days: 1700 },
  { pubkey: '2CiBfRKcERi2GgYn83UaGo1wFaYHHrXGGfnDaa2hxdEA', name: 'Mert', card: 'BUILDER', wrap_score: 92, og_percentile: 5, wallet_age_days: 1100 },
  { pubkey: 'AVAZvHLR2PcWpDf8BXY4rVxNHYRBytycHkcB5z5QNXYm', name: 'Ansem', card: 'DIAMOND_HAND', wrap_score: 88, og_percentile: 8, wallet_age_days: 900 },
  { pubkey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', name: 'Sample', card: 'RECAP_2026', wrap_score: 75, og_percentile: 25, wallet_age_days: 600 },
];

async function loadOrGenerateIssuer(): Promise<KeyPairSigner> {
  // Reuse the existing local devnet keypair as the SAS issuer. Same
  // pattern as setup-merkle-tree.ts; saves a separate faucet round.
  // The keypair is funded (used for the Merkle tree creation) so it
  // can pay rent for Credential + Schema + 5 attestation PDAs.
  if (!existsSync(KEYPAIR_PATH)) {
    throw new Error(
      `Devnet keypair not found at ${KEYPAIR_PATH}. ` +
        `Run: solana-keygen new -o ${KEYPAIR_PATH}`
    );
  }
  const secret = JSON.parse(readFileSync(KEYPAIR_PATH, 'utf8'));
  if (!Array.isArray(secret) || secret.length !== 64) {
    throw new Error(`Malformed keypair at ${KEYPAIR_PATH} (expected 64-byte array)`);
  }
  return await createKeyPairSignerFromBytes(new Uint8Array(secret));
}

async function main() {
  console.log(`[setup] RPC: ${RPC_URL}`);
  console.log(`[setup] Loading issuer keypair…`);
  const issuer = await loadOrGenerateIssuer();
  console.log(`[setup] Issuer: ${issuer.address}`);

  const rpc = createSolanaRpc(RPC_URL);
  const rpcSubscriptions = createSolanaRpcSubscriptions(WSS_URL);
  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

  // Balance check
  const { value: balanceLamports } = await rpc.getBalance(issuer.address).send();
  const balanceSol = Number(balanceLamports) / 1_000_000_000;
  console.log(`[setup] Issuer balance: ${balanceSol.toFixed(4)} SOL`);
  if (balanceSol < 0.1) {
    throw new Error(
      `Issuer balance ${balanceSol} SOL too low. Fund with:\n` +
        `  solana airdrop 1 ${issuer.address} --url devnet\n` +
        `or transfer from ~/.config/solana/devnet.json.`
    );
  }

  // Step A — Credential PDA
  const [credentialPda] = await deriveCredentialPda({
    authority: issuer.address,
    name: CREDENTIAL_NAME,
  });
  console.log(`[setup] Credential PDA: ${credentialPda}`);

  // Skip create if already exists (idempotent re-runs).
  const credAccount = await rpc.getAccountInfo(credentialPda).send();
  if (credAccount.value) {
    console.log('[setup] Credential already exists, skipping create.');
  } else {
    console.log('[setup] Creating Credential…');
    const createCredentialIx = getCreateCredentialInstruction({
      payer: issuer,
      credential: credentialPda,
      authority: issuer,
      name: CREDENTIAL_NAME,
      signers: [issuer.address],
    });
    await sendIxs(rpc, sendAndConfirm, issuer, [createCredentialIx]);
  }

  // Step B — Schema PDA
  const [schemaPda] = await deriveSchemaPda({
    credential: credentialPda,
    name: SCHEMA_NAME,
    version: SCHEMA_VERSION,
  });
  console.log(`[setup] Schema PDA: ${schemaPda}`);

  const schemaAccount = await rpc.getAccountInfo(schemaPda).send();
  if (schemaAccount.value) {
    console.log('[setup] Schema already exists, skipping create.');
  } else {
    console.log('[setup] Creating Schema…');
    const createSchemaIx = getCreateSchemaInstruction({
      payer: issuer,
      authority: issuer,
      credential: credentialPda,
      schema: schemaPda,
      name: SCHEMA_NAME,
      description: SCHEMA_DESCRIPTION,
      layout: SCHEMA_LAYOUT,
      fieldNames: SCHEMA_FIELD_NAMES,
    });
    await sendIxs(rpc, sendAndConfirm, issuer, [createSchemaIx]);
  }

  // Step C — Issue 5 demo attestations.
  // We need the on-chain Schema for serialization (sas-lib's
  // serializeAttestationData reads schema.layout + schema.fieldNames).
  // Since we just created it (or it existed), construct the equivalent
  // shape locally — it's the same data we just submitted.
  const localSchema: Schema = {
    credential: credentialPda,
    name: SCHEMA_NAME,
    description: SCHEMA_DESCRIPTION,
    layout: SCHEMA_LAYOUT,
    fieldNames: encodeFieldNamesAsJoinedVecs(SCHEMA_FIELD_NAMES),
    isPaused: false,
    version: SCHEMA_VERSION,
  };

  const attestations: Array<{ wallet: string; pda: string; signature: string }> = [];
  const expirySeconds = BigInt(Math.floor(Date.now() / 1000) + 5 * 365 * 24 * 60 * 60); // 5 years

  for (const wallet of DEMO_WALLETS) {
    const walletAddr = address(wallet.pubkey);
    const [attestationPda] = await deriveAttestationPda({
      credential: credentialPda,
      schema: schemaPda,
      nonce: walletAddr,
    });
    console.log(`[setup] Attestation for ${wallet.name} (${wallet.pubkey.slice(0, 8)}…): ${attestationPda}`);

    const existing = await rpc.getAccountInfo(attestationPda).send();
    if (existing.value) {
      console.log(`[setup]   already exists, skipping.`);
      attestations.push({ wallet: wallet.pubkey, pda: attestationPda.toString(), signature: 'pre-existing' });
      continue;
    }

    const data = serializeAttestationData(localSchema, {
      wrap_score: wallet.wrap_score,
      og_percentile: wallet.og_percentile,
      wallet_age_days: wallet.wallet_age_days,
      card_type: wallet.card,
      issued_at: Math.floor(Date.now() / 1000),
      wrap_version: 'v1',
    });

    const createAttestationIx = getCreateAttestationInstruction({
      payer: issuer,
      authority: issuer,
      credential: credentialPda,
      schema: schemaPda,
      attestation: attestationPda,
      nonce: walletAddr,
      expiry: expirySeconds,
      data,
    });
    const sig = await sendIxs(rpc, sendAndConfirm, issuer, [createAttestationIx]);
    attestations.push({ wallet: wallet.pubkey, pda: attestationPda.toString(), signature: sig });
  }

  // Step D — Write outputs.
  writeConstants(issuer.address, credentialPda, schemaPda);
  writeAttestationsMap(attestations);

  console.log('\n========== DONE ==========');
  console.log(`Issuer pubkey:    ${issuer.address}`);
  console.log(`Credential PDA:   ${credentialPda}`);
  console.log(`Schema PDA:       ${schemaPda}`);
  console.log('Attestations:');
  for (const a of attestations) {
    console.log(`  ${a.wallet}  →  ${a.pda}  (${a.signature.slice(0, 12)}…)`);
  }
  console.log('\nSee mobile/src/services/sas/constants.ts for hardcoded outputs.');
  console.log('Verify any attestation on Solscan:');
  console.log(`  https://solscan.io/account/${attestations[0]?.pda}?cluster=devnet`);
}

async function sendIxs(
  rpc: ReturnType<typeof createSolanaRpc>,
  sendAndConfirm: ReturnType<typeof sendAndConfirmTransactionFactory>,
  payer: KeyPairSigner,
  instructions: Array<{ programAddress: Address; accounts: ReadonlyArray<unknown>; data: Uint8Array | undefined }>
): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(payer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m) => appendTransactionMessageInstructions(instructions as any, m)
  );
  const signed = await signTransactionMessageWithSigners(message);
  await sendAndConfirm(signed, { commitment: 'confirmed' });
  return getSignatureFromTransaction(signed);
}

// SAS encodes fieldNames as a joined Vec<u8> with each name length-prefixed.
// Mirrors the splitJoinedVecs decoder in sas-lib's utils.js — round-trip safe.
function encodeFieldNamesAsJoinedVecs(names: string[]): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  for (const n of names) {
    const bytes = enc.encode(n);
    // 4-byte LE length prefix per Borsh Vec<u8> convention
    const len = new Uint8Array(4);
    new DataView(len.buffer).setUint32(0, bytes.length, true);
    parts.push(len);
    parts.push(bytes);
  }
  const total = parts.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function writeConstants(
  issuerPubkey: Address,
  credentialPda: Address,
  schemaPda: Address
) {
  const dir = resolve(REPO_ROOT, 'mobile/src/services/sas');
  const path = resolve(dir, 'constants.ts');
  const content = `// Auto-generated by scripts/sas-issuer-setup.ts — do not edit by hand.
// Re-run the script to regenerate. Schema layout + field names live
// in the script for ease of cross-reference; matched at runtime by
// sas-lib's serialize/deserialize layer.

export const SAS_PROGRAM_ID = '22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG';
export const SAS_NETWORK = 'devnet';

export const SAS_ISSUER_PUBKEY = '${issuerPubkey}';
export const SAS_CREDENTIAL_PDA = '${credentialPda}';
export const SAS_SCHEMA_PDA = '${schemaPda}';

export const SAS_SCHEMA_NAME = 'WRAP_IDENTITY_V1';
export const SAS_SCHEMA_VERSION = 1;

// Helpful URLs for README + judges:
export const sasSchemaSolscanUrl = (pda: string = SAS_SCHEMA_PDA) =>
  \`https://solscan.io/account/\${pda}?cluster=devnet\`;
export const sasAttestationSolscanUrl = (pda: string) =>
  \`https://solscan.io/account/\${pda}?cluster=devnet\`;
`;
  writeFileSync(path, content);
  console.log(`[setup] Wrote ${path}`);
}

function writeAttestationsMap(
  attestations: Array<{ wallet: string; pda: string; signature: string }>
) {
  const dir = resolve(REPO_ROOT, 'mobile/src/services/sas');
  const path = resolve(dir, 'attestations.ts');
  const entries = attestations
    .map(
      (a) => `  '${a.wallet}': {
    pda: '${a.pda}',
    signature: '${a.signature}',
  },`
    )
    .join('\n');
  const content = `// Auto-generated by scripts/sas-issuer-setup.ts — do not edit by hand.
// Maps known-wallet pubkey → on-chain attestation PDA. Used by the
// CardReveal + MintConfirm "✓ SAS-attested" badge so the RN client
// renders verification UX without doing crypto operations at runtime.

export type SasAttestationRecord = {
  pda: string;
  signature: string;
};

export const SAS_ATTESTATIONS: Record<string, SasAttestationRecord> = {
${entries}
};

export function getSasAttestation(walletPubkey: string): SasAttestationRecord | null {
  return SAS_ATTESTATIONS[walletPubkey] ?? null;
}

export function hasSasAttestation(walletPubkey: string): boolean {
  return walletPubkey in SAS_ATTESTATIONS;
}
`;
  writeFileSync(path, content);
  console.log(`[setup] Wrote ${path}`);
}

main().catch((e) => {
  console.error('[setup] FAILED:', e);
  process.exit(1);
});
