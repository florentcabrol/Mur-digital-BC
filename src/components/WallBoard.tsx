import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import {
  QrCode as QrIcon,
  Search,
  Sparkles,
  Radio
} from 'lucide-react';
import { WallMessage, WallConfig } from '../types';
import { StickyNote } from './StickyNote';

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
      width: 160,
      margin: 1,
      color: { dark: '#050811', light: '#ffffff' },
    })
      .then((url) => setMiniQrUrl(url))
      .catch((err) => console.error(err));
  }, []);

  const filteredMessages = messages.filter((m) => {
    if (!filterText.trim()) return true;
    const query = filterText.toLowerCase();
    return m.text.toLowerCase().includes(query) || m.author.toLowerCase().includes(query);
  });

  const isDark =
    config.theme === 'bleu-nuit' ||
    config.theme === 'bleu-citron' ||
    config.theme === 'projection' ||
    config.theme === 'neon' ||
    config.theme === 'chalkboard';

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col relative pb-36 font-sans">
      {/* Top Bar with Live Count & Search filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-200 font-medium backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>{messages.length} {messages.length > 1 ? 'souvenirs projetés' : 'souvenir projeté'}</span>
          </span>
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Mise à jour en temps réel
          </span>
        </div>

        {/* Filter input */}
        {messages.length > 2 && (
          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un mot, un auteur..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2 rounded-2xl text-xs backdrop-blur border focus:outline-hidden transition-all shadow-xs ${
                  isDark
                    ? 'bg-[#080d1e]/80 border-white/10 text-white placeholder-slate-500 focus:border-yellow-400/80'
                    : 'bg-white/80 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Messages Grid or Empty State */}
      {filteredMessages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[420px]">
          <div className={`p-8 sm:p-10 max-w-md rounded-3xl backdrop-blur-xl border shadow-2xl space-y-5 ${
            isDark
              ? 'bg-[#080d1e]/80 border-white/10 text-white'
              : 'bg-white/95 border-slate-200 text-slate-900'
          }`}>
            <div className="w-14 h-14 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display tracking-tight">Le Mur attend tes souvenirs</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Scanne le QR Code pour écrire ton premier souvenir de concert avec Bleu Citron.
              </p>
            </div>
            <button
              onClick={onOpenPosterModal}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-2xl text-xs shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <QrIcon className="w-4 h-4 text-slate-950" />
              <span>Afficher le QR Code</span>
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

      {/* Floating On-Screen Corner QR Code Widget (Sleek, minimal, modern) */}
      <div className="fixed bottom-6 right-6 z-40">
        <div
          onClick={onOpenPosterModal}
          className="group bg-[#080d1e]/95 hover:bg-[#0c142b]/95 backdrop-blur-2xl border border-white/15 hover:border-yellow-400/60 rounded-3xl p-3.5 shadow-2xl flex items-center gap-3.5 cursor-pointer transition-all hover:scale-105 select-none"
          title="Cliquez pour agrandir l'affiche et son QR Code"
        >
          {miniQrUrl ? (
            <div className="p-1 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <img
                src={miniQrUrl}
                alt="QR Code"
                className="w-14 h-14 rounded-xl object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center">
              <QrIcon className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          )}
          <div className="pr-2 space-y-0.5 text-left">
            <span className="flex items-center gap-1 text-[9px] font-black text-yellow-400 uppercase tracking-widest font-display">
              <Sparkles className="w-2.5 h-2.5" />
              Bleu Citron
            </span>
            <p className="text-xs font-bold text-white leading-tight font-display">
              Scanne l'affiche
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              pour écrire en direct
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
