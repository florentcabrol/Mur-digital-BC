import React, { useState } from 'react';
import {
  QrCode as QrIcon,
  Maximize2,
  Minimize2,
  Shield,
  Smartphone,
  ExternalLink,
  Ticket,
  Calendar,
} from 'lucide-react';
import { WallConfig } from '../types';
import { BleuCitronLogo } from './BleuCitronLogo';
import { ScallopedBadge } from './ScallopedBadge';

interface WallHeaderProps {
  config: WallConfig;
  pendingCount: number;
  showRegieButton?: boolean;
  onOpenStreetPoster: () => void;
  onOpenAdmin: () => void;
  onSwitchToSubmit: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onTriggerSecretUnlock?: () => void;
}

export const WallHeader: React.FC<WallHeaderProps> = ({
  config,
  pendingCount,
  showRegieButton = false,
  onOpenStreetPoster,
  onOpenAdmin,
  onSwitchToSubmit,
  isFullscreen,
  onToggleFullscreen,
  onTriggerSecretUnlock,
}) => {
  const [logoClickCount, setLogoClickCount] = useState(0);

  const handleLogoClick = () => {
    // Secret team trigger: 3 fast clicks on the logo opens team access prompt
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount >= 3) {
      setLogoClickCount(0);
      if (onTriggerSecretUnlock) {
        onTriggerSecretUnlock();
      }
    }
    setTimeout(() => setLogoClickCount(0), 2000);
  };

  return (
    <header className="relative z-30 px-4 sm:px-8 py-3.5 transition-colors border-b border-[#1F1D19]/10 bg-[#efe8e8]/95 backdrop-blur-xl text-[#1F1D19]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Official Logo + Presentation Headline + Scalloped Badge */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
          {/* Official Bleu Citron Logo */}
          <div
            onClick={handleLogoClick}
            className="cursor-pointer select-none shrink-0 transform hover:scale-105 transition-transform"
            title="Bleu Citron Productions"
          >
            <BleuCitronLogo className="h-8 sm:h-9 w-auto" light={false} withTagline={false} />
          </div>

          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#597abb]/15 border border-[#597abb]/30 text-[#597abb]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#597abb] animate-pulse" />
                <span>Souvenirs en direct</span>
              </span>
              <span className="text-[10px] font-medium text-slate-600 hidden sm:flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#f49e48]" />
                Tirage au sort le 30/09
              </span>
            </div>

            {/* Presentation phrase + Scalloped Badge */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <h1 className="font-poster font-bold text-sm sm:text-base text-[#1F1D19] tracking-tight">
                Raconte-nous ton plus beau souvenir de concert et tente de gagner
              </h1>
              <div className="shrink-0 scale-75 origin-left hidden lg:block">
                <ScallopedBadge size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls & Action Triggers matching brand colors */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Main QR Code & Poster Trigger */}
          <button
            id="header-street-poster-btn"
            onClick={onOpenStreetPoster}
            className="flex items-center gap-2 px-4 py-2 bg-[#597abb] hover:bg-[#4a6ca7] text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm cursor-pointer transform hover:scale-[1.02]"
            title="Afficher l'affiche officielle avec QR Code"
          >
            <QrIcon className="w-4 h-4 text-white" />
            <span>Affiche & QR Code</span>
          </button>

          {/* Participant mobile direct test */}
          <button
            id="header-mobile-submit-btn"
            onClick={onSwitchToSubmit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold border border-[#1F1D19]/15 bg-[#efe8e8] hover:bg-[#efe8e8]/80 text-[#1F1D19] transition-all cursor-pointer shadow-xs"
            title="Partager un souvenir"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#f49e48]" />
            <span className="hidden sm:inline">Écrire un souvenir</span>
          </button>

          {/* Link to Official Billetterie spectacles.bleucitron.net (Nommé Billetterie -40%) */}
          <a
            href="https://spectacles.bleucitron.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold border border-[#1F1D19]/15 bg-[#efe8e8] hover:bg-[#efe8e8]/80 text-[#1F1D19] transition-colors shadow-xs"
            title="Accéder à la billetterie officielle Bleu Citron (-40%)"
          >
            <Ticket className="w-3.5 h-3.5 text-[#597abb]" />
            <span className="font-bold text-[#597abb]">Billetterie -40%</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          {/* Fullscreen Projection toggle */}
          <button
            id="fullscreen-toggle-btn"
            onClick={onToggleFullscreen}
            className="p-2.5 rounded-2xl text-xs font-semibold border border-[#1F1D19]/15 bg-[#efe8e8] hover:bg-[#efe8e8]/80 text-[#1F1D19] transition-all cursor-pointer shadow-xs"
            title={isFullscreen ? 'Quitter le plein écran' : 'Mode projection scène / plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Régie & Modération Admin Button - EXCLUSIVEMENT VISIBLE pour l'équipe autorisée */}
          {showRegieButton && (
            <button
              id="header-admin-btn"
              onClick={onOpenAdmin}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all cursor-pointer relative ${
                pendingCount > 0
                  ? 'bg-[#f49e48] hover:bg-[#EE8824] text-slate-950 border-[#f49e48] shadow-lg animate-pulse'
                  : 'bg-[#1F1D19] hover:bg-[#2F2B22] text-white border-[#1F1D19]'
              }`}
              title="Espace Régie (Équipe Bleu Citron)"
            >
              <Shield className="w-3.5 h-3.5 text-yellow-300" />
              <span>Régie</span>
              {pendingCount > 0 ? (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              ) : (
                <span className="text-[10px] opacity-75 hidden sm:inline">Équipe</span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
