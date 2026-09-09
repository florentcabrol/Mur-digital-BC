import React, { useState, useEffect, useCallback } from 'react';
import { Lock, KeyRound, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import { WallMessage, WallConfig, WallTheme } from './types';
import { WallHeader } from './components/WallHeader';
import { WallBoard } from './components/WallBoard';
import { StreetPosterModal } from './components/StreetPosterModal';
import { QrCodeModal } from './components/QrCodeModal';
import { SubmitForm } from './components/SubmitForm';
import { AdminPanel } from './components/AdminPanel';
import { BleuCitronLogo } from './components/BleuCitronLogo';
import { GraphicPosterBackground } from './components/GraphicPosterBackground';

export default function App() {
  const [viewMode, setViewMode] = useState<'wall' | 'submit' | 'admin'>('wall');
  const [config, setConfig] = useState<WallConfig>({
    title: 'Bleu Citron',
    subtitle: 'Raconte-nous ton plus beau souvenir de concert et tente de gagner 1 an de spectacles Bleu Citron',
    campaignCity: 'Bleu Citron',
    theme: 'bleu-citron',
    allowAnonymous: true,
    maxChars: 400,
    autoApproveSafe: false,
  });

  const [wallMessages, setWallMessages] = useState<WallMessage[]>([]);
  const [allMessages, setAllMessages] = useState<WallMessage[]>([]);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Protected team access for "Régie"
  const [hasRegieAccess, setHasRegieAccess] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('regie') === '1' ||
        params.get('regie') === 'true' ||
        params.get('admin') === '1' ||
        params.get('team') === '1' ||
        params.get('secret') === 'bleucitron'
      ) {
        localStorage.setItem('bleucitron_regie_access', 'true');
        return true;
      }
      return localStorage.getItem('bleucitron_regie_access') === 'true';
    }
    return false;
  });

  const [isSecretUnlockOpen, setIsSecretUnlockOpen] = useState(false);
  const [unlockPasscode, setUnlockPasscode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Parse initial mode from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'submit') {
        setViewMode('submit');
      } else if (modeParam === 'admin') {
        setViewMode('admin');
      }
    }
  }, []);

  // Update browser URL query without reload when switching modes
  const switchMode = (mode: 'wall' | 'submit' | 'admin') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (mode === 'wall') {
        url.searchParams.delete('mode');
      } else {
        url.searchParams.set('mode', mode);
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = unlockPasscode.trim().toLowerCase();
    if (clean === 'bleucitron' || clean === 'regie' || clean === 'equipe') {
      localStorage.setItem('bleucitron_regie_access', 'true');
      setHasRegieAccess(true);
      setIsSecretUnlockOpen(false);
      setUnlockPasscode('');
      setUnlockError(null);
      switchMode('admin');
    } else {
      setUnlockError("Code d'accès incorrect. Cet espace est strictement réservé à l'équipe Bleu Citron.");
    }
  };

  const handleLockRegie = () => {
    localStorage.removeItem('bleucitron_regie_access');
    setHasRegieAccess(false);
    switchMode('wall');
  };

  // Fetch initial config and messages
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      // Fetch public wall messages (approved only)
      const wallRes = await fetch('/api/messages?view=wall');
      if (wallRes.ok) {
        const data = await wallRes.json();
        setWallMessages(data);
      }

      // Fetch all messages for admin
      const allRes = await fetch('/api/messages?view=admin');
      if (allRes.ok) {
        const data = await allRes.json();
        setAllMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subtle audio notification for new approved messages on the wall
  const playNewMessageSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Server-Sent Events (SSE) for Real-Time synchronization
  useEffect(() => {
    fetchConfig();
    fetchMessages();

    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message_approved') {
          setWallMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [data.message, ...prev];
          });
          setAllMessages((prev) =>
            prev.map((m) => (m.id === data.message.id ? data.message : m))
          );
          playNewMessageSound();
        } else if (data.type === 'message_created') {
          setAllMessages((prev) => [data.message, ...prev]);
          if (data.message.status === 'approved') {
            setWallMessages((prev) => [data.message, ...prev]);
            playNewMessageSound();
          }
        } else if (data.type === 'message_updated') {
          setAllMessages((prev) =>
            prev.map((m) => (m.id === data.message.id ? data.message : m))
          );
          if (data.message.status === 'approved') {
            setWallMessages((prev) => {
              const exists = prev.some((m) => m.id === data.message.id);
              if (exists) {
                return prev.map((m) => (m.id === data.message.id ? data.message : m));
              } else {
                return [data.message, ...prev];
              }
            });
          } else {
            setWallMessages((prev) => prev.filter((m) => m.id !== data.message.id));
          }
        } else if (data.type === 'message_deleted') {
          setWallMessages((prev) => prev.filter((m) => m.id !== data.id));
          setAllMessages((prev) => prev.filter((m) => m.id !== data.id));
        } else if (data.type === 'messages_bulk_updated') {
          fetchMessages();
        } else if (data.type === 'all_messages_archived') {
          setWallMessages([]);
          fetchMessages();
        } else if (data.type === 'config_updated') {
          setConfig(data.config);
        } else if (data.type === 'demo_reset') {
          fetchMessages();
        }
      } catch (err) {
        console.error('SSE parsing error:', err);
      }
    };

    eventSource.onerror = () => {
      // Reconnect automatically
    };

    // Fallback polling every 8s in case SSE is interrupted
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 8000);

    return () => {
      eventSource.close();
      clearInterval(pollInterval);
    };
  }, [fetchConfig, fetchMessages]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Admin moderation actions
  const handleModerate = async (
    id: string,
    action: 'approve' | 'reject' | 'archive' | 'unarchive' | 'delete' | 'pin',
    data?: { text?: string; author?: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (res.ok) {
        const result = await res.json();
        if (action === 'delete') {
          setWallMessages((prev) => prev.filter((m) => m.id !== id));
          setAllMessages((prev) => prev.filter((m) => m.id !== id));
        } else if (result.message) {
          setAllMessages((prev) =>
            prev.map((m) => (m.id === id ? result.message : m))
          );
          if (result.message.status === 'approved') {
            setWallMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = result.message;
                return next;
              }
              return [result.message, ...prev];
            });
          } else {
            setWallMessages((prev) => prev.filter((m) => m.id !== id));
          }
        }
      }
    } catch (err) {
      console.error('Moderation error:', err);
    }
  };

  const handleBulkModerate = async (
    ids: string[],
    action: 'approve' | 'reject' | 'archive' | 'delete'
  ) => {
    try {
      const res = await fetch('/api/admin/bulk-moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Bulk moderation error:', err);
    }
  };

  const handleArchiveAll = async () => {
    try {
      const res = await fetch('/api/admin/archive-all', { method: 'POST' });
      if (res.ok) {
        setWallMessages([]);
        fetchMessages();
      }
    } catch (err) {
      console.error('Archive all error:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Reset demo error:', err);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<WallConfig>) => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
      }
    } catch (err) {
      console.error('Update config error:', err);
    }
  };

  const pendingCount = allMessages.filter((m) => m.status === 'pending').length;

  // View: Submit Form (Direct landing page when scanning QR Code on street poster)
  if (viewMode === 'submit') {
    return (
      <SubmitForm
        config={config}
        onBackToWall={() => switchMode('wall')}
      />
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col text-[#1F1D19] bg-[#efe8e8] selection:bg-[#4175BC] selection:text-white">
      {/* Background with exact blanc cassé, blue, and orange geometric beam motif from the poster */}
      <GraphicPosterBackground intensity="full" showLines={true} />

      {/* Wall Header with restricted Régie button */}
      <WallHeader
        config={config}
        pendingCount={pendingCount}
        showRegieButton={hasRegieAccess}
        onOpenStreetPoster={() => setIsPosterModalOpen(true)}
        onOpenAdmin={() => switchMode('admin')}
        onSwitchToSubmit={() => switchMode('submit')}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onTriggerSecretUnlock={() => setIsSecretUnlockOpen(true)}
      />

      {/* Interactive Wall Board */}
      <WallBoard
        messages={wallMessages}
        config={config}
        onOpenPosterModal={() => setIsPosterModalOpen(true)}
      />

      {/* Official Footer styled with the campaign aesthetic */}
      <footer className="mt-auto border-t border-[#1F1D19]/10 bg-[#efe8e8]/95 backdrop-blur-md py-6 px-6 text-center z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-3">
            <BleuCitronLogo className="h-6 w-auto" light={false} />
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-[11px] text-slate-600 hidden sm:inline">
              Basée à Toulouse • 40 ans de concerts & spectacles (1986–2026)
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <a
              href="https://www.bleucitron.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#597abb] transition-colors"
            >
              bleucitron.net
            </a>
            <span className="text-slate-400">•</span>
            {/* Renommé en Billetterie -40% */}
            <a
              href="https://spectacles.bleucitron.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#4a6ca7] transition-colors font-bold text-[#597abb]"
            >
              Billetterie -40%
            </a>
            <span className="text-slate-400">•</span>
            <a
              href="https://www.bleucitron.net/festivals"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#597abb] transition-colors"
            >
              Festivals & Prestations
            </a>
          </div>

          <div className="text-[11px] text-slate-500">
            © 2026 Bleu Citron Productions • Toulouse
          </div>
        </div>
      </footer>

      {/* Street Poster Physical Mockup & Print Modal */}
      <StreetPosterModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        config={config}
      />

      {/* Quick QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        wallTitle={config.title}
      />

      {/* Secret Team Unlock Modal */}
      {isSecretUnlockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#080d1e] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-100">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                    <KeyRound className="w-5 h-5" />
                  </span>
                  <h3 className="font-bold text-base sm:text-lg text-white font-display">
                    Accès Équipe Bleu Citron
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Espace Régie & Modération réservé au personnel autorisé
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSecretUnlockOpen(false);
                  setUnlockError(null);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {unlockError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs rounded-2xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{unlockError}</span>
              </div>
            )}

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Mot de passe régie
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={unlockPasscode}
                  onChange={(e) => setUnlockPasscode(e.target.value)}
                  placeholder="Code régie"
                  className="w-full bg-[#040711] border border-white/10 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-hidden"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSecretUnlockOpen(false);
                    setUnlockError(null);
                  }}
                  className="flex-1 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-2xl text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                >
                  Déverrouiller
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Panel Modal / Overlay (Strictly gated by hasRegieAccess) */}
      {viewMode === 'admin' && (
        hasRegieAccess ? (
          <AdminPanel
            messages={allMessages}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onModerate={handleModerate}
            onBulkModerate={handleBulkModerate}
            onArchiveAll={handleArchiveAll}
            onResetDemo={handleResetDemo}
            onClose={() => switchMode('wall')}
            onOpenQrModal={() => setIsPosterModalOpen(true)}
            onLockRegie={handleLockRegie}
          />
        ) : (
          /* Authentication Gate for direct URL visitors without credentials */
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-md bg-[#080d1e] border border-white/10 rounded-3xl p-7 shadow-2xl space-y-5 text-slate-100">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-yellow-400/10 border border-yellow-400/30 text-yellow-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white font-display">
                  Espace Régie Réservé
                </h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Cet espace est strictement réservé à l'équipe de production Bleu Citron.
                </p>
              </div>

              {unlockError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs rounded-2xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{unlockError}</span>
                </div>
              )}

              <form onSubmit={handleUnlockSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Mot de passe régie
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={unlockPasscode}
                    onChange={(e) => setUnlockPasscode(e.target.value)}
                    placeholder="Code régie (ex: bleucitron)"
                    className="w-full bg-[#040711] border border-white/10 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-hidden"
                  />
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => switchMode('wall')}
                    className="flex-1 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Retour au mur
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    Accéder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      )}
    </div>
  );
}
