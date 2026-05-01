// WRAP mark — single-letter "W" + dot, paths inlined from
// mobile/assets/brand/mark-w.svg. Square viewBox 200×200; renders at
// any size without raster blur.

import { useId } from 'react';
import Svg, {
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  Circle,
} from 'react-native-svg';

const VB = 200;

type Variant = 'gradient' | 'mono-purple' | 'mono-white';

const SOLID_COLOR: Record<Exclude<Variant, 'gradient'>, string> = {
  'mono-purple': '#9945FF',
  'mono-white': '#FFFFFF',
};

export default function Mark({
  size = 32,
  variant = 'gradient',
}: {
  size?: number;
  variant?: Variant;
}) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `markGrad${rid}`;
  const fill = variant === 'gradient' ? `url(#${gradId})` : SOLID_COLOR[variant];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`} fill="none">
      <Defs>
        <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#9945FF" />
          <Stop offset="100%" stopColor="#14F195" />
        </LinearGradient>
      </Defs>
      <G fill={fill}>
        <Path d="M 14 28 L 54 28 L 84 130 L 100 70 L 116 130 L 146 28 L 186 28 L 134 168 L 110 168 L 100 130 L 90 168 L 66 168 Z" />
        <Circle cx="100" cy="180" r="9" />
      </G>
    </Svg>
  );
}
