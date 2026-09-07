import React, { useState } from 'react';
import {
  QrCode as QrIcon,
  Maximize2,
  Minimize2,
  Shield,
  Palette,
  Smartphone,
  ExternalLink,
  Ticket,
} from 'lucide-react';
import { WallConfig, WallTheme } from '../types';
import { BleuCitronLogo } from './BleuCitronLogo';

interface WallHeaderProps {
  config: WallConfig;
  pendingCount: number;
  onOpenStreetPoster: () => void;
  onOpenAdmin: () => void;
  onChangeTheme: (theme: WallTheme) => void;
  onSwitchToSubmit: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const WallHeader: React.FC<WallHeaderProps> = ({
  config,
  pendingCount,
  onOpenStreetPoster,
  onOpenAdmin,
  onChangeTheme,
  onSwitchToSubmit,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [showThemePicker, setShowThemePicker] = useState(false);

  const themes: { id: WallTheme; label: string; desc: string }[] = [
    { id: 'bleu-nuit', label: 'Bleu Nuit Citron', desc: 'Fond profond & auras lumineuses' },
    { id: 'bleu-citron', label: 'Signature Électrique', desc: 'Bleu azur & accents citron' },
    { id: 'minimal-white', label: 'Galerie Épurée', desc: 'Design épuré fond blanc bleucitron.net' },
    { id: 'projection', label: 'Projection Scène', desc: 'Optimisé écrans géants & nuit' },
    { id: 'corkboard', label: 'Post-it Contemporain', desc: 'Ambiance chaleureuse' },
  ];

  const isDarkTheme =
    config.theme === 'bleu-nuit' ||
    config.theme === 'bleu-citron' ||
    config.theme === 'projection' ||
    config.theme === 'neon' ||
    config.theme === 'chalkboard';

  return (
    <header className="relative z-30 px-4 sm:px-8 py-4 transition-colors border-b border-white/[0.06] bg-[#050811]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand Identity with Official Logo from bleucitron.net */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Official Bleu Citron Logo */}
          <a
            href="https://www.bleucitron.net/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visiter bleucitron.net"
            className="hover:opacity-90 transition-opacity flex items-center"
          >
            <BleuCitronLogo className="h-9 w-auto" light={isDarkTheme} withTagline={true} />
          </a>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Livre d'or en direct</span>
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">• 40 ans de concerts & spectacles</span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-snug">
              {config.subtitle || 'Partager votre meilleur souvenir de concert / spectacle avec Bleu Citron'}
            </p>
          </div>
        </div>

        {/* Right: Controls & Action Triggers aligned with bleucitron.net */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Main QR Code & Poster Trigger (Yellow CTA as on Bleu Citron marketing) */}
          <button
            id="header-street-poster-btn"
            onClick={onOpenStreetPoster}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-2xl shadow-lg hover:shadow-yellow-400/20 transition-all text-xs sm:text-sm cursor-pointer transform hover:scale-[1.02]"
            title="Afficher l'affiche officielle avec QR Code"
          >
            <QrIcon className="w-4 h-4 text-slate-950" />
            <span>Affiche & QR Code</span>
          </button>

          {/* Participant mobile direct test */}
          <button
            id="header-mobile-submit-btn"
            onClick={onSwitchToSubmit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold backdrop-blur border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition-all cursor-pointer"
            title="Tester la page mobile du QR code"
          >
            <Smartphone className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden sm:inline">Écrire un souvenir</span>
          </button>

          {/* Link to Official Billetterie spectacles.bleucitron.net */}
          <a
            href="https://spectacles.bleucitron.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300 hover:text-white transition-colors"
            title="Accéder à la billetterie officielle Bleu Citron"
          >
            <Ticket className="w-3.5 h-3.5 text-sky-400" />
            <span>Billetterie</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          {/* Theme Switcher Dropdown */}
          <div className="relative">
            <button
              id="theme-picker-toggle-btn"
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="p-2.5 rounded-2xl text-xs font-semibold backdrop-blur border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition-all cursor-pointer"
              title="Changer d'ambiance visuelle"
            >
              <Palette className="w-4 h-4 text-slate-300" />
            </button>

            {showThemePicker && (
              <div className="absolute right-0 mt-2 w-56 bg-[#080d1e] backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 text-xs animate-fade-in">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 py-1 mb-1">
                  Ambiance du Mur
                </div>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onChangeTheme(t.id);
                      setShowThemePicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex flex-col gap-0.5 ${
                      config.theme === t.id
                        ? 'bg-yellow-400 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{t.label}</span>
                      {config.theme === t.id && <span className="text-xs font-black">✓</span>}
                    </div>
                    <span className={`text-[10px] ${config.theme === t.id ? 'text-slate-900' : 'text-slate-500'}`}>
                      {t.desc}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen Projection toggle */}
          <button
            id="fullscreen-toggle-btn"
            onClick={onToggleFullscreen}
            className="p-2.5 rounded-2xl text-xs font-semibold backdrop-blur border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition-all cursor-pointer"
            title={isFullscreen ? 'Quitter le plein écran' : 'Mode projection scène / plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Régie & Modération Admin Button */}
          <button
            id="header-admin-btn"
            onClick={onOpenAdmin}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold backdrop-blur border transition-all cursor-pointer relative ${
              pendingCount > 0
                ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-yellow-300 shadow-lg animate-pulse'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/10'
            }`}
            title="Accéder à la régie de modération"
          >
            <Shield className="w-3.5 h-3.5 text-slate-300" />
            <span>Régie</span>
            {pendingCount > 0 ? (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            ) : (
              <span className="text-[10px] opacity-60 hidden sm:inline">Florent</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
