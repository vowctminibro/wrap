// Provider-agnostic LLM client.
//
// Fallback chain: Gemini #1 → Gemini #2 → Groq → throw.
// Each Gemini key has its own daily quota, so a second key from a
// different Google account effectively doubles capacity for the demo
// window. On HTTP 429 (or any other error) we walk to the next link in
// the chain. If everything fails the caller (insight-engine) falls back
// to a hand-crafted mock pool.
//
// Keys (read lazily so Node-side scripts loading .env.local *after*
// import still see them):
//   • EXPO_PUBLIC_GEMINI_KEY      — primary Gemini quota
//   • EXPO_PUBLIC_GEMINI_KEY_2    — secondary quota from a second account (optional)
//   • EXPO_PUBLIC_GROQ_KEY        — Llama 3.3 70B fallback
// Missing keys are skipped silently.
//
// Output is run through sanitizeOutput() before return: strips wrapping
// quotes, drops common preambles, collapses whitespace, and hard-caps at
// 15 words as a defensive safety net.

const PROVIDER_TIMEOUT_MS = 10_000;

export type Provider = 'gemini-1' | 'gemini-2' | 'groq';

let lastProvider: Provider | null = null;

export function getLastProvider(): Provider | null {
  return lastProvider;
}

function getGeminiKey1(): string | undefined {
  return process.env.EXPO_PUBLIC_GEMINI_KEY;
}
function getGeminiKey2(): string | undefined {
  return process.env.EXPO_PUBLIC_GEMINI_KEY_2;
}
function getGroqKey(): string | undefined {
  return process.env.EXPO_PUBLIC_GROQ_KEY;
}
function hasKey(k: string | undefined): boolean {
  return !!k && k.length >= 8;
}

export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  maxWords: number = 15
): Promise<string> {
  lastProvider = null;
  const errors: string[] = [];

  // Walk the Gemini quota pool (key #1, then key #2 if configured).
  const geminiAttempts: Array<[Provider, string | undefined]> = [
    ['gemini-1', getGeminiKey1()],
    ['gemini-2', getGeminiKey2()],
  ];
  for (const [providerName, key] of geminiAttempts) {
    if (!hasKey(key)) {
      errors.push(`${providerName}: no key`);
      continue;
    }
    try {
      const raw = await tryGemini(key as string, systemPrompt, userPrompt);
      lastProvider = providerName;
      return sanitizeOutput(raw, maxWords);
    } catch (e) {
      errors.push(`${providerName}: ${errMsg(e)}`);
      console.warn(`[llm] ${providerName} failed, advancing chain: ${errMsg(e)}`);
    }
  }

  if (hasKey(getGroqKey())) {
    try {
      const raw = await tryGroq(systemPrompt, userPrompt);
      lastProvider = 'groq';
      return sanitizeOutput(raw, maxWords);
    } catch (e) {
      errors.push(`groq: ${errMsg(e)}`);
      console.warn(`[llm] groq failed: ${errMsg(e)}`);
    }
  } else {
    errors.push('groq: no key');
  }

  throw new Error(`All LLM providers failed — ${errors.join('; ')}`);
}

async function tryGemini(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` +
    `?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 120,
      topP: 0.95,
      // Gemini 2.5 Flash burns the maxOutputTokens budget on internal
      // "thinking" tokens before emitting visible text. For a 15-word
      // one-liner there's nothing to think about — disable it so the
      // full budget goes to the user-visible response.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  const json = await fetchJsonWithTimeout(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = (json as GeminiResponse)?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`gemini: malformed response`);
  }
  return text.trim();
}

async function tryGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 120,
    temperature: 0.7,
  };
  const json = await fetchJsonWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${getGroqKey()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = (json as GroqResponse)?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error(`groq: malformed response`);
  }
  return text.trim();
}

async function fetchJsonWithTimeout(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${body.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

type GroqResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
};

// ─────────────────────────────────────────────────────────────────────
// sanitizeOutput
// LLMs occasionally wrap output in quotes or open with a preamble like
// "Here's a punchy line:". Strip those, collapse whitespace, and cap
// length at maxWords (default 15) as a hard safety net. Insight cards
// stay at 15; longer-form copy (Battle commentary at 25) opts in.
// ─────────────────────────────────────────────────────────────────────
export function sanitizeOutput(raw: string, maxWords: number = 15): string {
  if (!raw) return raw;
  let s = raw.trim();

  // Drop common preambles. Anchored to the very start, case-insensitive.
  // Examples removed: "Here's a punchy line:", "Output:", "Line:", "Result:".
  s = s.replace(
    /^\s*(here(?:'|’)?s\s+(?:a|the|your)?[^:\n]{0,40}:|output:|line:|result:|response:)\s*/i,
    ''
  );

  // Take the first non-empty line (most prompts don't need multi-line output).
  const firstLine = s.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
  if (firstLine) s = firstLine;

  // Strip wrapping quotes — straight, smart, single, double, backtick.
  s = s.replace(/^[\s"'`“”‘’]+|[\s"'`“”‘’]+$/g, '');

  // Collapse runs of whitespace.
  s = s.replace(/\s+/g, ' ').trim();

  // Hard cap at maxWords. End on a clean period if we had to truncate.
  const words = s.split(/\s+/);
  if (words.length > maxWords) {
    s = words.slice(0, maxWords).join(' ').replace(/[,;:]+$/, '');
    if (!/[.!?]$/.test(s)) s += '.';
  }
  return s;
}
