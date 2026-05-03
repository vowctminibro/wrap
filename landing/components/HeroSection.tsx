'use client';

import Image from 'next/image';
import { useState } from 'react';

import NotifyModal from './NotifyModal';

export default function HeroSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="relative w-full min-h-[90vh] md:min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, #9945FF 0%, transparent 45%), radial-gradient(circle at 80% 70%, #14F195 0%, transparent 40%)',
        }}
      />
      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-0 grid md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-7">
          <Image
            src="/brand/lockup.svg"
            alt="WRAP"
            width={280}
            height={64}
            priority
          />
          <h1 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
            Your Solana wallet,
            <br />
            <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
              told as a story.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-lg">
            AI-generated personality cards. Battle other wallets. Mint your
            story on-chain.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-7 text-base font-semibold text-black hover:opacity-90 transition"
            >
              Get the app
            </button>
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <div className="relative w-[260px] md:w-[300px] aspect-[1080/2400] rounded-[2.5rem] border-[10px] border-zinc-800 bg-black shadow-2xl shadow-[#9945FF]/20 overflow-hidden">
            <Image
              src="/screenshots/cards.png"
              alt="WRAP card reveal"
              fill
              sizes="300px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <NotifyModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
