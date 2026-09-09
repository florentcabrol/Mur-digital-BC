import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode as QrIcon,
  Search,
  Sparkles,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { WallMessage, WallConfig } from '../types';
import { StickyNote } from './StickyNote';
import { ScallopedBadge } from './ScallopedBadge';
import { AnniversaryBadge } from './AnniversaryBadge';
import { CampaignCarousel } from './CampaignCarousel';

interface WallBoardProps {
  messages: WallMessage[];
  config: WallConfig;
  onOpenPosterModal: () => void;
  onSelectMessage?: (msg: WallMessage) => void;
}

export const WallBoard: React.FC<WallBoardProps> = ({
  messages,
  config,
  onOpenPosterModal,
  onSelectMessage,
}) => {
  const [filterText, setFilterText] = useState('');
  const [miniQrUrl, setMiniQrUrl] = useState<string>('');

  // Generate mini QR for on-screen corner widget
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const submitUrl = `${window.location.origin}/?mode=submit`;
    QRCode.toDataURL(submitUrl, {
      width: 180,
      margin: 1,
      color: { dark: '#1F1D19', light: '#FFFFFF' },
    })
      .then((url) => setMiniQrUrl(url))
      .catch((err) => console.error(err));
  }, []);

  const filteredMessages = messages.filter((m) => {
    if (!filterText.trim()) return true;
    const query = filterText.toLowerCase();
    return m.text.toLowerCase().includes(query) || m.author.toLowerCase().includes(query);
  });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col relative pb-36 font-sans">
      {/* Campaign Hero Showcase matching the poster identity */}
      <div className="mb-8 rounded-3xl bg-[#efe8e8] backdrop-blur-xl border border-[#1F1D19]/15 shadow-xl overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-stretch justify-between relative">
          {/* Left Column: Presentation Phrase + Scalloped Badge + Call to action */}
          <div className="p-6 sm:p-8 lg:w-[54%] flex flex-col justify-between space-y-4 relative z-10 bg-[#efe8e8]">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#f49e48]/15 border border-[#f49e48]/30 text-[#f49e48] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#f49e48]" />
                  Activation Officielle
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#597abb]" />
                  Tirage au sort le 30/09
                </span>
              </div>

              <h2 className="font-poster font-black text-2xl sm:text-3xl lg:text-4xl text-[#1F1D19] leading-[1.08] tracking-tight uppercase">
                Raconte-nous ton plus<br className="hidden sm:inline" />
                beau souvenir de concert<br className="hidden sm:inline" />
                et tente de gagner
              </h2>

              <div className="pt-1">
                <ScallopedBadge size="md" />
              </div>

              <p className="text-xs text-slate-600 font-medium pt-1">
                Tirage au sort le 30/09 • Le / la gagnant·e sera contacté·e par email
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenPosterModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#597abb] hover:bg-[#4a6ca7] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <QrIcon className="w-4 h-4 text-white" />
                <span>Afficher l'affiche & QR Code</span>
              </button>
            </div>
          </div>

          {/* Right Column: 40-Year Campaign Carousel cycling every 3 seconds */}
          <div className="lg:w-[46%] bg-[#efe8e8] min-h-[320px] lg:min-h-0 flex flex-col justify-between relative overflow-hidden border-t lg:border-t-0 lg:border-l border-[#1F1D19]/10">
            <CampaignCarousel
              className="w-full h-full min-h-[340px]"
              intervalMs={4000}
              showBadge={true}
              onOpenFullModal={onOpenPosterModal}
            />
          </div>
        </div>
      </div>

      {/* Top Bar with Live Count & Search filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#efe8e8] border border-[#1F1D19]/15 text-[#1F1D19] font-bold shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#597abb] animate-pulse" />
            <span>{messages.length} {messages.length > 1 ? 'souvenirs partagés' : 'souvenir partagé'}</span>
          </span>
          <span className="text-[11px] text-slate-600 font-medium">
            En direct du mur
          </span>
        </div>

        {/* Filter input */}
        {messages.length > 2 && (
          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un souvenir, un artiste..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl text-xs backdrop-blur border border-[#1F1D19]/20 bg-[#efe8e8] text-[#1F1D19] placeholder-slate-500 focus:outline-hidden focus:border-[#597abb] transition-all shadow-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages Grid or Empty State */}
      {filteredMessages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[380px]">
          <div className="p-8 sm:p-10 max-w-md rounded-3xl backdrop-blur-xl border border-[#1F1D19]/15 bg-[#efe8e8] text-[#1F1D19] shadow-xl space-y-5">
            <div className="w-14 h-14 bg-[#597abb]/10 border border-[#597abb]/30 text-[#597abb] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display tracking-tight">Le Mur attend ton souvenir</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                Scanne le QR Code pour écrire ton premier souvenir de concert avec Bleu Citron.
              </p>
            </div>
            <button
              onClick={onOpenPosterModal}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#597abb] hover:bg-[#4a6ca7] text-white font-bold rounded-2xl text-xs shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <QrIcon className="w-4 h-4 text-white" />
              <span>Afficher l'affiche & QR Code</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((msg) => (
              <StickyNote
                key={msg.id}
                message={msg}
                onSelect={onSelectMessage}
                theme={config.theme}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Floating On-Screen Corner QR Code Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <div
          onClick={onOpenPosterModal}
          className="group bg-[#efe8e8] hover:bg-[#efe8e8]/95 backdrop-blur-2xl border border-[#1F1D19]/20 hover:border-[#597abb] rounded-3xl p-3.5 shadow-2xl flex items-center gap-3.5 cursor-pointer transition-all hover:scale-105 select-none"
          title="Cliquez pour agrandir l'affiche et son QR Code"
        >
          {miniQrUrl ? (
            <div className="p-1 rounded-2xl bg-[#efe8e8] border border-[#1F1D19]/10 shadow-xs flex items-center justify-center">
              <img
                src={miniQrUrl}
                alt="QR Code"
                className="w-14 h-14 rounded-xl object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <QrIcon className="w-6 h-6 text-[#597abb] animate-pulse" />
            </div>
          )}
          <div className="pr-2 space-y-0.5 text-left">
            <span className="flex items-center gap-1 text-[9px] font-black text-[#f49e48] uppercase tracking-widest font-display">
              <Sparkles className="w-2.5 h-2.5" />
              1 an de spectacles
            </span>
            <p className="text-xs font-black text-[#1F1D19] leading-tight font-poster uppercase">
              Scanne l'affiche
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              pour tenter de gagner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
