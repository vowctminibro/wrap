// Pixel-art icons. Mirrors the 16×16 grid spec in
// "WRAP - Solana Colosseum"/pixel-icons.jsx — each '1' is a primary pixel,
// '2' is 60%-opaque secondary, '3' is 30%-opaque tertiary.
//
// Web demo uses CSS box-shadow per pixel; RN doesn't expose multi-shadow
// so we render a grid of Views instead. 256 cells/icon at this scale is
// negligible and the result is the exact same pixel art.

import { View, StyleSheet } from 'react-native';
import { useMemo } from 'react';

export type IconName = 'diamond' | 'crown' | 'spiral' | 'fire';

const ICONS: Record<IconName, string> = {
  diamond: `
    0000001111000000
    0000011111100000
    0000111111110000
    0001111111111000
    0011111111111100
    0111111111111110
    1111111111111111
    1112222111133111
    0111222213311110
    0011113333111100
    0001111133111000
    0000111111110000
    0000011111100000
    0000001111000000
    0000000110000000
    0000000000000000
  `,
  crown: `
    0000000000000000
    0000000000000000
    1100000110000011
    1110001111000111
    1111011111101111
    1111111111111111
    1111111111111111
    1112221111122211
    1112221111122211
    1111111111111111
    1111111111111111
    0000000000000000
    1111111111111111
    1111111111111111
    0000000000000000
    0000000000000000
  `,
  spiral: `
    0000111111110000
    0011111111111100
    0111100000011110
    0111011111101110
    1110111111110111
    1110111000110111
    1110111011110111
    1110111011110111
    1110111000010111
    1110111111110111
    1110111111110111
    0111000000001110
    0111111111111110
    0011111111111100
    0000111111110000
    0000000000000000
  `,
  fire: `
    0000000110000000
    0000001111000000
    0000011111100000
    0000111111110000
    0001111221111000
    0011112222111100
    0011122222211100
    0111122222221110
    0111222222222110
    1112222222222111
    1112222333222111
    1112233333322111
    1111233333321111
    0111133333311110
    0011113333111100
    0000111111110000
  `,
};

const PIXEL = '1';
const SECONDARY = '2';
const TERTIARY = '3';

function applyAlpha(hexOrRgb: string, alpha: number): string {
  // Simple alpha utility: only handles #RRGGBB; otherwise returns the
  // original. The icon component is the only consumer; design tokens
  // exclusively use #RRGGBB so this is safe.
  if (/^#[0-9a-fA-F]{6}$/.test(hexOrRgb)) {
    const r = parseInt(hexOrRgb.slice(1, 3), 16);
    const g = parseInt(hexOrRgb.slice(3, 5), 16);
    const b = parseInt(hexOrRgb.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hexOrRgb;
}

export default function PixelIcon({
  name,
  size = 96,
  color = '#FFFFFF',
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const cells = useMemo(() => {
    const rows = ICONS[name].trim().split('\n').map((r) => r.trim());
    const n = rows.length;
    const px = size / n;
    const out: Array<{ key: string; x: number; y: number; tone: string }> = [];
    for (let y = 0; y < n; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === PIXEL) out.push({ key: `${x}-${y}`, x, y, tone: color });
        else if (ch === SECONDARY) {
          out.push({ key: `${x}-${y}`, x, y, tone: applyAlpha(color, 0.6) });
        } else if (ch === TERTIARY) {
          out.push({ key: `${x}-${y}`, x, y, tone: applyAlpha(color, 0.3) });
        }
      }
    }
    return { cells: out, n, px };
  }, [name, size, color]);

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      {cells.cells.map((c) => (
        <View
          key={c.key}
          style={{
            position: 'absolute',
            left: c.x * cells.px,
            top: c.y * cells.px,
            width: cells.px + 0.5, // tiny bleed avoids sub-pixel gaps on hi-dpi
            height: cells.px + 0.5,
            backgroundColor: c.tone,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
});
