// Pinata IPFS upload helpers — shared between cNFT mint and Phase 2C
// share-image flows. Both call paths capture a local PNG via view-shot
// then push it to IPFS for a publicly resolvable URL.
//
// Returns the gateway URL when EXPO_PUBLIC_PINATA_GATEWAY is set, else
// the raw `ipfs://<cid>` form. Caller decides whether the resulting URL
// is good enough (cNFT metadata accepts either; the share flow needs a
// gateway URL so Twitter can unfurl an image preview).

function getPinataJwt(): string | undefined {
  return process.env.EXPO_PUBLIC_PINATA_JWT;
}

function getPinataGateway(): string | undefined {
  return process.env.EXPO_PUBLIC_PINATA_GATEWAY;
}

export function isPinataConfigured(): boolean {
  return Boolean(getPinataJwt());
}

/**
 * Pin a local PNG to IPFS via Pinata. `name` becomes the Pinata file name
 * (visible in the Pinata dashboard, not in the gateway URL).
 *
 * Returns null only when EXPO_PUBLIC_PINATA_JWT is missing — every other
 * failure throws so callers can distinguish "not configured" from
 * "configured but upload failed".
 */
export async function uploadImageToPinata(
  uri: string,
  name: string
): Promise<string | null> {
  const jwt = getPinataJwt();
  const gateway = getPinataGateway();
  if (!jwt) return null;

  // RN's fetch supports FormData with file URIs (file:///…). Pinata's
  // pinFileToIPFS endpoint returns { IpfsHash: "Qm…" } on success.
  const form = new FormData();
  form.append('file', {
    uri,
    name: `${name}.png`,
    type: 'image/png',
  } as unknown as Blob);

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Pinata pin HTTP ${res.status}`);
  }
  const json = (await res.json()) as { IpfsHash?: string };
  if (!json.IpfsHash) {
    throw new Error('Pinata: no IpfsHash in response');
  }
  return gateway
    ? `${gateway.replace(/\/$/, '')}/ipfs/${json.IpfsHash}`
    : `ipfs://${json.IpfsHash}`;
}
