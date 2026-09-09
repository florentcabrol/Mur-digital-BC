import React from 'react';

interface GraphicPosterBackgroundProps {
  className?: string;
  intensity?: 'full' | 'subtle';
  showLines?: boolean;
}

/**
 * Graphic background reproducing the exact color palette and visual motifs
 * from the official Bleu Citron campaign image:
 * - Blanc cassé base (#efe8e8)
 * - Intersecting Cobalt Blue (#597abb) and Orange (#f49e48) beams
 * - Subtle geometric lines & accents
 */
export const GraphicPosterBackground: React.FC<GraphicPosterBackgroundProps> = ({
  className = '',
  intensity = 'full',
  showLines = true,
}) => {
  const opacityClass = intensity === 'subtle' ? 'opacity-40' : 'opacity-100';

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none bg-[#efe8e8] -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Base Blanc Cassé #efe8e8 Background */}
      <div className="absolute inset-0 bg-[#efe8e8]" />

      {/* 2. Soft tinted warm panel on the right half */}
      <div
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[55%] lg:w-[50%] bg-[#efe8e8]"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        }}
      />

      <div className={`absolute inset-0 ${opacityClass}`}>
        {/* SVG containing the exact diagonal geometric intersecting beams and lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Blue Beam (Angled from top-center diagonally to the right & bottom) */}
          <polygon
            points="680,0 860,0 1340,900 1060,900"
            fill="#597abb"
            opacity="0.95"
          />

          {/* Bottom-right blue wedge */}
          <polygon
            points="1020,810 1440,810 1440,900 1020,900"
            fill="#597abb"
          />

          {/* Orange Beam (Angled from top-right down-leftwards across the blue beam) */}
          <polygon
            points="1140,0 1320,0 910,900 660,900"
            fill="#f49e48"
            opacity="0.95"
            style={{ mixBlendMode: 'normal' }}
          />

          {/* Overlapping intersection highlight with light blue #c6d9f1 touch */}
          <polygon
            points="890,390 1050,390 990,560 850,560"
            fill="#c6d9f1"
            opacity="0.18"
          />

          {/* Crisp structural divider lines matching the poster aesthetic */}
          {showLines && (
            <>
              {/* Vertical soft divider near the middle */}
              <line
                x1="680"
                y1="0"
                x2="680"
                y2="900"
                stroke="#1F1D19"
                strokeWidth="0.75"
                strokeOpacity="0.08"
              />

              {/* Blue beam boundary line */}
              <line
                x1="680"
                y1="0"
                x2="1040"
                y2="900"
                stroke="#1F1D19"
                strokeWidth="0.75"
                strokeOpacity="0.12"
              />

              {/* Orange beam boundary line */}
              <line
                x1="1140"
                y1="0"
                x2="680"
                y2="900"
                stroke="#1F1D19"
                strokeWidth="0.75"
                strokeOpacity="0.12"
              />

              {/* Horizontal grounding line */}
              <line
                x1="1020"
                y1="810"
                x2="1440"
                y2="810"
                stroke="#1F1D19"
                strokeWidth="0.75"
                strokeOpacity="0.15"
              />
            </>
          )}
        </svg>

        {/* Delicate noise/paper texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-multiply pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#1F1D19 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>
    </div>
  );
};
