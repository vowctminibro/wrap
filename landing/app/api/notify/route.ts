import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Email-capture waitlist for mainnet launch. Two writes per signup:
//  - redis.set('wrap:waitlist:{email}')   → cheap dup-check key
//  - redis.zadd('wrap:waitlist:index')    → chronological export by score=ts
// Vow can dump the list any time via the Upstash console or:
//   redis-cli ZRANGE wrap:waitlist:index 0 -1
//
// Zero PII beyond the address itself + the user-agent (kept for spam
// triage). Email lower-cased so 'foo@x.com' and 'FOO@x.com' don't both
// land in the list.
//
// Why not Redis.fromEnv(): Vercel's Marketplace "Upstash for Redis"
// integration injects KV_REST_API_URL + KV_REST_API_TOKEN (legacy KV
// prefix kept for @vercel/kv migration compat). Redis.fromEnv() looks
// for UPSTASH_REDIS_REST_* which Vercel-native integration doesn't
// inject — explicit constructor uses what we actually have.

export const runtime = 'edge';

const EMAIL_RE = /.+@.+\..+/;

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

type Body = { email?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const raw = typeof body.email === 'string' ? body.email.trim() : '';
  if (!raw || raw.length > 254 || !EMAIL_RE.test(raw)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  const email = raw.toLowerCase();

  const ua = req.headers.get('user-agent') ?? '';
  const ts = Date.now();
  const key = `wrap:waitlist:${email}`;

  try {
    const existing = await redis.exists(key);
    if (existing === 1) {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 });
    }
    await redis.set(key, { email, ts, ua });
    await redis.zadd('wrap:waitlist:index', { score: ts, member: email });
  } catch (err) {
    console.error('[notify] redis write failed', err);
    return NextResponse.json({ error: 'redis_unavailable' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
