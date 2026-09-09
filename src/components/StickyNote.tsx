import React from 'react';
import { motion } from 'motion/react';
import { Pin, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { WallMessage, NoteColor, WallTheme } from '../types';

interface StickyNoteProps {
  message: WallMessage;
  onSelect?: (msg: WallMessage) => void;
  showAdminBadge?: boolean;
  theme?: WallTheme;
}

const COLOR_STYLES: Record<NoteColor, {
  bg: string;
  border: string;
  text: string;
  accentBar: string;
  dot: string;
  tagBg: string;
}> = {
  yellow: {
    bg: 'bg-[#efe8e8]',
    border: 'border-[#f49e48]/35 hover:border-[#f49e48]',
    text: 'text-[#1F1D19]',
    accentBar: 'bg-[#f49e48]',
    dot: 'bg-[#f49e48]',
    tagBg: 'text-[#f49e48] bg-[#f49e48]/10',
  },
  pink: {
    bg: 'bg-[#efe8e8]',
    border: 'border-pink-300 hover:border-pink-500',
    text: 'text-[#1F1D19]',
    accentBar: 'bg-pink-400',
    dot: 'bg-pink-500',
    tagBg: 'text-pink-600 bg-pink-50',
  },
  blue: {
    bg: 'bg-[#efe8e8]',
    border: 'border-[#597abb]/35 hover:border-[#597abb]',
    text: 'text-[#1F1D19]',
    accentBar: 'bg-[#597abb]',
    dot: 'bg-[#597abb]',
    tagBg: 'text-[#597abb] bg-[#597abb]/10',
  },
  green: {
    bg: 'bg-[#efe8e8]',
    border: 'border-emerald-300 hover:border-emerald-500',
    text: 'text-[#1F1D19]',
    accentBar: 'bg-emerald-400',
    dot: 'bg-emerald-500',
    tagBg: 'text-emerald-700 bg-emerald-50',
  },
  purple: {
    bg: 'bg-[#efe8e8]',
    border: 'border-purple-300 hover:border-purple-500',
    text: 'text-[#1F1D19]',
    accentBar: 'bg-purple-400',
    dot: 'bg-purple-500',
    tagBg: 'text-purple-700 bg-purple-50',
  },
  orange: {
    bg: 'bg-[#efe8e8]',
    border: 'border-[#f49e48]/45 hover:border-[#f49e48]',
    text: 'text-[#1F1D19]',
    accentBar: 'bg-[#f49e48]',
    dot: 'bg-[#f49e48]',
    tagBg: 'text-[#f49e48] bg-[#f49e48]/10',
  },
  white: {
    bg: 'bg-[#efe8e8]',
    border: 'border-[#1F1D19]/15 hover:border-[#1F1D19]/40',
    text: 'text-[#1F1D19]',
    accentBar: 'bg-[#597abb]',
    dot: 'bg-[#597abb]',
    tagBg: 'text-[#597abb] bg-[#597abb]/10',
  },
};

const FONT_CLASSES: Record<string, string> = {
  outfit: 'font-outfit',
  caveat: 'font-caveat font-bold text-xl sm:text-2xl',
  playfair: 'font-playfair italic',
  syne: 'font-syne font-bold',
  dancing: 'font-dancing font-bold text-xl sm:text-2xl',
  'space-mono': 'font-space-mono text-sm sm:text-base',
};

export const StickyNote: React.FC<StickyNoteProps> = ({ message, onSelect, showAdminBadge, theme = 'bleu-citron' }) => {
  const style = COLOR_STYLES[message.color] || COLOR_STYLES.yellow;

  const formatTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "À l'instant";
    if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
    if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
    return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const isCorkboard = theme === 'corkboard';
  const fontClass = FONT_CLASSES[message.fontFamily || 'outfit'] || 'font-outfit';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      whileHover={{ scale: 1.02, y: -3, zIndex: 30 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{ rotate: isCorkboard ? `${message.rotation}deg` : '0deg' }}
      onClick={() => onSelect?.(message)}
      className={`relative p-6 rounded-3xl border ${style.bg} ${style.border} ${style.text} shadow-lg hover:shadow-xl cursor-pointer transition-all select-none group flex flex-col justify-between min-h-[190px] overflow-hidden`}
    >
      {/* Top edge accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${style.accentBar} opacity-80 group-hover:opacity-100 transition-opacity`} />

      {/* Top Header: Clean metadata */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#1F1D19]/10">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className="text-[10px] font-black tracking-widest uppercase text-slate-600 font-display">
            Bleu Citron
          </span>
          {message.pinned && (
            <span title="Épinglé" className="ml-1">
              <Pin className="w-3.5 h-3.5 text-[#F59432] fill-[#F59432]/30" />
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3 h-3 opacity-60" />
          <span className="text-[10px] font-medium">{formatTime(message.createdAt)}</span>
        </div>
      </div>

      {/* Message Body with typography */}
      <div className="py-2 flex-1 flex items-center">
        <p className={`text-base sm:text-lg font-medium tracking-tight leading-relaxed break-words whitespace-pre-wrap ${fontClass} text-[#1F1D19]`}>
          "{message.text}"
        </p>
      </div>

      {/* Footer / Signature */}
      <div className="pt-3 border-t border-[#1F1D19]/10 flex items-center justify-between text-xs mt-3">
        <span className="font-bold tracking-tight text-xs text-slate-800">
          — {message.author || 'Anonyme'}
        </span>
        <span className={`text-[9px] tracking-widest font-black uppercase px-2 py-0.5 rounded-md ${style.tagBg} font-display`}>
          SOUVENIR
        </span>
      </div>

      {/* Optional Admin AI Moderation Indicator */}
      {showAdminBadge && (
        <div className="mt-3 pt-2 flex items-center justify-between text-[10px] border-t border-[#1F1D19]/10 text-slate-500">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>IA: {message.aiModeration.verdict}</span>
          </span>
          <span className="font-mono text-[9px]">Tox: {message.aiModeration.toxicityScore}%</span>
        </div>
      )}
    </motion.div>
  );
};
