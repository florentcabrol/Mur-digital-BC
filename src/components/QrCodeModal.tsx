import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode as QrIcon, Smartphone, Download, ExternalLink } from 'lucide-react';
import { BleuCitronLogo } from './BleuCitronLogo';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallTitle: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, wallTitle }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Compute submission link
  const submitUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?mode=submit`
    : '';

  useEffect(() => {
    if (!submitUrl) return;
    QRCode.toDataURL(submitUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#050811',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [submitUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(submitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode_bleu_citron_${wallTitle.replace(/\s+/g, '_').toLowerCase()}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-sans">
      <div 
        id="qr-modal-container"
        className="relative w-full max-w-md bg-[#080d1e] rounded-3xl shadow-2xl border border-white/10 overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="p-6 text-center relative border-b border-white/10 bg-[#080d1e]">
          <button
            id="close-qr-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-full p-2 transition-colors cursor-pointer border border-white/10"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center justify-center gap-1.5 mb-3">
            <BleuCitronLogo className="h-8 w-auto" light={true} />
            <span className="text-[10px] text-yellow-400 font-semibold tracking-wider uppercase">
              Partagez votre souvenir
            </span>
          </div>

          <h2 className="text-lg font-bold tracking-tight text-white font-display">
            Affiche & QR Code
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
            Scannez pour écrire et projeter votre souvenir en direct
          </p>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center bg-[#050811]">
          {/* QR Code Container */}
          <div className="relative p-3.5 bg-white rounded-3xl shadow-2xl border-2 border-yellow-400 mb-5">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code pour écrire un souvenir"
                className="w-48 h-48 sm:w-52 sm:h-52 rounded-2xl object-contain"
              />
            ) : (
              <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center bg-slate-100 text-slate-400">
                <QrIcon className="w-12 h-12 animate-pulse text-slate-800" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-2.5 text-center pointer-events-none">
              <span className="bg-[#050811]/90 text-yellow-300 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-yellow-400/30">
                Appareil photo
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-1 mb-5">
            <p className="text-xs font-semibold text-white">
              Scannez pour écrire en direct
            </p>
            <p className="text-[11px] text-slate-400">
              Chaque participant partage son souvenir librement
            </p>
          </div>

          {/* Direct Link Action */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 p-2.5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs text-slate-300">
              <span className="truncate flex-1 font-mono text-[11px] select-all text-slate-400 pl-1">
                {submitUrl}
              </span>
              <button
                id="copy-submit-link-btn"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                id="download-qr-btn"
                onClick={handleDownloadQr}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10 rounded-2xl text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </button>

              <a
                href={submitUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-2xl text-xs shadow-md transition-transform hover:scale-[1.02]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tester la page</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
