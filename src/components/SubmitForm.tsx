import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Mail,
  User,
  CheckSquare,
  Square,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Calendar,
} from 'lucide-react';
import { WallConfig, WallMessage } from '../types';
import { BleuCitronLogo } from './BleuCitronLogo';
import { ScallopedBadge } from './ScallopedBadge';
import { AnniversaryBadge } from './AnniversaryBadge';
import { GraphicPosterBackground } from './GraphicPosterBackground';

interface SubmitFormProps {
  config: WallConfig;
  onBackToWall?: () => void;
}

export const SubmitForm: React.FC<SubmitFormProps> = ({ config, onBackToWall }) => {
  // Step: 'identity' (email + prénom + opt-in) -> 'memory' (souvenir + optional signature)
  const [step, setStep] = useState<'identity' | 'memory'>('identity');

  // Step 1 data: identification & consent
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  // Step 2 data: memory & optional signature
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
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
                spread: 75,
                origin: { y: 0.55 },
                colors: ['#4175BC', '#F59432', '#ECE8E1', '#F5EE38'],
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

  // Handle Step 1 Validation
  const handleValidateIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityError(null);

    const cleanName = firstName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setIdentityError('Merci de renseigner ton prénom.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setIdentityError('Merci de renseigner une adresse email valide.');
      return;
    }

    // Le consentement est désormais optionnel : la personne peut valider et jouer même sans cocher la case

    if (!author.trim()) {
      setAuthor(cleanName);
    }

    setStep('memory');
  };

  // Handle Final Memory Submission
  const handleSubmitMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Écris ton souvenir avant de valider.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        text: text.trim(),
        author: author.trim() ? author.trim() : 'Anonyme',
        email: email.trim(),
        optInConsent: optIn,
        color: 'yellow',
        fontFamily: 'outfit',
      };

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSubmittedMessage(data.message);

      if (data.message.status === 'approved') {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#4175BC', '#F59432', '#ECE8E1', '#F5EE38'],
        });
      }
    } catch (err: any) {
      setError(err.message || "Impossible d'enregistrer ton souvenir pour le moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setText('');
    setSubmittedMessage(null);
    setError(null);
    setStep('memory');
  };

  return (
    <div className="min-h-screen relative text-[#1F1D19] flex flex-col justify-between py-6 px-4 sm:px-6 font-sans antialiased selection:bg-[#597abb] selection:text-white bg-[#efe8e8]">
      {/* Background with exact blanc cassé, blue, and orange diagonal geometric motifs */}
      <GraphicPosterBackground intensity="full" showLines={true} />

      <div className="relative z-10 max-w-lg w-full mx-auto space-y-5">
        {/* Brand Header */}
        <header className="flex items-center justify-between pt-1">
          <a
            href="https://www.bleucitron.net/"
            target="_blank"
            rel="noopener noreferrer"
            title="Bleu Citron Productions"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <BleuCitronLogo className="h-8 w-auto" light={false} withTagline={false} />
          </a>

          {onBackToWall && (
            <button
              onClick={onBackToWall}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1F1D19] bg-[#efe8e8] hover:bg-white/80 px-3.5 py-1.5 rounded-full border border-[#1F1D19]/20 shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#597abb]" />
              <span>Voir le mur</span>
            </button>
          )}
        </header>

        {/* Hero Card: Presentation phrase + Scalloped Badge + 40! seal */}
        <div className="relative rounded-3xl bg-[#efe8e8] border border-[#1F1D19]/15 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#f49e48] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#f49e48]" />
                Bleu Citron
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#597abb]" />
                Tirage au sort le 30/09
              </span>
            </div>

            <AnniversaryBadge size={44} className="shrink-0 scale-90" />
          </div>

          <h1 className="font-poster font-black text-2xl sm:text-3xl text-[#1F1D19] leading-[1.08] tracking-tight uppercase">
            Raconte-nous ton plus<br />
            beau souvenir de concert<br />
            et tente de gagner
          </h1>

          <div className="pt-1 flex justify-start">
            <ScallopedBadge size="md" className="origin-left scale-95" />
          </div>

          <p className="text-[11px] sm:text-xs text-slate-600 font-medium pt-1">
            Tirage au sort le 30/09 • Le / la gagnant·e sera contacté·e par email
          </p>

          {step === 'memory' && !submittedMessage && (
            <div className="pt-3 flex items-center justify-between border-t border-[#1F1D19]/10 text-xs">
              <span className="text-slate-700 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Inscrit en tant que <strong>{firstName}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setStep('identity')}
                className="text-[11px] text-[#597abb] hover:text-[#4a6ca7] font-bold flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Modifier coordonnées</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Multi-Step Form */}
        <AnimatePresence mode="wait">
          {submittedMessage ? (
            /* Confirmation Screen */
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl bg-[#efe8e8] border border-[#1F1D19]/15 p-7 sm:p-8 backdrop-blur-xl shadow-xl space-y-6"
            >
              <div className="text-center space-y-2.5">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[#597abb]/10 border border-[#597abb]/30 text-[#597abb] shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <h2 className="font-poster font-bold text-2xl text-[#1F1D19] tracking-tight uppercase">
                  Merci pour ton partage !
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Ton souvenir a bien été enregistré. Bonne chance pour le tirage au sort le 30/09 !
                </p>
              </div>

              {/* Rendu du souvenir */}
              <div className="p-5 rounded-2xl bg-[#efe8e8] border border-[#1F1D19]/20 text-[#1F1D19] shadow-inner">
                <p className="text-base font-medium leading-relaxed font-outfit">
                  "{submittedMessage.text}"
                </p>
                <div className="mt-4 pt-3 border-t border-[#1F1D19]/10 flex justify-between text-xs text-slate-600">
                  <span className="font-bold text-[#1F1D19]">— {submittedMessage.author}</span>
                  <span className="text-[10px] text-[#597abb] font-bold uppercase tracking-wider">BLEU CITRON</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-3.5 px-4 bg-[#597abb] hover:bg-[#4a6ca7] text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                >
                  Partager un autre souvenir
                </button>

                {onBackToWall && (
                  <button
                    type="button"
                    onClick={onBackToWall}
                    className="w-full py-3 px-4 bg-[#efe8e8] hover:bg-white/80 text-[#1F1D19] font-semibold rounded-2xl text-xs transition-colors border border-[#1F1D19]/20 shadow-xs cursor-pointer"
                  >
                    Retourner au mur en direct
                  </button>
                )}
              </div>
            </motion.div>
          ) : step === 'identity' ? (
            /* ÉTAPE 1 : Mail + Prénom + Case Opt-in + Bouton Valider */
            <motion.form
              key="step-identity"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleValidateIdentity}
              className="rounded-3xl bg-[#efe8e8] border border-[#1F1D19]/15 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-sm sm:text-base font-bold text-[#1F1D19] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#597abb]" />
                  <span>Renseigne tes coordonnées pour participer</span>
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Remplis ton prénom et ton email pour valider ta participation au tirage au sort et publier ton souvenir.
                </p>
              </div>

              {identityError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{identityError}</span>
                </div>
              )}

              {/* Champ Prénom */}
              <div className="space-y-1.5">
                <label htmlFor="user-firstname-input" className="block text-xs font-bold text-[#1F1D19] tracking-wide">
                  Prénom <span className="text-[#f49e48]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="user-firstname-input"
                    type="text"
                    required
                    maxLength={40}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ton prénom"
                    className="w-full bg-[#efe8e8] border border-[#1F1D19]/25 focus:border-[#597abb] focus:ring-2 focus:ring-[#597abb]/20 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#1F1D19] placeholder-slate-400 transition-all outline-hidden shadow-xs"
                  />
                </div>
              </div>

              {/* Champ Email */}
              <div className="space-y-1.5">
                <label htmlFor="user-email-input" className="block text-xs font-bold text-[#1F1D19] tracking-wide">
                  Adresse email <span className="text-[#f49e48]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="user-email-input"
                    type="email"
                    required
                    maxLength={100}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton.email@exemple.com"
                    className="w-full bg-[#efe8e8] border border-[#1F1D19]/25 focus:border-[#597abb] focus:ring-2 focus:ring-[#597abb]/20 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#1F1D19] placeholder-slate-400 transition-all outline-hidden shadow-xs"
                  />
                </div>
              </div>

              {/* Case Opt-in Consentement (Optionnel sans mention 'Optionnel') */}
              <div className="pt-1">
                <label
                  htmlFor="consent-optin-checkbox"
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                    optIn
                      ? 'bg-[#597abb]/10 border-[#597abb]/40'
                      : 'bg-[#efe8e8] border-[#1F1D19]/20 hover:border-[#1F1D19]/35'
                  }`}
                >
                  <input
                    id="consent-optin-checkbox"
                    type="checkbox"
                    checked={optIn}
                    onChange={(e) => setOptIn(e.target.checked)}
                    className="sr-only"
                  />
                  <div className="mt-0.5 shrink-0">
                    {optIn ? (
                      <div className="w-5 h-5 rounded-lg bg-[#597abb] text-white flex items-center justify-center shadow-xs">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-lg border border-slate-400 flex items-center justify-center bg-[#efe8e8]">
                        <Square className="w-3.5 h-3.5 text-transparent" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 leading-snug">
                    J'accepte de recevoir par email les actualités, bons plans et offres concerts & spectacles de Bleu Citron.
                  </div>
                </label>
              </div>

              {/* Bouton VALIDER */}
              <button
                id="validate-identity-btn"
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#597abb] hover:bg-[#4a6ca7] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base cursor-pointer transform active:scale-[0.99]"
              >
                <span>Valider</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </motion.form>
          ) : (
            /* ÉTAPE 2 : Ton Souvenir (champ libre) + Signature/Prénom (facultatif) + Bouton "Partage ton souvenir" */
            <motion.form
              key="step-memory"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleSubmitMemory}
              className="rounded-3xl bg-[#efe8e8] border border-[#1F1D19]/15 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5"
            >
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Champ Libre: Ton Souvenir */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="memory-text-input" className="font-bold text-[#1F1D19] tracking-wide">
                    Ton souvenir <span className="text-[#f49e48]">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${
                    text.length > (config.maxChars || 400) - 20 ? 'text-[#f49e48]' : 'text-slate-500'
                  }`}>
                    {text.length} / {config.maxChars || 400}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="memory-text-input"
                    rows={4}
                    required
                    maxLength={config.maxChars || 400}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Raconte librement ton moment inoubliable : un concert marquant, un artiste, une émotion, une tournée..."
                    className="w-full bg-[#efe8e8] border border-[#1F1D19]/25 focus:border-[#597abb] focus:ring-2 focus:ring-[#597abb]/20 rounded-2xl p-4 text-sm sm:text-base text-[#1F1D19] placeholder-slate-400 transition-all resize-none leading-relaxed outline-hidden shadow-xs"
                  />
                </div>
              </div>

              {/* Signature / Prénom (Facultatif) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label htmlFor="signature-input" className="font-bold text-[#1F1D19] tracking-wide">
                    Signature / Prénom
                  </label>
                  <span className="text-[11px] text-[#597abb] font-semibold">Facultatif</span>
                </div>

                <input
                  id="signature-input"
                  type="text"
                  maxLength={40}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ton prénom, pseudo (laisser vide pour Anonyme)"
                  className="w-full bg-[#efe8e8] border border-[#1F1D19]/25 focus:border-[#597abb] focus:ring-2 focus:ring-[#597abb]/20 rounded-2xl px-4 py-3 text-sm text-[#1F1D19] placeholder-slate-400 transition-all outline-hidden shadow-xs"
                />
              </div>

              {/* Rendu aperçu en direct de la carte sur le mur */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#f49e48]" />
                    <span>Aperçu de ta carte</span>
                  </span>
                  <span className="text-[#597abb]">BLEU CITRON</span>
                </div>

                <div className="p-5 rounded-2xl border border-[#1F1D19]/15 bg-[#efe8e8] shadow-md relative overflow-hidden transition-all">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3 pb-2 border-b border-[#1F1D19]/10">
                    <span className="flex items-center gap-1.5 font-bold text-[#1F1D19]">
                      <span className="w-2 h-2 rounded-full bg-[#597abb]" />
                      Bleu Citron
                    </span>
                    <span className="text-slate-500 font-medium">En direct</span>
                  </div>

                  <p className="text-base sm:text-lg font-medium text-[#1F1D19] tracking-tight leading-relaxed break-words whitespace-pre-wrap font-outfit">
                    "{text.trim() || 'Ton souvenir s\'affichera ici sur le mur...'}"
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#1F1D19]/10 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">
                      — {author.trim() ? author.trim() : 'Anonyme'}
                    </span>
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#597abb] font-display">
                      SOUVENIR
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton final "Partage ton souvenir" */}
              <button
                id="submit-memory-btn"
                type="submit"
                disabled={submitting || !text.trim()}
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 bg-[#597abb] hover:bg-[#4a6ca7] disabled:opacity-40 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm sm:text-base cursor-pointer transform active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Transmission en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>Partage ton souvenir</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <footer className="text-center pt-2 pb-6 space-y-1.5 text-[11px] text-slate-600">
          <p className="font-medium">Bleu Citron Productions • Toulouse</p>
          <div className="flex items-center justify-center gap-3 text-slate-700 font-semibold">
            <a
              href="https://www.bleucitron.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#597abb] transition-colors"
            >
              bleucitron.net
            </a>
            <span>•</span>
            <a
              href="https://spectacles.bleucitron.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#597abb] transition-colors text-[#597abb]"
            >
              Billetterie -40%
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
