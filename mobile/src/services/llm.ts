// Provider-agnostic LLM client.
//
// Strategy: Gemini 2.5 Flash (primary, free tier) → Groq Llama 3.3 70B
// (fallback, free tier). On any provider error — HTTP non-2xx, timeout,
// or malformed response — log a warning and try the next provider. If
// both fail, throw — caller (insight-engine) falls back to a hand-crafted
// mock pool.
//
// Public surface kept intentionally small:
//   • callLLM(systemPrompt, userPrompt) -> Promise<string>
//   • getLastProvider() -> "gemini" | "groq" | null
//
// Keys (read lazily so Node-side scripts loading .env.local *after*
// import still see them):
//   • EXPO_PUBLIC_GEMINI_KEY     — primary
//   • EXPO_PUBLIC_GROQ_KEY       — fallback
// In Expo these are inlined at build; in Node scripts the test runner
// loads them from mobile/.env.local before the first call.
//
// Output is run through sanitizeOutput() before return: strips wrapping
// quotes, drops common preambles, collapses whitespace, and hard-caps at
// 15 words as a defensive safety net.

const PROVIDER_TIMEOUT_MS = 10_000;

export type Provider = 'gemini' | 'groq';

let lastProvider: Provider | null = null;

export function getLastProvider(): Provider | null {
  return lastProvider;
}

function getGeminiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_GEMINI_KEY;
}
function getGroqKey(): string | undefined {
  return process.env.EXPO_PUBLIC_GROQ_KEY;
}
function hasKey(k: string | undefined): boolean {
  return !!k && k.length >= 8;
}

export async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  lastProvider = null;
  const errors: string[] = [];

  if (hasKey(getGeminiKey())) {
    try {
      const raw = await tryGemini(systemPrompt, userPrompt);
      lastProvider = 'gemini';
      return sanitizeOutput(raw);
    } catch (e) {
      errors.push(`gemini: ${errMsg(e)}`);
      console.warn(`[llm] gemini failed, falling back to groq: ${errMsg(e)}`);
    }
  } else {
    errors.push('gemini: no key');
  }

  if (hasKey(getGroqKey())) {
    try {
      const raw = await tryGroq(systemPrompt, userPrompt);
      lastProvider = 'groq';
      return sanitizeOutput(raw);
    } catch (e) {
      errors.push(`groq: ${errMsg(e)}`);
      console.warn(`[llm] groq failed: ${errMsg(e)}`);
    }
  } else {
    errors.push('groq: no key');
  }

  throw new Error(`All LLM providers failed — ${errors.join('; ')}`);
}

async function tryGemini(systemPrompt: string, userPrompt: string): Promise<string> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` +
    `?key=${getGeminiKey()}`;
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
// length at 15 words as a hard safety net.
// ─────────────────────────────────────────────────────────────────────
export function sanitizeOutput(raw: string): string {
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

  // Hard cap at 15 words. End on a clean period if we had to truncate.
  const words = s.split(/\s+/);
  if (words.length > 15) {
    s = words.slice(0, 15).join(' ').replace(/[,;:]+$/, '');
    if (!/[.!?]$/.test(s)) s += '.';
  }
  return s;
}
