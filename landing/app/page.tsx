import Image from "next/image";

import HeroSection from "../components/HeroSection";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full">
      <HeroSection />

      {/* SECTION 2: features */}
      <section className="w-full border-t border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Your wallet has a story.
            </h2>
            <p className="text-lg text-zinc-400 leading-relaxed">
              WRAP reads your on-chain history and turns it into something you
              can hold, share, and battle.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              src="/screenshots/cards.png"
              title="Personality Cards"
              desc="Three AI-generated cards based on your wallet's real activity — Diamond Hand, OG Status, and Year Recap. Four more designed for v2."
            />
            <FeatureCard
              src="/screenshots/battle-final.png"
              title="Wallet Battles"
              desc="Pit your wallet against any other Solana address. Five rounds, on-chain stats, one winner."
            />
            <FeatureCard
              src="/screenshots/leaderboard.png"
              title="Live Leaderboard"
              desc="See who's winning across the network. Tap any wallet to see their full battle history."
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: built on solana */}
      <section className="w-full border-t border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8">
            Built on Solana, mobile-first.
          </h2>
          <div className="text-lg text-zinc-400 leading-relaxed space-y-5 mb-12 text-left md:text-center">
            <p>
              WRAP is built native for Solana Mobile. Sign in with your Seeker,
              connect any wallet via Mobile Wallet Adapter, and get your story
              in under thirty seconds — no extension, no browser tab, no seed
              phrase friction.
            </p>
            <p>
              Every card you love can be minted as a compressed NFT via
              Bubblegum — pennies per mint, fully on-chain, fully yours. Your
              gallery becomes a permanent record of who your wallet has been.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
            <Badge>Solana Frontier 2026</Badge>
            <Badge>Mobile Wallet Adapter</Badge>
            <Badge>cNFTs via Bubblegum</Badge>
          </div>
        </div>
      </section>

      {/* SECTION 4: install */}
      <section
        id="install"
        className="w-full border-t border-white/5 py-24"
      >
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Get the app.
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed mb-10">
            Download the APK to try it on Android or Solana Seeker today.
            iOS support coming after Frontier 2026.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/vowctminibro/wrap/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-10 text-lg font-semibold text-black hover:opacity-90 transition"
            >
              Download APK
            </a>
            <a
              href="https://github.com/vowctminibro/wrap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 px-8 text-base font-semibold hover:bg-white/5 transition"
            >
              View on GitHub
            </a>
          </div>
          <p className="text-sm text-zinc-500 mt-6">
            Source on{" "}
            <a
              href="https://github.com/vowctminibro/wrap"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              GitHub
            </a>
            . Star us to follow.
          </p>
          <p className="text-sm text-zinc-500 mt-3">
            See WRAP in action:{" "}
            <a
              href="https://www.loom.com/share/795c290cd7024379961edc22d7d51eb6"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              Pitch
            </a>{" "}
            ·{" "}
            <a
              href="https://www.loom.com/share/12632ac649d84b059914fa3e4ae18594"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              Demo
            </a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <Image
              src="/brand/lockup.svg"
              alt="WRAP"
              width={120}
              height={28}
              className="opacity-90"
            />
            <span className="text-sm text-zinc-500">
              Your Solana wallet, told as a story.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a
              href="https://github.com/vowctminibro/wrap"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              GitHub
            </a>
            <a
              href="https://x.com/getwrap"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Twitter
            </a>
            <span>© 2026</span>
          </div>
        </div>
        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 text-xs text-zinc-600 text-center">
            Built for Solana Frontier 2026 by{" "}
            <a
              href="https://x.com/VowIMTX"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              @VowIMTX
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  src,
  title,
  desc,
}: {
  src: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition">
      <div className="relative w-full aspect-[1080/2000] rounded-xl overflow-hidden border border-white/5 bg-black">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-top"
        />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-zinc-300">
      {children}
    </span>
  );
}
