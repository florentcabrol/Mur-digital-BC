import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Copy, Check, ExternalLink, Smartphone } from 'lucide-react';
import { WallConfig } from '../types';
import { ScallopedBadge } from './ScallopedBadge';
import { AnniversaryBadge } from './AnniversaryBadge';
import { BleuCitronLogo } from './BleuCitronLogo';
import { CampaignCarousel } from './CampaignCarousel';

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

    // Generate crisp QR code
    QRCode.toDataURL(url, {
      width: 600,
      margin: 1,
      color: {
        dark: '#1F1D19',
        light: '#efe8e8',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-4xl bg-[#efe8e8] border border-[#1F1D19]/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-[#1F1D19]/10 flex items-center justify-between bg-[#efe8e8] shrink-0 text-[#1F1D19]">
          <div className="flex items-center gap-3">
            <BleuCitronLogo className="h-6 w-auto" light={false} />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1F1D19] tracking-tight">
                Affiche Officielle • Bleu Citron
              </h2>
              <p className="text-[11px] text-slate-600">
                Format d'impression & d'affichage en salle et dans la rue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#597abb] hover:bg-[#4a6ca7] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Imprimer l'affiche"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-600 hover:text-[#1F1D19] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Poster Viewer Container */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-[#efe8e8] flex flex-col items-center justify-center">
          {/* THE OFFICIAL CAMPAIGN POSTER (1:1 with user image) */}
          <div
            ref={posterRef}
            id="printable-street-poster"
            className="w-full max-w-3xl bg-[#efe8e8] text-[#1F1D19] rounded-2xl shadow-xl overflow-hidden border border-[#1F1D19]/15 select-none relative"
            style={{
              aspectRatio: '1.414 / 1', // ISO paper aspect ratio
              minHeight: '480px',
            }}
          >
            <div className="w-full h-full flex flex-col md:flex-row relative">
              {/* ================= LEFT HALF ================= */}
              <div className="w-full md:w-[48%] p-6 sm:p-8 flex flex-col justify-between items-center text-center relative z-10 bg-[#efe8e8]">
                {/* 1. Presentation Headline */}
                <div className="space-y-3 w-full">
                  <h1 className="font-poster font-black text-2xl sm:text-3xl lg:text-[34px] leading-[1.08] text-[#1F1D19] tracking-tight uppercase">
                    Raconte-nous ton plus<br />
                    beau souvenir de concert<br />
                    et tente de gagner
                  </h1>

                  {/* 2. Scalloped Blue Badge: 1 AN DE SPECTACLES BLEU CITRON */}
                  <div className="flex justify-center pt-1">
                    <ScallopedBadge size="md" className="scale-90 sm:scale-100 transform origin-center" />
                  </div>
                </div>

                {/* 3. QR Code with rounded soft container */}
                <div className="my-2 p-3 sm:p-4 bg-white/80 rounded-2xl border border-[#1F1D19]/15 shadow-xs flex flex-col items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Souvenir Bleu Citron"
                      className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-[#efe8e8] animate-pulse flex items-center justify-center">
                      <span className="text-xs text-slate-500">QR Code...</span>
                    </div>
                  )}
                </div>

                {/* 4. Subtext: Tirage au sort le 30/09 */}
                <div className="text-[11px] sm:text-xs font-bold text-[#1F1D19] leading-tight space-y-0.5">
                  <p>Tirage au sort le 30/09</p>
                  <p className="font-normal text-slate-700">le / la gagnant·e sera contacté·e par email</p>
                </div>
              </div>

              {/* ================= RIGHT HALF: Campaign Carousel ================= */}
              <div className="w-full md:w-[52%] relative overflow-hidden bg-[#efe8e8] flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#1F1D19]/10">
                <CampaignCarousel className="w-full h-full min-h-[460px]" intervalMs={4000} showBadge={true} />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3.5 bg-[#efe8e8] border-t border-[#1F1D19]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-[#1F1D19] text-xs border border-[#1F1D19]/15 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Lien copié' : 'Copier le lien direct'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={submitUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/5 hover:bg-black/10 text-[#1F1D19] rounded-xl text-xs font-medium border border-[#1F1D19]/15 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Tester sur smartphone</span>
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#597abb] hover:bg-[#4a6ca7] text-white font-bold rounded-xl text-xs transition-transform hover:scale-[1.02] cursor-pointer shadow-xs"
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
