'use client';

import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function NotifyModal({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Auto-close after success so the user sees the confirmation, then
  // the modal gets out of the way.
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => {
      onClose();
      setStatus('idle');
      setEmail('');
    }, 2000);
    return () => clearTimeout(t);
  }, [status, onClose]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;
    setStatus('submitting');
    setErrorMessage('');

    let res: Response;
    try {
      res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      setStatus('error');
      setErrorMessage('Could not connect. Please retry.');
      return;
    }

    if (res.ok) {
      setStatus('success');
      return;
    }
    if (res.status === 400) {
      setStatus('error');
      setErrorMessage('Please enter a valid email');
      return;
    }
    if (res.status === 409) {
      setStatus('error');
      setErrorMessage("You're already on the list");
      return;
    }
    setStatus('error');
    setErrorMessage(
      'Something went wrong. Try again or follow @getwrap on X'
    );
  }

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-200 ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notify-title"
        className={`relative w-full max-w-md rounded-2xl border border-[#9945FF]/40 bg-[#0a0a0a] p-8 shadow-2xl shadow-[#9945FF]/20 transition-transform duration-200 ${
          open ? 'scale-100' : 'scale-95'
        }`}
      >
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white transition"
        >
          <span className="text-xl leading-none">×</span>
        </button>

        <h2
          id="notify-title"
          className="text-2xl md:text-3xl font-black tracking-tight mb-3"
        >
          Be first to try WRAP
        </h2>
        <p className="text-sm md:text-base text-zinc-400 leading-relaxed mb-6">
          WRAP launches at Solana Frontier 2026 on May 11. Drop your email
          and we&apos;ll let you know the moment it&apos;s live.
        </p>

        {status === 'success' ? (
          <div
            role="status"
            className="rounded-xl border border-[#14F195]/40 bg-[#14F195]/[0.06] px-4 py-5 text-center text-[#14F195] font-semibold"
          >
            You&apos;re in. We&apos;ll email you May 11.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              autoComplete="email"
              disabled={status === 'submitting'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 rounded-full border border-white/10 bg-white/[0.03] px-5 text-base text-white placeholder-zinc-500 focus:border-[#9945FF] focus:outline-none focus:ring-1 focus:ring-[#9945FF] disabled:opacity-50 transition"
            />
            {status === 'error' && errorMessage ? (
              <p className="text-sm text-red-400 px-2" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-7 text-base font-semibold text-black hover:opacity-90 disabled:opacity-50 transition"
            >
              {status === 'submitting' ? 'Sending…' : 'Notify me'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Or follow{' '}
          <a
            href="https://x.com/getwrap"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-300 underline hover:text-white"
          >
            @getwrap
          </a>{' '}
          on X.
        </p>
      </div>
    </div>
  );
}
