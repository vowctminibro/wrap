// Phase 1 Step 1.1 smoke test — confirms sas-lib loads and surfaces
// the API the rest of Phase 1 depends on.
import * as sas from 'sas-lib';

console.log('sas-lib top-level keys:', Object.keys(sas).slice(0, 20));
console.log('total exports:', Object.keys(sas).length);
console.log('---');
console.log('fetchAttestation:', typeof (sas as Record<string, unknown>).fetchAttestation);
console.log('getCreateCredentialInstruction:', typeof (sas as Record<string, unknown>).getCreateCredentialInstruction);
console.log('getCreateSchemaInstruction:', typeof (sas as Record<string, unknown>).getCreateSchemaInstruction);
console.log('getCreateAttestationInstruction:', typeof (sas as Record<string, unknown>).getCreateAttestationInstruction);
console.log('deriveAttestationPda:', typeof (sas as Record<string, unknown>).deriveAttestationPda);
