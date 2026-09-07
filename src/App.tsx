import React, { useState, useEffect, useCallback } from 'react';
import { WallMessage, WallConfig, WallTheme } from './types';
import { WallHeader } from './components/WallHeader';
import { WallBoard } from './components/WallBoard';
import { StreetPosterModal } from './components/StreetPosterModal';
import { QrCodeModal } from './components/QrCodeModal';
import { SubmitForm } from './components/SubmitForm';
import { AdminPanel } from './components/AdminPanel';
import { BleuCitronLogo } from './components/BleuCitronLogo';

export default function App() {
  const [viewMode, setViewMode] = useState<'wall' | 'submit' | 'admin'>('wall');
  const [config, setConfig] = useState<WallConfig>({
    title: 'Bleu Citron',
    subtitle: 'Partager votre meilleur souvenir de concert / spectacle avec Bleu Citron',
    campaignCity: 'Bleu Citron',
    theme: 'bleu-nuit',
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
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  // Real-time synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    fetchConfig();
    fetchMessages();

    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('message_created', (event) => {
        const payload = JSON.parse(event.data);
        const newMsg: WallMessage = payload.data;

        setAllMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);

        if (newMsg.status === 'approved') {
          setWallMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
          playNewMessageSound();
        }
      });

      eventSource.addEventListener('message_updated', (event) => {
        const payload = JSON.parse(event.data);
        const updatedMsg: WallMessage = payload.data;

        setAllMessages((prev) =>
          prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
        );

        if (updatedMsg.status === 'approved') {
          setWallMessages((prev) => {
            const exists = prev.some((m) => m.id === updatedMsg.id);
            if (exists) {
              return prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m));
            }
            playNewMessageSound();
            return [updatedMsg, ...prev];
          });
        } else {
          // If rejected or archived, remove from active wall
          setWallMessages((prev) => prev.filter((m) => m.id !== updatedMsg.id));
        }
      });

      eventSource.addEventListener('message_deleted', (event) => {
        const payload = JSON.parse(event.data);
        const { id } = payload.data;
        setAllMessages((prev) => prev.filter((m) => m.id !== id));
        setWallMessages((prev) => prev.filter((m) => m.id !== id));
      });

      eventSource.addEventListener('messages_bulk_updated', () => {
        fetchMessages();
      });

      eventSource.addEventListener('all_messages_archived', () => {
        fetchMessages();
      });

      eventSource.addEventListener('wall_reset', () => {
        fetchMessages();
      });

      eventSource.addEventListener('config_updated', (event) => {
        const payload = JSON.parse(event.data);
        setConfig(payload.data);
      });
    } catch (err) {
      console.warn('SSE connection failed, fallback to polling', err);
    }

    // Polling fallback every 6 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 6000);

    return () => {
      eventSource?.close();
      clearInterval(interval);
    };
  }, [fetchConfig, fetchMessages]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Admin Actions
  const handleModerate = async (
    id: string,
    action: 'approve' | 'reject' | 'archive' | 'unarchive' | 'delete' | 'pin',
    data?: { text?: string; author?: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/moderate/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error('Moderation error:', err);
    }
  };

  const handleBulkModerate = async (ids: string[], action: 'approve' | 'reject' | 'archive' | 'delete') => {
    try {
      const res = await fetch('/api/admin/bulk-moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error('Bulk moderation error:', err);
    }
  };

  const handleArchiveAll = async () => {
    try {
      const res = await fetch('/api/admin/archive-all', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error('Archive all error:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/admin/reset-demo', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch (err) {
      console.error('Reset demo error:', err);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<WallConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
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

  const handleChangeTheme = (theme: WallTheme) => {
    handleUpdateConfig({ theme });
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

  // View: Main Interactive Wall
  return (
    <div className={`min-h-screen flex flex-col transition-colors theme-${config.theme}`}>
      {/* Wall Header */}
      <WallHeader
        config={config}
        pendingCount={pendingCount}
        onOpenStreetPoster={() => setIsPosterModalOpen(true)}
        onOpenAdmin={() => switchMode('admin')}
        onChangeTheme={handleChangeTheme}
        onSwitchToSubmit={() => switchMode('submit')}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Interactive Wall Board */}
      <WallBoard
        messages={wallMessages}
        config={config}
        onOpenPosterModal={() => setIsPosterModalOpen(true)}
      />

      {/* Official Footer inspired by bleucitron.net */}
      <footer className="mt-auto border-t border-white/[0.06] bg-[#03060f]/90 py-6 px-6 text-center z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <BleuCitronLogo className="h-6 w-auto" light={true} />
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Basée à Toulouse • 40 ans de concerts & spectacles
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <a
              href="https://www.bleucitron.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition-colors"
            >
              bleucitron.net
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://spectacles.bleucitron.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition-colors"
            >
              Billetterie
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://www.bleucitron.net/festivals"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition-colors"
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

      {/* Admin Panel Modal / Overlay */}
      {viewMode === 'admin' && (
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
        />
      )}
    </div>
  );
}
