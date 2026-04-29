// Anthropic Messages API client — used by the insight engine to generate
// 15-word punchy lines per card type. Falls back to the hand-crafted pool
// in claude.mock.ts when no key is present, so the dev loop never breaks.
//
// Key resolution (lazy, so Node-side scripts that load .env.local *after*
// import still see it):
//   1. EXPO_PUBLIC_ANTHROPIC_KEY      — preferred, baked into Expo bundle
//   2. ANTHROPIC_API_KEY              — Node-side env override
//
// Note: bundling a key into a mobile app is a leak risk. See BLOCKERS B-001.

import * as Mock from './claude.mock';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type CallClaudeOptions = {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
};

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

function getKey(): string | undefined {
  return process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? process.env.ANTHROPIC_API_KEY;
}

function keyMissing(): boolean {
  const k = getKey();
  return !k || k.length < 8;
}

export async function callClaude(opts: CallClaudeOptions): Promise<string> {
  if (keyMissing()) {
    return Mock.callClaude(opts);
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': getKey() as string,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? 100,
      temperature: opts.temperature ?? 0.7,
      system: opts.system,
      messages: opts.messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  // Concatenate any text blocks (Anthropic can split output across blocks).
  return json.content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text!.trim())
    .join('\n')
    .trim();
}

export function isMockMode(): boolean {
  return keyMissing();
}
