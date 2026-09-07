import React, { useState } from 'react';
import {
  Check,
  X,
  Archive,
  RotateCcw,
  Trash2,
  Edit3,
  Pin,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
  Sliders,
  Sparkles,
  Inbox,
  LayoutGrid,
  Search,
  ExternalLink,
  QrCode as QrIcon,
  RefreshCw,
  Eye,
  CheckCheck
} from 'lucide-react';
import { WallMessage, WallConfig, ModerationStats, NoteColor } from '../types';
import { BleuCitronLogo } from './BleuCitronLogo';

interface AdminPanelProps {
  messages: WallMessage[];
  config: WallConfig;
  onUpdateConfig: (newConfig: Partial<WallConfig>) => Promise<void>;
  onModerate: (id: string, action: 'approve' | 'reject' | 'archive' | 'unarchive' | 'delete' | 'pin', data?: { text?: string; author?: string }) => Promise<void>;
  onBulkModerate: (ids: string[], action: 'approve' | 'reject' | 'archive' | 'delete') => Promise<void>;
  onArchiveAll: () => Promise<void>;
  onResetDemo: () => Promise<void>;
  onClose: () => void;
  onOpenQrModal: () => void;
}

type AdminTab = 'pending' | 'active' | 'archived' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  messages,
  config,
  onUpdateConfig,
  onModerate,
  onBulkModerate,
  onArchiveAll,
  onResetDemo,
  onClose,
  onOpenQrModal,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState<WallMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  // Settings form state
  const [settingsTitle, setSettingsTitle] = useState(config.title);
  const [settingsSubtitle, setSettingsSubtitle] = useState(config.subtitle);
  const [settingsCity, setSettingsCity] = useState(config.campaignCity || 'Toulouse & Rues Connectées');
  const [settingsTheme, setSettingsTheme] = useState(config.theme);
  const [settingsAutoApprove, setSettingsAutoApprove] = useState(config.autoApproveSafe);
  const [settingsAllowAnon, setSettingsAllowAnon] = useState(config.allowAnonymous);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Filter messages by status
  const pendingMessages = messages.filter((m) => m.status === 'pending');
  const activeMessages = messages.filter((m) => m.status === 'approved');
  const archivedMessages = messages.filter((m) => m.status === 'archived');
  const rejectedMessages = messages.filter((m) => m.status === 'rejected');

  const stats: ModerationStats = {
    total: messages.length,
    pending: pendingMessages.length,
    approved: activeMessages.length,
    rejected: rejectedMessages.length,
    archived: archivedMessages.length,
  };

  const handleStartEdit = (msg: WallMessage) => {
    setEditingMessage(msg);
    setEditText(msg.text);
    setEditAuthor(msg.author);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage) return;
    setIsProcessing(true);
    await onModerate(editingMessage.id, 'edit', { text: editText, author: editAuthor });
    setEditingMessage(null);
    setIsProcessing(false);
  };

  const handleApproveAllSafe = async () => {
    const safeIds = pendingMessages
      .filter((m) => m.aiModeration.verdict === 'safe')
      .map((m) => m.id);
    if (safeIds.length === 0) return;
    setIsProcessing(true);
    await onBulkModerate(safeIds, 'approve');
    setIsProcessing(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await onUpdateConfig({
      title: settingsTitle,
      subtitle: settingsSubtitle,
      campaignCity: settingsCity,
      theme: settingsTheme,
      autoApproveSafe: settingsAutoApprove,
      allowAnonymous: settingsAllowAnon,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
    setIsProcessing(false);
  };

  const handleExport = (format: 'json' | 'csv') => {
    window.open(`/api/admin/export?format=${format}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-[#091124] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <BleuCitronLogo className="h-8 w-auto" light={true} />
          <div className="border-l border-slate-800 pl-4">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base tracking-tight text-white font-display">
                Régie & Modération
              </h1>
              <span className="text-[10px] font-black uppercase bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-md tracking-wider">
                Production Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Contrôlez les souvenirs partagés en direct, validez les messages et gérez la diffusion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="admin-qr-modal-btn"
            onClick={onOpenQrModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <QrIcon className="w-3.5 h-3.5 text-yellow-400" />
            <span>Affiche de Rue (QR Code)</span>
          </button>

          <button
            id="admin-close-btn"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-yellow-400 text-slate-950 rounded-xl text-xs font-black transition-transform hover:scale-102 cursor-pointer shadow-md"
          >
            <span>Retour au Mur</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-[#070d1c] border-b border-slate-800 px-6 py-2.5 flex items-center justify-between shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            id="tab-pending-btn"
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-yellow-400 text-slate-950 shadow-md scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>À Modérer</span>
            {stats.pending > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'pending' ? 'bg-rose-600 text-white' : 'bg-yellow-400 text-slate-950'
              }`}>
                {stats.pending}
              </span>
            )}
          </button>

          <button
            id="tab-active-btn"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Mur Actif</span>
            <span className="text-[10px] opacity-75">({stats.approved})</span>
          </button>

          <button
            id="tab-archived-btn"
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archives</span>
            <span className="text-[10px] opacity-75">({stats.archived})</span>
          </button>

          <button
            id="tab-settings-btn"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Paramètres du Dispositif</span>
          </button>
        </div>

        {/* Global summary stats */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 font-medium">
          <span>Total créés : <strong className="text-white">{stats.total}</strong></span>
          <span className="text-emerald-400">En ligne : <strong>{stats.approved}</strong></span>
          <span className="text-yellow-400">En attente : <strong>{stats.pending}</strong></span>
          <span className="text-slate-400">Archivés : <strong>{stats.archived}</strong></span>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
        {/* TAB 1: PENDING QUEUE (File de modération) */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Top Bar Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-white">
                    Messages en attente de modération ({pendingMessages.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Chaque message a été analysé automatiquement par l'IA. Validez pour projeter sur le mur.
                  </p>
                </div>
              </div>

              {pendingMessages.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    id="approve-all-safe-btn"
                    onClick={handleApproveAllSafe}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tout approuver (Recommandés)</span>
                  </button>
                  <button
                    id="reject-all-pending-btn"
                    onClick={() => onBulkModerate(pendingMessages.map((m) => m.id), 'reject')}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tout rejeter</span>
                  </button>
                </div>
              )}
            </div>

            {/* List of Pending Items */}
            {pendingMessages.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 space-y-3">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCheck className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-base text-white">File de modération vide</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Aucun message en attente ! Les participants peuvent scanner le QR Code pour écrire un nouveau message.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors shadow-sm"
                  >
                    {/* Header: Author & Color Preview */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border border-black/20 ${
                            msg.color === 'yellow' ? 'bg-amber-300' :
                            msg.color === 'pink' ? 'bg-pink-300' :
                            msg.color === 'blue' ? 'bg-sky-300' :
                            msg.color === 'green' ? 'bg-emerald-300' :
                            msg.color === 'purple' ? 'bg-purple-300' :
                            msg.color === 'orange' ? 'bg-orange-300' : 'bg-slate-200'
                          }`}
                          title={`Couleur: ${msg.color}`}
                        />
                        <span className="font-bold text-xs text-slate-200 truncate max-w-[140px]">
                          {msg.author}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Message Text */}
                    <div className="flex-1">
                      <p className="font-handwriting text-2xl text-amber-200 break-words">
                        "{msg.text}"
                      </p>
                    </div>

                    {/* AI Moderation Diagnostic Box */}
                    <div className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      msg.aiModeration.verdict === 'safe'
                        ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                        : msg.aiModeration.verdict === 'warning'
                        ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                        : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                    }`}>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          {msg.aiModeration.verdict === 'safe' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : msg.aiModeration.verdict === 'warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>
                            {msg.aiModeration.verdict === 'safe'
                              ? 'IA : Sûr & Recommandé'
                              : msg.aiModeration.verdict === 'warning'
                              ? 'IA : Attention / À relire'
                              : 'IA : Déconseillé / Risque'}
                          </span>
                        </span>
                        <span className="text-[10px] font-mono opacity-80">
                          Tox: {msg.aiModeration.toxicityScore}%
                        </span>
                      </div>
                      <p className="text-[11px] opacity-90 leading-tight">
                        {msg.aiModeration.summary}
                      </p>
                      {msg.aiModeration.flaggedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {msg.aiModeration.flaggedCategories.map((cat, idx) => (
                            <span key={idx} className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-mono">
                              #{cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions: Approve / Edit / Reject */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onModerate(msg.id, 'approve')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Valider</span>
                      </button>

                      <button
                        onClick={() => handleStartEdit(msg)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
                        title="Corriger une faute avant publication"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onModerate(msg.id, 'reject')}
                        className="p-2 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs transition-colors cursor-pointer border border-slate-700"
                        title="Rejeter ce message"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ACTIVE WALL MESSAGES (Mur Actif) */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {/* Control bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div>
                <h2 className="font-bold text-sm text-white">
                  Messages affichés en direct sur le mur ({activeMessages.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Ces messages sont actuellement visibles sur la projection publique.
                </p>
              </div>

              {activeMessages.length > 0 && (
                <div className="flex items-center gap-2">
                  {!archiveConfirm ? (
                    <button
                      id="archive-all-btn"
                      onClick={() => setArchiveConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archiver tout le mur</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-800 p-1.5 rounded-lg">
                      <span className="text-xs text-amber-200 font-semibold px-1">Confirmer l'archivage ?</span>
                      <button
                        onClick={async () => {
                          await onArchiveAll();
                          setArchiveConfirm(false);
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs"
                      >
                        Oui, archiver
                      </button>
                      <button
                        onClick={() => setArchiveConfirm(false)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Grid of active messages */}
            {activeMessages.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 space-y-2">
                <p className="text-slate-400 text-sm">Le mur est actuellement vide.</p>
                <p className="text-slate-500 text-xs">
                  Validez des messages dans l'onglet "À Modérer" pour les afficher ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between space-y-3 ${
                      msg.pinned ? 'border-amber-500/60 bg-amber-950/10' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          — {msg.author}
                        </span>
                        {msg.pinned && (
                          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5" /> Épinglé
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="font-handwriting text-2xl text-slate-100 break-words flex-1">
                      "{msg.text}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <button
                        onClick={() => onModerate(msg.id, 'pin')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          msg.pinned
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title={msg.pinned ? 'Désépingler' : 'Épingler en haut'}
                      >
                        <Pin className="w-3 h-3" />
                        <span>{msg.pinned ? 'Épinglé' : 'Épingler'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onModerate(msg.id, 'archive')}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                          title="Archiver ce message"
                        >
                          <Archive className="w-3 h-3 text-amber-400" />
                          <span>Archiver</span>
                        </button>

                        <button
                          onClick={() => onModerate(msg.id, 'delete')}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ARCHIVES */}
        {activeTab === 'archived' && (
          <div className="space-y-6">
            {/* Header with Search and Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <h2 className="font-bold text-sm text-white">
                  Messages Archivés ({archivedMessages.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Consultez, restaurez ou exportez les anciens messages du mur.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer les archives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* List of Archived Items */}
            {archivedMessages.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 space-y-2">
                <Archive className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">Aucun message archivé pour le moment.</p>
                <p className="text-slate-500 text-xs">
                  Vous pouvez archiver des messages individuels ou tout le mur depuis l'onglet "Mur Actif".
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {archivedMessages
                  .filter((m) =>
                    searchQuery ? m.text.toLowerCase().includes(searchQuery.toLowerCase()) || m.author.toLowerCase().includes(searchQuery.toLowerCase()) : true
                  )
                  .map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-amber-400 truncate">
                            {msg.author}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(msg.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 truncate">
                          "{msg.text}"
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onModerate(msg.id, 'unarchive')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-medium transition-colors"
                          title="Restaurer sur le mur"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurer</span>
                        </button>

                        <button
                          onClick={() => onModerate(msg.id, 'delete')}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Supprimer définitivement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS & WALL CONFIGURATION */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-base font-bold text-white">Paramètres Généraux du Mur</h2>
                <p className="text-xs text-slate-400">
                  Personnalisez l'affichage public, le thème visuel et les règles de modération.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Paramètres enregistrés avec succès ! Le mur a été mis à jour.</span>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200">
                    Titre principal
                  </label>
                  <input
                    type="text"
                    value={settingsTitle}
                    onChange={(e) => setSettingsTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-yellow-400 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-200">
                    Phrase d'introduction / Consigne
                  </label>
                  <input
                    type="text"
                    value={settingsSubtitle}
                    onChange={(e) => setSettingsSubtitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-yellow-400 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-200">
                    Lieu ou Événement (ex: En tournée, Zénith, Festivals...)
                  </label>
                  <input
                    type="text"
                    value={settingsCity}
                    onChange={(e) => setSettingsCity(e.target.value)}
                    placeholder="Bleu Citron"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:border-yellow-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Theme selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200">
                  Ambiance visuelle & Thème de l'installation
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'bleu-nuit', label: 'Bleu Nuit Citron', desc: 'Thème officiel Bleu Citron, fond profond & auras' },
                    { id: 'bleu-citron', label: 'Signature Électrique', desc: 'Bleu azur éclatant & contrastes intenses' },
                    { id: 'minimal-white', label: 'Galerie Épurée', desc: 'Design suisse clair & typographie forte' },
                    { id: 'projection', label: 'Projection Scène', desc: 'Optimisé pour vidéoprojecteurs et grand écran' },
                    { id: 'corkboard', label: 'Post-it Contemporain', desc: 'Tableau participatif classique' },
                  ].map((themeOpt) => (
                    <button
                      key={themeOpt.id}
                      type="button"
                      onClick={() => setSettingsTheme(themeOpt.id as any)}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        settingsTheme === themeOpt.id
                          ? 'border-yellow-400 bg-yellow-400/15 text-white ring-1 ring-yellow-400 shadow-md'
                          : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-xs block text-slate-200">{themeOpt.label}</span>
                      <span className="text-[11px] opacity-75 mt-0.5 block">{themeOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Moderation settings */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-200 block">
                  Options de modération et participants
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsAllowAnon}
                    onChange={(e) => setSettingsAllowAnon(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">Autoriser les messages anonymes</span>
                    <span className="text-slate-400 text-[11px]">
                      Permet aux personnes d'écrire sans renseigner leur prénom ou pseudo.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsAutoApprove}
                    onChange={(e) => setSettingsAutoApprove(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900 w-4 h-4"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200 block">
                      Validation automatique des messages 100% sains
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Si l'IA Gemini estime le message exempt de risque, il est publié directement sans attente.
                    </span>
                  </div>
                </label>
              </div>

              {/* Submit Settings */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onResetDemo}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
                >
                  Réinitialiser avec messages démo
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Quick Edit Modal (Fix typos before publishing) */}
      {editingMessage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Modifier avant publication</span>
              </h3>
              <button
                onClick={() => setEditingMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Auteur</label>
                <input
                  type="text"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Message</label>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingMessage(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isProcessing}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Valider & Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
