import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 w-full">
      {/* HERO */}
      <section className="relative w-full min-h-[90vh] md:min-h-screen flex items-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, #9945FF 0%, transparent 45%), radial-gradient(circle at 80% 70%, #14F195 0%, transparent 40%)",
          }}
        />
        <div className="relative w-full max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-0 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-7">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/mark.png"
                alt="WRAP mark"
                width={56}
                height={56}
                priority
              />
              <span className="text-4xl md:text-5xl font-black tracking-tight">
                WRAP
              </span>
            </div>
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
              <a
                href="#install"
                className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-7 text-base font-semibold text-black hover:opacity-90 transition"
              >
                Get the app
              </a>
              <a
                href="https://github.com/vowctminibro/wrap"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 text-base font-semibold hover:bg-white/5 transition"
              >
                View on GitHub
              </a>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <PhoneFrame src="/screenshots/cards.png" alt="WRAP card reveal" />
          </div>
        </div>
      </section>

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
              desc="Five AI-generated cards based on your wallet's real activity — diamond hands, OG status, recap, and more."
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
            In open beta. Available on Android via APK download. Seeker support
            shipping soon.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span
              aria-disabled="true"
              className="inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-10 text-lg font-semibold text-black opacity-50 cursor-default select-none"
            >
              Available May 11, 2026
            </span>
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
            iOS support after Frontier.{" "}
            <a
              href="https://github.com/vowctminibro/wrap"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-zinc-300"
            >
              Star us on GitHub
            </a>{" "}
            to follow.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Image
                src="/brand/mark.png"
                alt="WRAP"
                width={28}
                height={28}
              />
              <span className="text-xl font-black tracking-tight">WRAP</span>
            </div>
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
              href="https://twitter.com/vowctminibro"
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
              href="https://twitter.com/vowctminibro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400"
            >
              @vowctminibro
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-[260px] md:w-[300px] aspect-[1080/2400] rounded-[2.5rem] border-[10px] border-zinc-800 bg-black shadow-2xl shadow-[#9945FF]/20 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="300px"
        className="object-cover"
        priority
      />
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
