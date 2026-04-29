// Insight engine: turns a WalletAnalysis into a CardData payload by
// fanning out to Claude for the prose line and filling structural fields
// (icon, label, stat, accent, sub) from a per-card-type template.
//
// CardData mirrors the shape consumed by Card.tsx (Phase 4) and matches
// the design tokens / cards-data.jsx schema.

import { callClaude } from '../services/claude';
import * as Diamond from '../prompts/diamond-hand';
import * as OG from '../prompts/og-status';
import * as Recap from '../prompts/year-recap';
import { shortenAddress } from './wallet';
import type { CardData, CardType, WalletAnalysis } from '../types';

const DIAMOND_TYPES: CardType[] = ['diamond'];
const OG_TYPES: CardType[] = ['og'];
const RECAP_TYPES: CardType[] = ['recap'];

type Template = {
  icon: string;
  label: string;
  accent: string;
  buildStat: (a: WalletAnalysis) => { stat: string; statUnit: string; sub: string };
  prompt: {
    SYSTEM: string;
    FEW_SHOT: ReturnType<typeof Diamond.buildUserMessage>[] | typeof Diamond.FEW_SHOT;
    buildUserMessage: (a: WalletAnalysis) => ReturnType<typeof Diamond.buildUserMessage>;
  };
};

const TEMPLATES: Record<CardType, Template | null> = {
  diamond: {
    icon: 'diamond',
    label: 'Diamond Hand',
    accent: '#FFFFFF',
    buildStat: (a) => {
      const days = a.biggestHold?.daysHeld ?? a.averageHoldDays ?? 0;
      const symbol = a.biggestHold?.symbol ?? a.topTokensByValue[0]?.symbol ?? 'SOL';
      return {
        stat: days > 0 ? days.toString() : a.walletAgeDays.toString(),
        statUnit: 'DAYS',
        sub: `holding $${symbol}`,
      };
    },
    prompt: Diamond,
  },
  og: {
    icon: 'crown',
    label: 'OG Status',
    accent: '#0A0A0F',
    buildStat: (a) => {
      const years = +(a.walletAgeDays / 365).toFixed(1);
      const percentile = years > 4 ? 1 : years > 3 ? 3 : years > 2 ? 5 : 10;
      return {
        stat: `TOP ${percentile}%`,
        statUnit: '',
        sub: `wallet age: ${years} yrs`,
      };
    },
    prompt: OG,
  },
  recap: {
    icon: 'spiral',
    label: 'Year Recap',
    accent: '#FFFFFF',
    buildStat: (a) => ({
      stat: new Date().getFullYear().toString(),
      statUnit: '',
      sub: `${a.totalTransactions.toLocaleString()} on-chain actions`,
    }),
    prompt: Recap,
  },
  // The remaining types ship visually in Phase 6 but don't have AI lines yet.
  swaps: null,
  genre: null,
  personality: null,
  achievement: null,
};

export const ACTIVE_INSIGHT_CARDS: CardType[] = ['diamond', 'og', 'recap'];

export async function generateCardInsight(
  cardType: CardType,
  analysis: WalletAnalysis
): Promise<CardData> {
  const tpl = TEMPLATES[cardType];
  if (!tpl) throw new Error(`No template for cardType=${cardType}`);

  const line = await callClaude({
    system: tpl.prompt.SYSTEM,
    messages: [...tpl.prompt.FEW_SHOT, tpl.prompt.buildUserMessage(analysis)],
    maxTokens: 100,
    temperature: 0.7,
  });

  const { stat, statUnit, sub } = tpl.buildStat(analysis);
  const walletShort = shortenAddress(analysis.address);
  return {
    id: cardType,
    cardType,
    icon: tpl.icon,
    label: tpl.label,
    accent: tpl.accent,
    stat,
    statUnit,
    sub,
    line: cleanLine(line),
    pubkey: walletShort,
    walletShort,
  };
}

export async function generateAllInsights(
  analysis: WalletAnalysis
): Promise<CardData[]> {
  return Promise.all(ACTIVE_INSIGHT_CARDS.map((t) => generateCardInsight(t, analysis)));
}

// Strip leading/trailing quotes, drop trailing punctuation that creeps in
// from longer-than-asked outputs, and enforce ≤15 words by truncating.
function cleanLine(raw: string): string {
  let s = raw.trim().replace(/^["'`]+|["'`]+$/g, '');
  // First sentence-ish — split on a hard period followed by space + capital.
  const firstChunk = s.split(/\n/)[0].trim();
  s = firstChunk.length > 0 ? firstChunk : s;
  const words = s.split(/\s+/);
  if (words.length > 15) {
    s = words.slice(0, 15).join(' ').replace(/[,;:]$/, '') + '.';
  }
  return s;
}
