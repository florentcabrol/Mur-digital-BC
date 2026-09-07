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

const COLOR_STYLES_DARK: Record<NoteColor, {
  bg: string;
  border: string;
  text: string;
  accentBar: string;
  dot: string;
}> = {
  yellow: {
    bg: 'bg-[#090e1f]/90 backdrop-blur-xl',
    border: 'border-yellow-400/25 hover:border-yellow-400/60',
    text: 'text-white',
    accentBar: 'bg-yellow-400',
    dot: 'bg-yellow-400',
  },
  pink: {
    bg: 'bg-[#090e1f]/90 backdrop-blur-xl',
    border: 'border-pink-400/25 hover:border-pink-400/60',
    text: 'text-white',
    accentBar: 'bg-pink-400',
    dot: 'bg-pink-400',
  },
  blue: {
    bg: 'bg-[#090e1f]/90 backdrop-blur-xl',
    border: 'border-blue-400/25 hover:border-blue-400/60',
    text: 'text-white',
    accentBar: 'bg-blue-400',
    dot: 'bg-blue-400',
  },
  green: {
    bg: 'bg-[#090e1f]/90 backdrop-blur-xl',
    border: 'border-emerald-400/25 hover:border-emerald-400/60',
    text: 'text-white',
    accentBar: 'bg-emerald-400',
    dot: 'bg-emerald-400',
  },
  purple: {
    bg: 'bg-[#090e1f]/90 backdrop-blur-xl',
    border: 'border-purple-400/25 hover:border-purple-400/60',
    text: 'text-white',
    accentBar: 'bg-purple-400',
    dot: 'bg-purple-400',
  },
  orange: {
    bg: 'bg-[#090e1f]/90 backdrop-blur-xl',
    border: 'border-orange-400/25 hover:border-orange-400/60',
    text: 'text-white',
    accentBar: 'bg-orange-400',
    dot: 'bg-orange-400',
  },
  white: {
    bg: 'bg-[#090e1f]/90 backdrop-blur-xl',
    border: 'border-white/15 hover:border-white/40',
    text: 'text-white',
    accentBar: 'bg-white',
    dot: 'bg-white',
  },
};

const COLOR_STYLES_LIGHT: Record<NoteColor, {
  bg: string;
  border: string;
  text: string;
  accentBar: string;
  dot: string;
}> = {
  yellow: {
    bg: 'bg-white/95 backdrop-blur-md',
    border: 'border-amber-200 hover:border-amber-400',
    text: 'text-slate-900',
    accentBar: 'bg-amber-400',
    dot: 'bg-amber-500',
  },
  pink: {
    bg: 'bg-white/95 backdrop-blur-md',
    border: 'border-pink-200 hover:border-pink-400',
    text: 'text-slate-900',
    accentBar: 'bg-pink-400',
    dot: 'bg-pink-500',
  },
  blue: {
    bg: 'bg-white/95 backdrop-blur-md',
    border: 'border-sky-200 hover:border-sky-400',
    text: 'text-slate-900',
    accentBar: 'bg-blue-500',
    dot: 'bg-blue-500',
  },
  green: {
    bg: 'bg-white/95 backdrop-blur-md',
    border: 'border-emerald-200 hover:border-emerald-400',
    text: 'text-slate-900',
    accentBar: 'bg-emerald-400',
    dot: 'bg-emerald-500',
  },
  purple: {
    bg: 'bg-white/95 backdrop-blur-md',
    border: 'border-purple-200 hover:border-purple-400',
    text: 'text-slate-900',
    accentBar: 'bg-purple-400',
    dot: 'bg-purple-500',
  },
  orange: {
    bg: 'bg-white/95 backdrop-blur-md',
    border: 'border-orange-200 hover:border-orange-400',
    text: 'text-slate-900',
    accentBar: 'bg-orange-400',
    dot: 'bg-orange-500',
  },
  white: {
    bg: 'bg-white/95 backdrop-blur-md',
    border: 'border-slate-200 hover:border-slate-400',
    text: 'text-slate-900',
    accentBar: 'bg-slate-400',
    dot: 'bg-slate-500',
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

export const StickyNote: React.FC<StickyNoteProps> = ({ message, onSelect, showAdminBadge, theme = 'bleu-nuit' }) => {
  const isDark = theme === 'bleu-nuit' || theme === 'bleu-citron' || theme === 'projection' || theme === 'neon' || theme === 'chalkboard';
  const styleMap = isDark ? COLOR_STYLES_DARK : COLOR_STYLES_LIGHT;
  const style = styleMap[message.color] || styleMap.yellow;

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
      className={`relative p-6 rounded-3xl border ${style.bg} ${style.border} ${style.text} shadow-xl hover:shadow-2xl cursor-pointer transition-all select-none group flex flex-col justify-between min-h-[190px] overflow-hidden`}
    >
      {/* Subtle top edge accent thread */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${style.accentBar} opacity-60 group-hover:opacity-100 transition-opacity`} />

      {/* Top Header: Clean metadata */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
            Bleu Citron
          </span>
          {message.pinned && (
            <span title="Épinglé" className="ml-1">
              <Pin className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/30" />
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3 h-3 opacity-60" />
          <span className="text-[10px] font-medium">{formatTime(message.createdAt)}</span>
        </div>
      </div>

      {/* Message Body with custom typography */}
      <div className="py-2 flex-1 flex items-center">
        <p className={`text-base sm:text-lg font-medium tracking-tight leading-relaxed break-words whitespace-pre-wrap ${fontClass} ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          "{message.text}"
        </p>
      </div>

      {/* Footer / Signature */}
      <div className={`pt-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} flex items-center justify-between text-xs mt-3`}>
        <span className={`font-semibold tracking-tight text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          — {message.author || 'Anonyme'}
        </span>
        <span className="text-[9px] tracking-widest font-black uppercase text-yellow-400/90 font-display">
          SOUVENIR
        </span>
      </div>

      {/* Optional Admin AI Moderation Indicator */}
      {showAdminBadge && (
        <div className="mt-3 pt-2 flex items-center justify-between text-[10px] border-t border-white/5 text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>IA: {message.aiModeration.verdict}</span>
          </span>
          <span className="font-mono text-[9px]">Tox: {message.aiModeration.toxicityScore}%</span>
        </div>
      )}
    </motion.div>
  );
};
