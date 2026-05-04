// Round 5 Phase 1 — verification helper for judges + devs.
//
// Pulls + decodes a WRAP_IDENTITY attestation from Solana devnet and
// prints the structured payload. Demonstrates that any SAS-aware app
// can read WRAP attestations with a single SDK call.
//
// Usage:
//   NODE_PATH=mobile/node_modules npx tsx scripts/sas-verify.ts <wallet-pubkey>
//
// Example:
//   NODE_PATH=mobile/node_modules npx tsx scripts/sas-verify.ts \
//     86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY

import {
  address,
  createSolanaRpc,
  type Address,
} from '@solana/kit';
import {
  deriveAttestationPda,
  fetchMaybeAttestation,
  fetchSchema,
  deserializeAttestationData,
} from 'sas-lib';

const RPC_URL = 'https://api.devnet.solana.com';
const SAS_CREDENTIAL_PDA = 'EUoMouVtQJFhaqf3aCErWCa3gkQ9QDawjeMfe33aiwKg';
const SAS_SCHEMA_PDA = '4BAEmFLZaQE2QZAAeB64wTuLgXrWu1s1a98Wi9Aobji9';

async function main() {
  const wallet = process.argv[2];
  if (!wallet) {
    console.error('Usage: sas-verify.ts <wallet-pubkey>');
    process.exit(1);
  }
  const walletAddr = address(wallet);
  const credential = address(SAS_CREDENTIAL_PDA) as Address;
  const schemaAddr = address(SAS_SCHEMA_PDA) as Address;

  const rpc = createSolanaRpc(RPC_URL);

  const [attestationPda] = await deriveAttestationPda({
    credential,
    schema: schemaAddr,
    nonce: walletAddr,
  });
  console.log(`Attestation PDA: ${attestationPda}`);

  const attestation = await fetchMaybeAttestation(rpc, attestationPda);
  if (!attestation.exists) {
    console.log('No WRAP attestation for this wallet.');
    process.exit(0);
  }

  const schema = await fetchSchema(rpc, schemaAddr);
  const decoded = deserializeAttestationData(schema.data, Uint8Array.from(attestation.data.data));

  console.log('\nWRAP_IDENTITY attestation (decoded):');
  console.log(JSON.stringify(decoded, null, 2));
  console.log(`\nIssuer (signer):  ${attestation.data.signer}`);
  console.log(`Nonce (wallet):   ${attestation.data.nonce}`);
  console.log(`Expiry:           ${attestation.data.expiry}`);
  console.log(`\nSolscan: https://solscan.io/account/${attestationPda}?cluster=devnet`);
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
