import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// Email-capture waitlist for the May 11 launch. Two writes per signup:
//  - kv.set('wrap:waitlist:{email}')   → cheap dup-check key
//  - kv.zadd('wrap:waitlist:index')    → chronological export by score=ts
// Vow can dump the list any time via:
//   vercel kv zrange wrap:waitlist:index 0 -1
//
// Zero PII beyond the address itself + the user-agent (kept for spam
// triage). Email lower-cased so 'foo@x.com' and 'FOO@x.com' don't both
// land in the list.

export const runtime = 'edge';

const EMAIL_RE = /.+@.+\..+/;

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
    const existing = await kv.get(key);
    if (existing !== null) {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 });
    }
    await kv.set(key, { email, ts, ua });
    await kv.zadd('wrap:waitlist:index', { score: ts, member: email });
  } catch (err) {
    console.error('[notify] kv write failed', err);
    return NextResponse.json({ error: 'kv_unavailable' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
