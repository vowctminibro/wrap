// Confetti pieces. Positions pre-generated with a seeded RNG so they're
// stable across renders and the layout doesn't reflow on every state
// change. Mirrors the Confetti component in screens.jsx.

import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

// Confetti palette — Solana brand colors lead, with neutral accents
// so the spread reads festive without leaving brand.
const COLORS = ['#9945FF', '#14F195', '#DC1FFF', '#FFB800', '#00E0FF', '#FFFFFF'];

type Piece = {
  leftPct: number;
  topPct: number;
  size: number;
  rotateDeg: number;
  color: string;
  isCircle: boolean;
};

// Round 6: confetti is clamped to the top 40% of the viewport so it
// reads as a celebratory burst above the title rather than scattering
// over "Your story is on-chain", "cNFT minted to …", and the SAS
// pill below. Pieces drift further out (top: 0–40%) than they used
// to (0–100%) but never cover the readable copy.
const TOP_RANGE_PCT = 40;

function buildPieces(count: number, seed: number): Piece[] {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: Piece[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      leftPct: rand() * 100,
      topPct: rand() * TOP_RANGE_PCT,
      size: 6 + rand() * 14,
      rotateDeg: rand() * 360,
      color: COLORS[Math.floor(rand() * COLORS.length)],
      isCircle: rand() > 0.5,
    });
  }
  return out;
}

export default function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(() => buildPieces(count, 1), [count]);
  return (
    <View pointerEvents="none" style={styles.overlay}>
      {pieces.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${p.leftPct}%`,
            top: `${p.topPct}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? p.size / 2 : 1,
            transform: [{ rotate: `${p.rotateDeg}deg` }],
            opacity: 0.7,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', inset: 0 as never, top: 0, left: 0, right: 0, bottom: 0 },
});
