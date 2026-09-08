import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';
import { WallConfig } from '../types';
import { BleuCitronLogo } from './BleuCitronLogo';

interface StreetPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WallConfig;
}

export const StreetPosterModal: React.FC<StreetPosterModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [submitUrl, setSubmitUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/?mode=submit`;
    setSubmitUrl(url);

    QRCode.toDataURL(url, {
      width: 500,
      margin: 2,
      color: {
        dark: '#050811',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((data) => setQrDataUrl(data))
      .catch((err) => console.error('Failed to generate poster QR:', err));
  }, []);

  const handleCopyLink = () => {
    if (navigator.clipboard && submitUrl) {
      navigator.clipboard.writeText(submitUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl font-sans">
      <div className="relative w-full max-w-xl bg-[#080d1e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#080d1e] shrink-0">
          <div className="flex items-center gap-3">
            <BleuCitronLogo className="h-7 w-auto" light={true} />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Affiche & QR Code Bleu Citron
              </h2>
              <p className="text-xs text-slate-400">
                Format d'impression officiel • bleucitron.net
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Imprimer l'affiche"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Poster Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-[#04060d] flex flex-col items-center justify-center">
          {/* Architectural Poster Card */}
          <div
            ref={posterRef}
            id="printable-street-poster"
            className="w-full max-w-md bg-[#070b18] text-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/10 relative flex flex-col items-center text-center select-none overflow-hidden"
          >
            {/* Top Brand Header with Official Logo */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 mb-5">
              <BleuCitronLogo className="h-10 w-auto" light={true} />
              <div className="flex items-center gap-2 text-[10px] text-yellow-400 font-semibold uppercase tracking-widest pt-1">
                <span>Concerts</span>
                <span>•</span>
                <span>Spectacles</span>
                <span>•</span>
                <span>Festivals</span>
              </div>
            </div>

            {/* Campaign Main Title */}
            <div className="relative z-10 space-y-1.5 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase font-display leading-tight">
                Ton Meilleur Souvenir
              </h1>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Partage en direct ton souvenir de concert ou de spectacle
              </p>
            </div>

            {/* QR Code Container */}
            <div className="relative z-10 bg-white p-4 rounded-3xl shadow-xl border-2 border-yellow-400 mb-6">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Affiche"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-slate-100 flex items-center justify-center">
                  <span className="text-xs text-slate-400 animate-pulse">Génération...</span>
                </div>
              )}
              <div className="mt-2 text-[10px] font-bold text-slate-900 flex items-center justify-center gap-1.5 tracking-wide uppercase">
                <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                <span>Scanne avec ton téléphone</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="relative z-10 w-full grid grid-cols-3 gap-2 text-center pt-2 pb-3 border-t border-white/10 text-[10px]">
              <div className="p-2 rounded-xl bg-white/[0.03]">
                <div className="font-bold text-yellow-400">1. SCANNE</div>
                <div className="text-slate-400 text-[9px] mt-0.5">Le QR Code</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03]">
                <div className="font-bold text-white">2. ÉCRIS</div>
                <div className="text-slate-400 text-[9px] mt-0.5">Ton souvenir</div>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03]">
                <div className="font-bold text-yellow-400">3. PARTAGE</div>
                <div className="text-slate-400 text-[9px] mt-0.5">En direct</div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-4 text-[10px] text-slate-400">
              <span>Bleu Citron • </span>
              <span className="text-yellow-400 font-semibold">bleucitron.net</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#080d1e] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs border border-white/10 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Lien copié' : 'Copier le lien'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={submitUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 rounded-xl text-xs font-medium border border-white/10 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ouvrir la page mobile</span>
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-xl text-xs transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer l'affiche</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
