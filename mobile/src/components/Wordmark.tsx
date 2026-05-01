// WRAP wordmark — SVG, paths inlined from mobile/assets/brand/wordmark.svg.
// Renders at any size without raster blur. Variants:
//   • gradient   — solana purple → green linear-gradient fill (default)
//   • mono-purple
//   • mono-white
//
// `glow` toggles a soft halo behind the letter forms (matches the SVG's
// Gaussian blur filter spec). Defaults to true since the brand sheet
// shows the wordmark with halo in hero placements.

import { useId } from 'react';
import { Dimensions } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  Circle,
  RadialGradient,
} from 'react-native-svg';

const VB_W = 1000;
const VB_H = 280;

// Reserve this much horizontal padding on each side so the wordmark
// doesn't kiss the edge of the screen when the consumer asks for an
// idealistic size. Matches the typical screen-level horizontal padding
// of consumers (OnboardingScreen uses spacing.lg=32 per side).
const SCREEN_MARGIN = 32;

type Variant = 'gradient' | 'mono-purple' | 'mono-white';

const SOLID_COLOR: Record<Exclude<Variant, 'gradient'>, string> = {
  'mono-purple': '#9945FF',
  'mono-white': '#FFFFFF',
};

export default function Wordmark({
  size = 64,
  variant = 'gradient',
  glow = true,
}: {
  size?: number;
  variant?: Variant;
  glow?: boolean;
}) {
  // Unique ids prevent gradient/clip collisions when multiple Wordmarks
  // mount in the same screen (e.g. onboarding hero + a future toolbar).
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `wordmarkGrad${rid}`;
  const haloId = `wordmarkHalo${rid}`;

  // Responsive: cap the rendered width to the screen so the wordmark
  // never crops at the right edge on narrower devices. `size` becomes
  // an *ideal* height — actual height shrinks if needed to preserve the
  // 1000×280 aspect ratio under a screen-bounded width.
  const screenWidth = Dimensions.get('window').width;
  const maxWidth = Math.max(0, screenWidth - SCREEN_MARGIN * 2);
  const idealWidth = (size * VB_W) / VB_H;
  const finalWidth = Math.min(idealWidth, maxWidth);
  const finalHeight = (finalWidth * VB_H) / VB_W;
  const fill = variant === 'gradient' ? `url(#${gradId})` : SOLID_COLOR[variant];

  return (
    <Svg width={finalWidth} height={finalHeight} viewBox={`0 0 ${VB_W} ${VB_H}`} fill="none">
      <Defs>
        <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#9945FF" />
          <Stop offset="100%" stopColor="#14F195" />
        </LinearGradient>
        {glow ? (
          <RadialGradient
            id={haloId}
            cx="50%"
            cy="50%"
            rx="60%"
            ry="60%"
            fx="50%"
            fy="50%"
          >
            <Stop offset="0%" stopColor="#9945FF" stopOpacity="0.45" />
            <Stop offset="60%" stopColor="#14F195" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#9945FF" stopOpacity="0" />
          </RadialGradient>
        ) : null}
      </Defs>

      {/* Soft halo behind the letterforms — RN-Svg can't do feGaussianBlur on
          arbitrary glyphs, so we approximate the SVG's filter spec with a
          large radial-gradient ellipse covering the wordmark area. */}
      {glow ? (
        <Path
          d={`M 0 0 H ${VB_W} V ${VB_H} H 0 Z`}
          fill={`url(#${haloId})`}
        />
      ) : null}

      <G fill={fill}>
        {/* W */}
        <Path d="M 20 40 L 80 40 L 130 200 L 180 80 L 230 200 L 280 40 L 340 40 L 260 260 L 200 260 L 180 200 L 160 260 L 100 260 Z" />
        {/* R */}
        <Path d="M 380 40 L 460 40 Q 560 40 560 110 Q 560 160 510 175 L 580 260 L 500 260 L 440 180 L 440 260 L 380 260 Z M 440 100 L 440 150 L 470 150 Q 500 150 500 125 Q 500 100 470 100 Z" />
        {/* A + dot */}
        <Path d="M 680 40 L 740 40 L 830 260 L 765 260 L 750 220 L 670 220 L 655 260 L 590 260 Z M 690 170 L 730 170 L 710 110 Z" />
        <Circle cx="710" cy="195" r="14" />
        {/* P */}
        <Path d="M 850 40 L 930 40 Q 1020 40 1020 115 Q 1020 190 930 190 L 910 190 L 910 260 L 850 260 Z M 910 100 L 910 140 L 935 140 Q 960 140 960 120 Q 960 100 935 100 Z" />
      </G>
    </Svg>
  );
}
