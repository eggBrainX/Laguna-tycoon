import React from 'react';
import { EggType } from '../game/types';

export const RoeArtwork: React.FC<{ type: EggType; size?: number }> = ({
  type,
  size = 44,
}) => {
  const palette =
    type === 'COMMON'
      ? { base: '#F472B6', highlight: '#FBCFE8', rim: '#DB2777' }
      : type === 'PREMIUM'
        ? { base: '#FBBF24', highlight: '#FEF08A', rim: '#D97706' }
        : { base: '#A855F7', highlight: '#E9D5FF', rim: '#7E22CE' };

  const beads = [
    [14, 18, 5.2],
    [22, 14, 5.6],
    [30, 18, 5.1],
    [18, 25, 5.8],
    [27, 26, 5.5],
    [12, 28, 4.7],
    [23, 33, 5.2],
    [32, 30, 4.8],
  ];

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      {beads.map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={palette.base} fillOpacity="0.88" stroke={palette.rim} strokeWidth="0.9" />
          <circle cx={cx - r * 0.32} cy={cy - r * 0.32} r={r * 0.32} fill={palette.highlight} />
        </g>
      ))}
    </svg>
  );
};
