import React from 'react';
import { BuyerOutfit } from '../game/types';

interface BuyerArtworkProps {
  outfit: BuyerOutfit;
  size?: number;
  className?: string;
}

export const BuyerArtwork: React.FC<BuyerArtworkProps> = ({
  outfit,
  size = 160,
  className = '',
}) => {
  const skinTone =
    outfit === 'LANSIA' ? '#D6A682' : outfit === 'SD' ? '#E4B894' : '#DCA982';
  const skinShadow = '#BE8862';

  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 160 184"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`skin-${outfit}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skinTone} />
          <stop offset="100%" stopColor={skinShadow} />
        </linearGradient>
        <linearGradient id="batikGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C2D12" />
          <stop offset="50%" stopColor="#9A3412" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
        <linearGradient id="dasterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="100%" stopColor="#115E59" />
        </linearGradient>
        <linearGradient id="adatGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#854D0E" />
          <stop offset="100%" stopColor="#422006" />
        </linearGradient>
      </defs>

      {/* Soft ground shadow */}
      <ellipse cx="80" cy="176" rx="44" ry="6" fill="rgba(0,0,0,0.28)" />

      {/* Torso / Attire */}
      {outfit === 'SD' && (
        <g>
          {/* Backpack straps & bag behind */}
          <rect x="44" y="96" width="72" height="60" rx="14" fill="#1D4ED8" />
          {/* White shirt */}
          <path d="M52 98 C52 88, 108 88, 108 98 L114 140 L46 140 Z" fill="#F8FAFC" />
          {/* Red SD shorts/skirt */}
          <rect x="48" y="136" width="64" height="36" rx="6" fill="#DC2626" />
          {/* Red tie */}
          <path d="M77 95 L83 95 L84 120 L80 126 L76 120 Z" fill="#DC2626" />
          {/* Pocket badge */}
          <rect x="90" y="108" width="10" height="10" rx="2" fill="#EF4444" />
        </g>
      )}

      {outfit === 'REMAJA' && (
        <g>
          {/* Hoodie */}
          <path d="M40 100 C42 84, 118 84, 120 100 L126 172 L34 172 Z" fill="#0369A1" />
          <path d="M58 92 Q80 108 102 92" stroke="#0C4A6E" strokeWidth="4" fill="none" />
          {/* Hoodie pocket */}
          <path d="M56 138 L104 138 L110 162 L50 162 Z" fill="#0284C7" opacity="0.7" />
          {/* Drawstrings */}
          <line x1="72" y1="98" x2="72" y2="118" stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="88" y1="98" x2="88" y2="118" stroke="#E0F2FE" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {outfit === 'BATIK' && (
        <g>
          {/* Modern Batik shirt */}
          <path d="M38 100 C40 84, 120 84, 122 100 L126 172 L34 172 Z" fill="url(#batikGrad)" />
          {/* Subtle gold parang motifs */}
          <path d="M48 112 Q60 104 72 114 T96 112 T114 116" stroke="#F59E0B" strokeWidth="2" opacity="0.55" fill="none" />
          <path d="M44 134 Q58 124 72 134 T100 132 T118 136" stroke="#FBBF24" strokeWidth="2" opacity="0.45" fill="none" />
          <path d="M46 154 Q62 146 78 156 T112 154" stroke="#F59E0B" strokeWidth="2" opacity="0.5" fill="none" />
          {/* Collar */}
          <path d="M66 88 L80 104 L94 88" fill="#451A03" stroke="#D97706" strokeWidth="1.2" />
        </g>
      )}

      {outfit === 'DASTER' && (
        <g>
          {/* Casual teal floral daster */}
          <path d="M42 98 C44 86, 116 86, 118 98 L128 172 L32 172 Z" fill="url(#dasterGrad)" />
          <circle cx="62" cy="122" r="5" fill="#FDE047" opacity="0.7" />
          <circle cx="96" cy="136" r="6" fill="#FDA4AF" opacity="0.7" />
          <circle cx="68" cy="154" r="5" fill="#FDA4AF" opacity="0.6" />
          {/* Shopping tote */}
          <rect x="108" y="134" width="26" height="32" rx="4" fill="#F59E0B" />
          <path d="M114 134 C114 120, 128 120, 128 134" stroke="#B45309" strokeWidth="3" fill="none" />
        </g>
      )}

      {outfit === 'LANSIA' && (
        <g>
          {/* Koko shirt */}
          <path d="M40 100 C42 86, 118 86, 120 100 L124 172 L36 172 Z" fill="#E2E8F0" />
          <rect x="74" y="90" width="12" height="44" fill="#CBD5E1" />
          <path d="M74 96 L86 96 M74 108 L86 108 M74 120 L86 120" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Walking stick */}
          <path d="M128 118 L128 174" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
          <path d="M128 118 C128 110, 138 110, 138 118" stroke="#78350F" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      )}

      {outfit === 'ADAT' && (
        <g>
          {/* Respectful Beskap + Gold embroidery */}
          <path d="M38 100 C40 84, 120 84, 122 100 L126 172 L34 172 Z" fill="url(#adatGrad)" />
          <path d="M68 88 L80 116 L92 88" stroke="#FACC15" strokeWidth="2.5" fill="none" />
          <circle cx="80" cy="126" r="2.5" fill="#FDE047" />
          <circle cx="80" cy="140" r="2.5" fill="#FDE047" />
          <circle cx="80" cy="154" r="2.5" fill="#FDE047" />
        </g>
      )}

      {/* Neck & Head */}
      <rect x="70" y="74" width="20" height="20" rx="8" fill={skinShadow} />
      <ellipse cx="80" cy="58" rx="24" ry="28" fill={`url(#skin-${outfit})`} />

      {/* Ears */}
      <ellipse cx="55" cy="60" rx="4.5" ry="7" fill={skinShadow} />
      <ellipse cx="105" cy="60" rx="4.5" ry="7" fill={skinShadow} />

      {/* Hair / Headgear */}
      {outfit === 'LANSIA' ? (
        <g>
          {/* Grey hair side + Black Peci */}
          <path d="M56 50 C56 38, 104 38, 104 50" fill="#CBD5E1" />
          <path d="M56 44 C56 26, 104 26, 104 44 L102 48 L58 48 Z" fill="#1E293B" />
        </g>
      ) : outfit === 'ADAT' ? (
        <g>
          {/* Blangkon */}
          <path d="M54 46 C54 24, 106 24, 106 46 Z" fill="#92400E" />
          <path d="M54 42 Q80 49 106 42" stroke="#FACC15" strokeWidth="2" fill="none" />
        </g>
      ) : outfit === 'REMAJA' ? (
        <g>
          {/* Cap */}
          <path d="M54 46 C54 24, 106 24, 106 46 Z" fill="#0EA5E9" />
          <path d="M54 44 L116 44 C112 40, 96 38, 80 39 Z" fill="#0284C7" />
        </g>
      ) : outfit === 'DASTER' ? (
        <g>
          {/* Hair bun */}
          <circle cx="80" cy="24" r="11" fill="#1E1B18" />
          <path d="M54 54 C54 28, 106 28, 106 54 C96 42, 64 42, 54 54 Z" fill="#1E1B18" />
        </g>
      ) : (
        <path d="M55 52 C55 26, 105 26, 105 52 C96 40, 64 40, 55 52 Z" fill="#1E1B18" />
      )}

      {/* Friendly semi-realistic eyes, brows, nose, smile */}
      <path d="M64 51 Q70 48 75 51" stroke="#3F2E21" strokeWidth="2" strokeLinecap="round" />
      <path d="M85 51 Q90 48 96 51" stroke="#3F2E21" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="70" cy="57" rx="3.2" ry="3.6" fill="#FFFFFF" />
      <ellipse cx="90" cy="57" rx="3.2" ry="3.6" fill="#FFFFFF" />
      <circle cx="70.5" cy="57.2" r="2.1" fill="#1E293B" />
      <circle cx="90.5" cy="57.2" r="2.1" fill="#1E293B" />
      <circle cx="71.2" cy="56.4" r="0.7" fill="#FFFFFF" />
      <circle cx="91.2" cy="56.4" r="0.7" fill="#FFFFFF" />

      {/* Subtle nose & warm smile */}
      <path d="M79 58 Q81 64 78 66" stroke={skinShadow} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M72 72 Q80 78 88 72" stroke="#9A3412" strokeWidth="2.2" strokeLinecap="round" fill="none" />

      {/* Subtle blush */}
      <ellipse cx="64" cy="65" rx="4" ry="2.2" fill="#F43F5E" opacity="0.2" />
      <ellipse cx="96" cy="65" rx="4" ry="2.2" fill="#F43F5E" opacity="0.2" />
    </svg>
  );
};
