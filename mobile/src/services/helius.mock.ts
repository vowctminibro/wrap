// MOCK: replace when EXPO_PUBLIC_HELIUS_KEY is missing or in offline dev.
// Fixtures model a typical Solana power-user with ~3y on chain, BONK + JUP
// holdings, a Mad Lads OG slot, and active DeFi behavior.

import type { DASAsset, EnhancedTransaction } from './helius';

const NOW = Math.floor(Date.now() / 1000);
const DAY = 86400;

export function getWalletTransactions(
  _address: string,
  limit: number = 100
): Promise<EnhancedTransaction[]> {
  const swapMints = [
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
    'So11111111111111111111111111111111111111112', // SOL
  ];
  const arr: EnhancedTransaction[] = [];
  for (let i = 0; i < Math.min(limit, 142); i++) {
    arr.push({
      signature: `mockSig${i.toString(36).padStart(6, '0')}`,
      timestamp: NOW - i * 5 * DAY - Math.floor(Math.random() * DAY * 3),
      type: i % 3 === 0 ? 'NFT_MINT' : 'SWAP',
      source: 'JUPITER',
      fee: 5000,
      feePayer: _address,
      tokenTransfers: [
        {
          fromUserAccount: _address,
          mint: swapMints[i % swapMints.length],
          tokenAmount: 100 + Math.random() * 1000,
        },
      ],
      instructions: [
        { programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' },
      ],
    });
  }
  // Push a very old tx so wallet age comes out to ~4y
  arr.push({
    signature: 'mockSigGenesis',
    timestamp: NOW - 1535 * DAY,
    type: 'TRANSFER',
    source: 'SYSTEM',
    fee: 5000,
    feePayer: _address,
  });
  return Promise.resolve(arr);
}

export function getAllAssets(_address: string): Promise<DASAsset[]> {
  return Promise.resolve([
    {
      id: 'BONKMockMint',
      interface: 'FungibleToken',
      content: { metadata: { name: 'Bonk', symbol: 'BONK' } },
      token_info: {
        symbol: 'BONK',
        decimals: 5,
        balance: 4200000_00000,
        price_info: { price_per_token: 0.00002, total_price: 8400 },
      },
    },
    {
      id: 'JUPMockMint',
      interface: 'FungibleToken',
      content: { metadata: { name: 'Jupiter', symbol: 'JUP' } },
      token_info: {
        symbol: 'JUP',
        decimals: 6,
        balance: 3200_000000,
        price_info: { price_per_token: 1.4, total_price: 4480 },
      },
    },
    {
      id: 'MadLadsAsset1',
      interface: 'ProgrammableNFT',
      content: { metadata: { name: 'Mad Lads #4220', symbol: 'MAD' } },
      grouping: [
        { group_key: 'collection', group_value: 'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w' },
      ],
    },
  ]);
}
