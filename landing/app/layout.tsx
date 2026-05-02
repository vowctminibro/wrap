import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WRAP — Your Solana wallet, told as a story",
  description:
    "AI-generated personality cards. Battle other wallets. Mint your story on-chain.",
  metadataBase: new URL("https://getwrap.vercel.app"),
  openGraph: {
    title: "WRAP — Your Solana wallet, told as a story",
    description:
      "AI-generated personality cards. Battle other wallets. Mint your story on-chain.",
    url: "https://getwrap.vercel.app",
    siteName: "WRAP",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@vowctminibro",
    title: "WRAP — Your Solana wallet, told as a story",
    description:
      "AI-generated personality cards. Battle other wallets. Mint your story on-chain.",
    images: ["/og-default.png"],
  },
  icons: { icon: "/brand/app-icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-[#ededed]">
        {children}
      </body>
    </html>
  );
}
