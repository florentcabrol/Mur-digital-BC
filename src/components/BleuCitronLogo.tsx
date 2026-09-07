import React from 'react';

interface BleuCitronLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'monochrome';
  light?: boolean;
  withTagline?: boolean;
}

export const BleuCitronLogo: React.FC<BleuCitronLogoProps> = ({
  className = 'h-8 w-auto',
  variant = 'full',
  light = true,
  withTagline = false,
}) => {
  // Letters color: on dark backgrounds (light=true) BLEU & CRON are white, 'I' is bright citron yellow (#F5EE38).
  // On light backgrounds (light=false), BLEU & CRON are deep navy (#0e1a38 / #1e87f0), 'I' is yellow-amber (#eab308).
  const mainColor = light ? '#FFFFFF' : '#0B132B';
  const accentColor = '#F5EE38'; // Citron signature

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 380 160"
        className="h-full w-auto max-h-12 select-none shrink-0"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
      >
        {/* BLEU */}
        <g fill={variant === 'monochrome' ? 'currentColor' : mainColor}>
          <path d="M80.5,1.8h29.6c14,0,21.8,8.1,21.8,18.9c0,6-2.9,11-7.4,13.8v0.6c4.5,2.3,9.7,7.3,9.7,15.9c0,13.2-10.6,20.8-22,20.8H80.5V1.8z M107.1,28.9c4.1,0,6.2-2.6,6.2-6.1c0-3.2-2.3-5.6-6.2-5.6h-8.4v11.7H107.1z M106.8,55.9c4.3,0,7-2.3,7-6.9c0-4.3-3.2-6.6-7-6.6h-8.1v13.5H106.8z"/>
          <path d="M140.3,1.8h19.2v53h26.2v17h-45.5V1.8z"/>
          <path d="M191.7,1.8h46.4V18h-27.1v10.6h22.9v16.2h-22.9v10.7h28.1v16.3h-47.4V1.8z"/>
          <path d="M244.1,44.5V1.8h19.2v42.6c0,6.7,3.5,10.6,10.3,10.6c6.8,0,10.3-3.9,10.3-10.6V1.8h19.2v42.7c0,17-12.1,28.6-29.5,28.6C256.2,73.2,244.1,61.6,244.1,44.5z"/>
        </g>

        {/* CITRON: C, T, R, O, N */}
        <g fill={variant === 'monochrome' ? 'currentColor' : mainColor}>
          <path d="M4.5,121.9c0-20.6,15-36.3,37.2-36.3c20.3,0,33.4,12.9,35.7,28.8H56.6C55.4,109,50.1,104,41.7,104c-10.6,0-17.2,7.7-17.2,17.8c0,10.3,6.6,17.8,17.2,17.8c8.2,0,13.6-4.9,15.7-10h20.9c-2.3,15.8-16.5,28.5-36.6,28.5C19.4,158.2,4.5,142.6,4.5,121.9z"/>
          <path d="M130.4,103.4h-18.8V86.9h57v16.5h-18.9v53.5h-19.2V103.4z"/>
          <path d="M174.6,86.8h29c14.4,0,25.7,9.9,25.7,24.2c0,8.9-4.6,16.2-11.4,20.5l14.2,25.3h-21.1l-10.4-21.3h-6.8v21.3h-19.2V86.8z M201.7,119.3c4.6,0,8.2-3,8.2-8.3c0-5.2-3.6-8-8.2-8h-7.8v16.3H201.7z"/>
          <path d="M232.7,121.9c0-20.6,16.1-36.3,37.7-36.3c21.6,0,37.6,15.9,37.6,36.3c0,20.5-16.1,36.3-37.6,36.3C248.7,158.2,232.7,142.6,232.7,121.9z M288,121.9c0-9.9-7.2-17.8-17.6-17.8c-10.6,0-17.7,7.9-17.7,17.8c0,10.1,7.1,17.8,17.7,17.8C280.8,139.7,288,132,288,121.9z"/>
          <path d="M312.2,86.8h21.5l22.6,38.9h0.6V86.8h18.5v70H354L331.3,118h-0.6v38.9h-18.5V86.8z"/>
        </g>

        {/* CITRON: Iconic Tilted 'I' with Round Dot (The signature highlight) */}
        <g fill={variant === 'monochrome' ? 'currentColor' : accentColor}>
          <polygon points="89.9,156.9 108.9,156.9 102.2,102.6 83.5,104.9"/>
          <path d="M92.2,99.5c6.2-0.8,10.1-4.8,9.4-10.8c-0.7-6-5.5-9-11.7-8.2c-6.2,0.8-10.1,4.9-9.4,10.8C81.3,97.3,86.1,100.2,92.2,99.5z"/>
        </g>
      </svg>

      {withTagline && (
        <div className="hidden sm:flex flex-col border-l border-white/15 pl-3 text-left">
          <span className={`text-[10px] font-black uppercase tracking-widest ${light ? 'text-white' : 'text-slate-900'}`}>
            PRODUCTIONS
          </span>
          <span className="text-[9px] text-yellow-400 font-medium tracking-wide">
            Spectacles & Festivals
          </span>
        </div>
      )}
    </div>
  );
};
