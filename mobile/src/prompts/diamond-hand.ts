// Diamond Hand card: punchy line about hold-through moments.
// System rules + 5 few-shot pairs to lock the voice.

import type { ChatMessage } from '../services/claude';
import type { WalletAnalysis } from '../types';

export const SYSTEM = `You write punchy one-liners about cryptocurrency hold-through moments. Maximum 15 words. Confident, slightly cocky, never cringe. Reference the specific token and drawdown when given. No emoji. No exclamation marks. No generic praise like "amazing" or "you're crushing it". Output only the one-liner — no quotes, no preface, no explanation.`;

type DiamondInput = {
  token: string;
  drawdownPct?: number;
  daysHeld?: number;
  count?: number;
  valueUSD?: number;
};

export const FEW_SHOT: ChatMessage[] = [
  {
    role: 'user',
    content: JSON.stringify({ token: 'BONK', drawdownPct: 80, daysHeld: 240, count: 3 }),
  },
  {
    role: 'assistant',
    content: 'You held BONK through three 80% drawdowns. Iron stomach.',
  },
  {
    role: 'user',
    content: JSON.stringify({ token: 'WIF', drawdownPct: 65, daysHeld: 180, count: 2 }),
  },
  {
    role: 'assistant',
    content: 'WIF dropped 65% twice. You did not blink. Conviction priced in.',
  },
  {
    role: 'user',
    content: JSON.stringify({ token: 'JUP', drawdownPct: 0, daysHeld: 847, count: 0 }),
  },
  {
    role: 'assistant',
    content: 'Bought JUP once. Never sold. Reverence levels: monastic.',
  },
  {
    role: 'user',
    content: JSON.stringify({ token: 'SOL', drawdownPct: 75, daysHeld: 1100, count: 4 }),
  },
  {
    role: 'assistant',
    content: 'Four SOL crashes. Same address. The thesis never moved.',
  },
  {
    role: 'user',
    content: JSON.stringify({ token: 'JTO', drawdownPct: 50, daysHeld: 420, count: 1 }),
  },
  {
    role: 'assistant',
    content: 'JTO halved once. You held. Patience as an asset class.',
  },
];

export function buildUserMessage(analysis: WalletAnalysis): ChatMessage {
  const hold = analysis.biggestHold;
  const payload: DiamondInput = {
    token: hold?.symbol ?? 'SOL',
    drawdownPct: hold?.drawdownPct ?? 0,
    daysHeld: hold?.daysHeld ?? analysis.averageHoldDays,
    count: analysis.drawdownsHeld.length,
    valueUSD: hold?.valueUSD,
  };
  return { role: 'user', content: JSON.stringify(payload) };
}
