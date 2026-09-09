export type MessageStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'white';

export interface AiModerationResult {
  verdict: 'safe' | 'warning' | 'unsafe';
  summary: string;
  toxicityScore: number; // 0 to 100
  flaggedCategories: string[];
  suggestedAction: 'approve' | 'review' | 'reject';
  analyzedAt: number;
}

export interface WallMessage {
  id: string;
  text: string;
  author: string;
  email?: string;
  optInConsent?: boolean;
  color: NoteColor;
  fontFamily?: string; // 'outfit' | 'caveat' | 'playfair' | 'syne' | 'dancing' | 'space-mono'
  createdAt: number;
  status: MessageStatus;
  pinned?: boolean;
  rotation: number; // -4 to 4 degrees for realistic note feel
  aiModeration: AiModerationResult;
  moderatedAt?: number;
  moderatorNote?: string;
}

export type WallTheme =
  | 'bleu-nuit'
  | 'bleu-citron'
  | 'minimal-white'
  | 'projection'
  | 'corkboard'
  | 'brick'
  | 'neon'
  | 'gallery'
  | 'chalkboard';

export interface WallConfig {
  title: string;
  subtitle: string;
  theme: WallTheme;
  allowAnonymous: boolean;
  maxChars: number;
  autoApproveSafe: boolean; // if true, AI 'safe' messages don't need manual approval, default false
  campaignCity?: string;
  brandName?: string;
  crmWebhookUrl?: string; // Optional external webhook for CRM sync (Brevo, HubSpot, Zapier, etc.)
  crmAutoSync?: boolean; // If true, auto-sends each new submission to the webhook
}

export interface ModerationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  archived: number;
}

export interface ParticipantRecord {
  id: string;
  email: string;
  firstName: string;
  fullName: string;
  optInConsent: boolean;
  rgpdStatus: 'opt_in' | 'opt_out';
  createdAt: number;
  lastSubmissionAt: number;
  totalSubmissions: number;
  latestMemoryText: string;
  allMemoryIds: string[];
  source: string;
  crmExportedAt?: number;
}

export interface CrmStats {
  totalParticipants: number;
  totalOptIn: number;
  totalOptOut: number;
  optInRate: number; // percentage (e.g. 78.5)
  latestParticipantAt?: number;
}
