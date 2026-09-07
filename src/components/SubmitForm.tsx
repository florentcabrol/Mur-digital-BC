import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Eye,
  ShieldCheck,
  Type,
  Music2
} from 'lucide-react';
import { NoteColor, WallConfig, WallMessage } from '../types';
import { BleuCitronLogo } from './BleuCitronLogo';

interface SubmitFormProps {
  config: WallConfig;
  onBackToWall?: () => void;
}

const COLOR_OPTIONS: { id: NoteColor; label: string; bgClass: string; borderClass: string; dotClass: string; ringColor: string }[] = [
  { id: 'yellow', label: 'Citron', bgClass: 'bg-yellow-400/10', borderClass: 'border-yellow-400/40', dotClass: 'bg-yellow-400', ringColor: 'ring-yellow-400' },
  { id: 'blue', label: 'Bleu Roi', bgClass: 'bg-blue-500/10', borderClass: 'border-blue-400/40', dotClass: 'bg-blue-500', ringColor: 'ring-blue-400' },
  { id: 'pink', label: 'Rose Pop', bgClass: 'bg-pink-500/10', borderClass: 'border-pink-400/40', dotClass: 'bg-pink-500', ringColor: 'ring-pink-400' },
  { id: 'green', label: 'Émeraude', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-400/40', dotClass: 'bg-emerald-400', ringColor: 'ring-emerald-400' },
  { id: 'purple', label: 'Violet', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-400/40', dotClass: 'bg-purple-400', ringColor: 'ring-purple-400' },
  { id: 'white', label: 'Minéral', bgClass: 'bg-white/10', borderClass: 'border-white/40', dotClass: 'bg-slate-200', ringColor: 'ring-white' },
];

export interface FontOption {
  id: string;
  name: string;
  category: string;
  fontClass: string;
  glyphSample: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'outfit',
    name: 'Moderne',
    category: 'Contemporain',
    fontClass: 'font-outfit',
    glyphSample: 'Aa',
  },
  {
    id: 'caveat',
    name: 'Manuscrite',
    category: 'Spontanée',
    fontClass: 'font-caveat font-bold text-2xl',
    glyphSample: 'Aa',
  },
  {
    id: 'playfair',
    name: 'Élégante',
    category: 'Poétique',
    fontClass: 'font-playfair italic',
    glyphSample: 'Aa',
  },
  {
    id: 'syne',
    name: 'Artiste',
    category: 'Scénique',
    fontClass: 'font-syne font-bold',
    glyphSample: 'Aa',
  },
  {
    id: 'dancing',
    name: 'Festive',
    category: 'Cursive',
    fontClass: 'font-dancing font-bold text-2xl',
    glyphSample: 'Aa',
  },
  {
    id: 'space-mono',
    name: 'Billet Rétro',
    category: 'Machine',
    fontClass: 'font-space-mono text-sm',
    glyphSample: 'Aa',
  },
];

const FONT_CLASS_MAP: Record<string, string> = {
  outfit: 'font-outfit',
  caveat: 'font-caveat font-bold text-xl sm:text-2xl',
  playfair: 'font-playfair italic',
  syne: 'font-syne font-bold',
  dancing: 'font-dancing font-bold text-xl sm:text-2xl',
  'space-mono': 'font-space-mono text-base',
};

export const SubmitForm: React.FC<SubmitFormProps> = ({ config, onBackToWall }) => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState<NoteColor>('yellow');
  const [selectedFont, setSelectedFont] = useState('outfit');
  const [submitting, setSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<WallMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for message status updates once submitted
  useEffect(() => {
    if (!submittedMessage || submittedMessage.status === 'approved' || submittedMessage.status === 'rejected') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${submittedMessage.id}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== submittedMessage.status) {
            setSubmittedMessage((prev) => (prev ? { ...prev, ...data } : null));
            if (data.status === 'approved') {
              confetti({
                particleCount: 90,
                spread: 70,
                origin: { y: 0.55 },
                colors: ['#F5EE38', '#0066FF', '#FFFFFF'],
              });
            }
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [submittedMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Veuillez partager votre souvenir avant de valider.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        text: text.trim(),
        author: author.trim() ? author.trim() : 'Anonyme',
        color,
        fontFamily: selectedFont,
      };

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setSubmittedMessage(data.message);

      if (data.message.status === 'approved') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F5EE38', '#0066FF', '#FFFFFF'],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Impossible d\'enregistrer votre souvenir pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setText('');
    setAuthor('');
    setSelectedFont('outfit');
    setSubmittedMessage(null);
    setError(null);
  };

  const currentColorConfig = COLOR_OPTIONS.find((c) => c.id === color) || COLOR_OPTIONS[0];
  const activeFontClass = FONT_CLASS_MAP[selectedFont] || 'font-outfit';

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 relative selection:bg-yellow-400 selection:text-slate-950 font-sans antialiased">
      {/* Subtle architectural atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-b from-blue-900/20 via-blue-950/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-yellow-400/[0.03] blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full mx-auto space-y-6">
        {/* Brand Header */}
        <header className="flex items-center justify-between pt-1">
          <a
            href="https://www.bleucitron.net/"
            target="_blank"
            rel="noopener noreferrer"
            title="Bleu Citron Productions"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <BleuCitronLogo className="h-8 w-auto" light={true} withTagline={true} />
          </a>

          {onBackToWall && (
            <button
              onClick={onBackToWall}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 rounded-full border border-white/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-yellow-400" />
              <span>Voir le mur</span>
            </button>
          )}
        </header>

        {/* Hero Card: Épuré, Moderne & Élégant */}
        <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
              Livre d'or
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Bleu Citron
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug font-display">
            Partager votre meilleur souvenir de concert / spectacle avec Bleu Citron
          </h1>
        </div>

        {/* Form or Confirmation State */}
        <AnimatePresence mode="wait">
          {!submittedMessage ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onSubmit={handleSubmit}
              className="rounded-3xl bg-[#080d1e]/80 border border-white/[0.08] p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-6"
            >
              {error && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Champ Libre: Votre Souvenir */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="memory-text-input" className="font-semibold text-slate-200 tracking-wide">
                    Votre souvenir
                  </label>
                  <span className={`text-[11px] font-mono ${
                    text.length > (config.maxChars || 400) - 20 ? 'text-yellow-400' : 'text-slate-500'
                  }`}>
                    {text.length} / {config.maxChars || 400}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="memory-text-input"
                    rows={4}
                    maxLength={config.maxChars || 400}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Racontez librement votre moment inoubliable : un concert marquant, un artiste, une émotion, une tournée..."
                    className="w-full bg-[#050812] border border-white/10 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 rounded-2xl p-4 text-sm sm:text-base text-white placeholder-slate-500 transition-all resize-none leading-relaxed outline-hidden"
                  />
                </div>
              </div>

              {/* Choix de la police d'écriture (6 styles épurés avec changement temps réel) */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200 tracking-wide flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Style de typographie</span>
                  </span>
                  <span className="text-[11px] text-yellow-400 font-medium">
                    {FONT_OPTIONS.find((f) => f.id === selectedFont)?.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = selectedFont === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setSelectedFont(font.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-yellow-400/80 bg-yellow-400/[0.08] text-white shadow-lg shadow-yellow-400/5 ring-1 ring-yellow-400/50'
                            : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-semibold text-white">
                            {font.name}
                          </span>
                          <span className={`${font.fontClass} text-base ${isSelected ? 'text-yellow-400' : 'text-slate-400'}`}>
                            {font.glyphSample}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {font.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champ Libre et Facultatif: Signature / Prénom */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="signature-input" className="font-semibold text-slate-200 tracking-wide">
                    Signature / Prénom
                  </label>
                  <span className="text-[11px] text-slate-400">Facultatif</span>
                </div>

                <input
                  id="signature-input"
                  type="text"
                  maxLength={40}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Votre prénom, pseudo (laisser vide pour Anonyme)"
                  className="w-full bg-[#050812] border border-white/10 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 transition-all outline-hidden"
                />
              </div>

              {/* Nuance de la carte (palette épurée) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200 tracking-wide">
                    Couleur de la carte
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentColorConfig.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setColor(opt.id)}
                      title={opt.label}
                      className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                        color === opt.id
                          ? 'ring-2 ring-yellow-400 scale-105 bg-white/[0.08]'
                          : 'hover:bg-white/[0.05] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${opt.dotClass} shadow-xs`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Aperçu en direct (rendu épuré, digne d'un cartel d'exposition ou billet de concert) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Aperçu en temps réel</span>
                  </span>
                  <span className="text-yellow-400">BLEU CITRON</span>
                </div>

                <div className={`p-6 rounded-2xl border ${currentColorConfig.borderClass} bg-[#060a17]/90 backdrop-blur-xl shadow-xl relative overflow-hidden transition-all`}>
                  {/* Discreet top thread */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-3 pb-2 border-b border-white/[0.06]">
                    <span className="flex items-center gap-1.5 font-semibold text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      Bleu Citron
                    </span>
                    <span className="text-slate-400">En direct</span>
                  </div>

                  {/* Souvenir text displayed in chosen font */}
                  <p className={`text-lg font-medium text-white tracking-tight leading-relaxed break-words whitespace-pre-wrap ${activeFontClass}`}>
                    "{text.trim() || 'Votre souvenir s\'affichera ici avec la police choisie...'}"
                  </p>

                  <div className="mt-5 pt-3 border-t border-white/[0.06] flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-300">
                      — {author.trim() ? author.trim() : 'Anonyme'}
                    </span>
                    <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400/90 font-display">
                      BLEU CITRON
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton de confirmation épuré & contrasté */}
              <button
                id="submit-memory-btn"
                type="submit"
                disabled={submitting || !text.trim()}
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-slate-950 font-bold rounded-2xl shadow-xl hover:shadow-yellow-400/20 transition-all text-sm sm:text-base cursor-pointer transform active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Transmission en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-slate-950" />
                    <span>Partager mon souvenir</span>
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            /* Écran de confirmation après envoi */
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl bg-[#080d1e]/90 border border-white/[0.08] p-7 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2.5">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 shadow-xl">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <h2 className="text-xl font-bold text-white tracking-tight font-display">
                  Merci pour votre partage
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Votre souvenir a bien été transmis à l'équipe de Bleu Citron.
                </p>
              </div>

              {/* Rendu du souvenir */}
              <div className="p-5 rounded-2xl bg-[#050812] border border-white/10 text-slate-100">
                <p className={`text-base font-medium text-white leading-relaxed ${
                  FONT_CLASS_MAP[submittedMessage.fontFamily || 'outfit'] || 'font-outfit'
                }`}>
                  "{submittedMessage.text}"
                </p>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-between text-xs text-slate-400">
                  <span>— {submittedMessage.author}</span>
                  <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">BLEU CITRON</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={resetForm}
                  className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Partager un autre souvenir</span>
                </button>

                {onBackToWall && (
                  <button
                    onClick={onBackToWall}
                    className="w-full py-3 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium rounded-2xl text-xs border border-white/10 transition-colors cursor-pointer"
                  >
                    Voir l'ensemble des souvenirs
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer officiel inspiré de bleucitron.net */}
        <footer className="text-center text-[11px] text-slate-500 py-4 space-y-1">
          <p className="font-semibold text-slate-400 tracking-wider">BLEU CITRON PRODUCTIONS</p>
          <p className="text-[10px] text-slate-500">
            Toulouse • 40 ans de concerts, spectacles & festivals •{' '}
            <a
              href="https://www.bleucitron.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:underline font-medium"
            >
              bleucitron.net
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};
