import React from 'react';

interface AnniversaryBadgeProps {
  className?: string;
  size?: number; // width/height in px, default 96
}

export const AnniversaryBadge: React.FC<AnniversaryBadgeProps> = ({
  className = '',
  size = 96,
}) => {
  // Generate 16-point starburst path
  const points = 16;
  const outerR = 56;
  const innerR = 47;
  const center = 60;
  let pathD = '';

  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    if (i === 0) {
      pathD += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    } else {
      pathD += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
  }
  pathD += ' Z';

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}
      title="40 ans de Bleu Citron (1986–2026)"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-auto max-w-full transform hover:rotate-3 transition-transform"
      >
        {/* Starburst polygon */}
        <path d={pathD} fill="#1F1D19" />

        {/* Text inside starburst */}
        <text
          x="60"
          y="48"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="'Barlow Condensed', 'Outfit', 'Arial Black', sans-serif"
          fontWeight="900"
          fontSize="28"
          letterSpacing="-0.5"
        >
          40!
        </text>

        <text
          x="60"
          y="62"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="'Barlow Condensed', 'Outfit', sans-serif"
          fontWeight="800"
          fontSize="9.5"
          letterSpacing="0.8"
        >
          BLEU CITRON
        </text>

        <text
          x="60"
          y="72"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="'Barlow Condensed', 'Outfit', sans-serif"
          fontWeight="700"
          fontSize="8"
          letterSpacing="0.4"
        >
          L'ANNIVERSAIRE
        </text>

        <text
          x="60"
          y="82"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="'Barlow Condensed', 'Outfit', sans-serif"
          fontWeight="800"
          fontSize="8"
          letterSpacing="0.6"
        >
          1986–2026
        </text>
      </svg>
    </div>
  );
};
