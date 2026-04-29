// Insight engine: turns a WalletAnalysis into a CardData payload.
//
// Flow:
//   1. Pick prompt template by card type.
//   2. Call llm.callLLM(SYSTEM, buildUserPrompt(analysis)).
//   3. On both providers failing, fall back to llm.mock pool.
//   4. Wrap the prose line + structural fields (icon, label, stat) into
//      a CardData ready for Card.tsx (Phase 4).

import { callLLM, getLastProvider, type Provider } from '../services/llm';
import { callLLMMock } from '../services/llm.mock';
import * as Diamond from '../prompts/diamond-hand';
import * as OG from '../prompts/og-status';
import * as Recap from '../prompts/year-recap';
import { shortenAddress } from './wallet';
import type { CardData, CardType, WalletAnalysis } from '../types';

type Template = {
  icon: string;
  label: string;
  accent: string;
  buildStat: (a: WalletAnalysis) => { stat: string; statUnit: string; sub: string };
  prompt: {
    SYSTEM: string;
    buildUserPrompt: (a: WalletAnalysis) => string;
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
  // Phase 6 ships these visually but they don't have AI lines yet.
  swaps: null,
  genre: null,
  personality: null,
  achievement: null,
};

export const ACTIVE_INSIGHT_CARDS: CardType[] = ['diamond', 'og', 'recap'];

export type InsightProvider = Provider | 'mock';

export type InsightTrace = {
  cardType: CardType;
  provider: InsightProvider;
  raw: string; // pre-sanitization (mock: same as final)
  line: string; // post-sanitization (what ships to UI)
};

export async function generateCardInsight(
  cardType: CardType,
  analysis: WalletAnalysis,
  trace?: InsightTrace[]
): Promise<CardData> {
  const tpl = TEMPLATES[cardType];
  if (!tpl) throw new Error(`No template for cardType=${cardType}`);

  const sys = tpl.prompt.SYSTEM;
  const user = tpl.prompt.buildUserPrompt(analysis);

  let raw = '';
  let line = '';
  let provider: InsightProvider = 'mock';
  try {
    line = await callLLM(sys, user);
    raw = line;
    provider = (getLastProvider() ?? 'mock') as InsightProvider;
  } catch (e) {
    console.warn(`[insight-engine] LLM fallback to mock for ${cardType}: ${(e as Error).message}`);
    line = callLLMMock(sys, user);
    raw = line;
    provider = 'mock';
  }

  if (trace) trace.push({ cardType, provider, raw, line });

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
    line,
    pubkey: walletShort,
    walletShort,
  };
}

export async function generateAllInsights(
  analysis: WalletAnalysis,
  trace?: InsightTrace[]
): Promise<CardData[]> {
  return Promise.all(
    ACTIVE_INSIGHT_CARDS.map((t) => generateCardInsight(t, analysis, trace))
  );
}
