// Thin wrapper around Solana Mobile Wallet Adapter.
// On Seeker / Android with Phantom installed, transact() opens the wallet
// via the deep-link / scheme handler, the user approves, and we get a
// publicKey back. On environments without MWA support, throws.

import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { PublicKey } from '@solana/web3.js';

const APP_IDENTITY = {
  name: 'WRAP',
  uri: 'https://wrap.app',
  icon: 'favicon.ico',
};

export type ConnectedWallet = {
  publicKey: string;
  authToken: string;
};

export async function connectWallet(): Promise<ConnectedWallet> {
  return await transact(async (wallet) => {
    const auth = await wallet.authorize({
      chain: 'solana:devnet',
      identity: APP_IDENTITY,
    });
    const accountAddress = auth.accounts[0].address;
    // accounts[].address is base64; convert to base58 publicKey string.
    const pk = new PublicKey(Buffer.from(accountAddress, 'base64'));
    return {
      publicKey: pk.toBase58(),
      authToken: auth.auth_token,
    };
  });
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
