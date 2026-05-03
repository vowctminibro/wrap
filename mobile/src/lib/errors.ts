// Maps engineer-detail errors (Helius HTTP 504, fetch failed, ...) to
// short user-facing copy. Underlying message stays in console.error so
// debugging isn't impacted; only the UI surface gets sanitized.
//
// Used by Battle, CardReveal, and Mint error paths — anywhere a
// thrown Error from an indexer/LLM/network layer would otherwise
// leak directly into a Text node or Alert body.

const RETRY_HINT = ' Tap retry to try again.';

function statusFromMessage(msg: string): number | null {
  // Patterns we throw from the service layer:
  //   "Helius getAssetsByOwner HTTP 504"
  //   "Pinata pin HTTP 401"
  //   "HTTP 429 <body excerpt>"
  const m = msg.match(/HTTP (\d{3})/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

export function mapErrorToFriendly(err: unknown): string {
  const raw = err instanceof Error ? err.message : '';
  const lower = raw.toLowerCase();

  // Network-level: device offline, dropped fetch, AbortError, etc.
  if (
    lower.includes('network') ||
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('aborted') ||
    lower.includes('timeout') ||
    lower.includes('timed out')
  ) {
    return 'On-chain analysis timed out.' + RETRY_HINT;
  }

  const status = statusFromMessage(raw);
  if (status !== null) {
    if (status === 429) {
      return 'Too many requests right now. Wait a moment and retry.';
    }
    if (status === 504 || status === 408) {
      return 'On-chain analysis timed out.' + RETRY_HINT;
    }
    if (status >= 500) {
      return 'Solana network slowed down.' + RETRY_HINT;
    }
    if (status >= 400) {
      return "We couldn't analyze this wallet. Try a different one.";
    }
  }

  // LLM provider exhaustion bubbles up as
  //   "All LLM providers failed — gemini: HTTP 429 ...; groq: HTTP 503 ..."
  if (lower.startsWith('all llm providers failed')) {
    return 'AI commentary is rate-limited right now.' + RETRY_HINT;
  }

  // Engine-level guardrails we throw deliberately — these are already
  // user-friendly enough.
  if (raw === 'CANNOT_BATTLE_SELF') {
    return "You can't battle your own wallet.";
  }

  return 'Something went wrong.' + RETRY_HINT;
}
