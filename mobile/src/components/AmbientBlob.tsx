// Ambient background blob — a soft radial-gradient circle that fades to
// transparent. Used as decorative atmosphere behind hero copy. Replaces
// the previous solid <View backgroundColor=... opacity=0.35 /> approach,
// which produced a hard ring at the View's bounds.

import { useId } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export default function AmbientBlob({
  color,
  size = 600,
  style,
}: {
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const rid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `blob${rid}`;
  const half = size / 2;
  return (
    <Svg
      width={size}
      height={size}
      // pointerEvents none on the wrapper is handled by Svg's native impl;
      // the View parent sets style with absolute positioning.
      style={style}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
    >
      <Defs>
        <RadialGradient
          id={gradId}
          cx="50%"
          cy="50%"
          rx="50%"
          ry="50%"
          fx="50%"
          fy="50%"
        >
          <Stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <Stop offset="50%" stopColor={color} stopOpacity="0.18" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={half} cy={half} r={half} fill={`url(#${gradId})`} />
    </Svg>
  );
}
