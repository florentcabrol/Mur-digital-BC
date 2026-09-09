import React, { useState, useEffect } from 'react';

interface ScallopedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Pastille officielle "1 AN DE SPECTACLES BLEU CITRON"
 * Intègre directement le visuel PNG transparent officiel,
 * sans altération, ni bouton d'import sur le site public.
 */
export const ScallopedBadge: React.FC<ScallopedBadgeProps> = ({
  className = '',
  size = 'md',
}) => {
  const [version, setVersion] = useState<number>(Date.now());

  // Synchronisation avec les mises à jour d'assets depuis la régie
  useEffect(() => {
    const handleUpdate = () => {
      setVersion(Date.now());
    };
    window.addEventListener('pastille_asset_updated', handleUpdate);
    return () => {
      window.removeEventListener('pastille_asset_updated', handleUpdate);
    };
  }, []);

  const sizeClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12 md:h-14',
    lg: 'h-16 sm:h-20',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      title="1 an de spectacles Bleu Citron"
    >
      {/* Visuel PNG officiel transparent */}
      <img
        src={`/images/PASTILLE%201%20AN%20DE%20SPECTACLES.png?v=${version}`}
        alt="1 an de spectacles Bleu Citron"
        className={`${sizeClasses[size]} w-auto object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105 pointer-events-none`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = `/images/pastille.png?v=${version}`;
        }}
      />
    </div>
  );
};
