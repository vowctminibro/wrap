// Insight engine: turns a WalletAnalysis into a CardData payload.
//
// Flow:
//   1. Pick prompt template by card type.
//   2. Check LLM cache (AsyncStorage, keyed by wallet+cardType+day).
//   3. On miss: call llm.callLLM(SYSTEM, buildUserPrompt(analysis)),
//      walk the gemini-1 → gemini-2 → groq chain.
//   4. On all providers failing: fall back to the llm.mock pool.
//   5. Cache the result (best-effort) before returning.
//   6. Wrap the prose line + structural fields (icon, label, stat) into
//      a CardData ready for Card.tsx.

import { callLLM, getLastProvider, type Provider } from '../services/llm';
import { callLLMMock } from '../services/llm.mock';
import {
  getCachedInsight,
  setCachedInsight,
  type InsightSource,
} from './llm-cache';
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

export type InsightProvider = Provider | 'mock' | 'cache';

export type InsightTrace = {
  cardType: CardType;
  provider: InsightProvider;
  /** The prose source pulled from cache (set when provider === 'cache'). */
  cachedFromSource?: InsightSource;
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

  // Cache lookup first — saves a quota burn on every re-tap of the
  // same wallet within a 24h window.
  const cached = await getCachedInsight(analysis.address, cardType);
  let line: string;
  let raw: string;
  let provider: InsightProvider;
  let source: CardData['source'];
  if (cached) {
    line = cached.prose;
    raw = cached.prose;
    provider = 'cache';
    source = 'cache';
    if (trace) {
      trace.push({
        cardType,
        provider,
        cachedFromSource: cached.source,
        raw,
        line,
      });
    }
  } else {
    let liveSource: InsightSource;
    try {
      line = await callLLM(sys, user);
      raw = line;
      const last = getLastProvider();
      liveSource = last ?? 'mock';
      provider = liveSource as InsightProvider;
    } catch (e) {
      console.warn(
        `[insight-engine] LLM fallback to mock for ${cardType}: ${(e as Error).message}`
      );
      line = callLLMMock(sys, user);
      raw = line;
      liveSource = 'mock';
      provider = 'mock';
    }
    source = liveSource;
    // Best-effort write — never blocks on storage.
    setCachedInsight(analysis.address, cardType, {
      prose: line,
      generatedAt: Date.now(),
      source: liveSource,
    });
    if (trace) trace.push({ cardType, provider, raw, line });
  }

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
    source,
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
