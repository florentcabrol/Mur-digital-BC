import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { WallMessage, WallConfig, AiModerationResult, ParticipantRecord, CrmStats } from "./src/types";

const PORT = 3000;
let DATA_DIR = path.join(process.cwd(), "data");
let MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
let CONFIG_FILE = path.join(DATA_DIR, "config.json");
let PARTICIPANTS_FILE = path.join(DATA_DIR, "participants.json");

// Ensure data directory exists safely with fallback to /tmp
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  try {
    DATA_DIR = path.join("/tmp", "bleucitron_data");
    MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
    CONFIG_FILE = path.join(DATA_DIR, "config.json");
    PARTICIPANTS_FILE = path.join(DATA_DIR, "participants.json");
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (errFallback) {
    console.warn("Disk data directory unavailable, operating in in-memory mode:", errFallback);
  }
}

// Initial default configuration for Bleu Citron Productions
const DEFAULT_CONFIG: WallConfig = {
  title: "Bleu Citron",
  subtitle: "Raconte-nous ton plus beau souvenir de concert et tente de gagner 1 an de spectacles Bleu Citron",
  theme: "bleu-citron",
  allowAnonymous: true,
  maxChars: 400,
  autoApproveSafe: false, // Default: require admin human validation as requested
  campaignCity: "Bleu Citron",
  brandName: "Bleu Citron Productions",
  crmAutoSync: false,
};

// Initial default messages with Bleu Citron concert & show memories
const INITIAL_MESSAGES: WallMessage[] = [
  {
    id: "msg_init_1",
    text: "Le concert de Bigflo & Oli au Stadium... Une communion totale avec 30 000 personnes et une émotion inoubliable du début à la fin !",
    author: "Sophie M.",
    email: "sophie.martinez@gmail.com",
    optInConsent: true,
    color: "yellow",
    createdAt: Date.now() - 3600000,
    status: "approved",
    pinned: true,
    rotation: -1.2,
    aiModeration: {
      verdict: "safe",
      summary: "Magnifique souvenir de concert avec Bleu Citron.",
      toxicityScore: 0,
      flaggedCategories: [],
      suggestedAction: "approve",
      analyzedAt: Date.now() - 3600000,
    },
    moderatedAt: Date.now() - 3500000,
  },
  {
    id: "msg_init_2",
    text: "Le spectacle d'Alex Lutz au Casino Barrière, des rires aux larmes pendant deux heures. La magie du spectacle vivant signée Bleu Citron.",
    author: "Camille & Thomas",
    email: "camille.thomas31@wanadoo.fr",
    optInConsent: true,
    color: "blue",
    createdAt: Date.now() - 1800000,
    status: "approved",
    pinned: false,
    rotation: 1.5,
    aiModeration: {
      verdict: "safe",
      summary: "Témoignage enthousiaste sur un spectacle d'humour.",
      toxicityScore: 0,
      flaggedCategories: [],
      suggestedAction: "approve",
      analyzedAt: Date.now() - 1800000,
    },
    moderatedAt: Date.now() - 1750000,
  },
  {
    id: "msg_init_3",
    text: "Grand Corps Malade au Zénith : les frissons sur chaque texte. Un souvenir gravé à jamais dans ma mémoire !",
    author: "Julien",
    email: "julien.toulouse@outlook.fr",
    optInConsent: false,
    color: "green",
    createdAt: Date.now() - 900000,
    status: "approved",
    pinned: false,
    rotation: -2.1,
    aiModeration: {
      verdict: "safe",
      summary: "Souvenir poétique et chaleureux de concert.",
      toxicityScore: 0,
      flaggedCategories: [],
      suggestedAction: "approve",
      analyzedAt: Date.now() - 900000,
    },
    moderatedAt: Date.now() - 850000,
  },
];

// In-memory data structures
let wallConfig: WallConfig = loadConfig();
let messages: WallMessage[] = loadMessages();
let participants: ParticipantRecord[] = loadParticipants();

function loadConfig(): WallConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error loading config:", err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(wallConfig, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving config:", err);
  }
}

function loadMessages(): WallMessage[] {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading messages:", err);
  }
  return [...INITIAL_MESSAGES];
}

function saveMessages(): void {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving messages:", err);
  }
}

function loadParticipants(): ParticipantRecord[] {
  try {
    if (fs.existsSync(PARTICIPANTS_FILE)) {
      const data = fs.readFileSync(PARTICIPANTS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error loading participants:", err);
  }
  // Initialize and synchronize from messages
  const initialList = buildParticipantsFromMessages(messages);
  saveParticipantsList(initialList);
  return initialList;
}

function saveParticipants(): void {
  saveParticipantsList(participants);
}

function saveParticipantsList(list: ParticipantRecord[]): void {
  try {
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving participants:", err);
  }
}

function buildParticipantsFromMessages(msgs: WallMessage[]): ParticipantRecord[] {
  const map = new Map<string, ParticipantRecord>();
  msgs.forEach((m) => {
    if (m.email && typeof m.email === "string" && m.email.trim().length > 0) {
      const normEmail = m.email.trim().toLowerCase();
      const existing = map.get(normEmail);
      if (existing) {
        existing.totalSubmissions += 1;
        if (m.createdAt > existing.lastSubmissionAt) {
          existing.lastSubmissionAt = m.createdAt;
          existing.latestMemoryText = m.text;
        }
        if (m.optInConsent) {
          existing.optInConsent = true;
          existing.rgpdStatus = "opt_in";
        }
        if (!existing.allMemoryIds.includes(m.id)) {
          existing.allMemoryIds.push(m.id);
        }
      } else {
        const cleanOptIn = Boolean(m.optInConsent);
        map.set(normEmail, {
          id: `part_${normEmail.replace(/[^a-z0-9]/g, "_")}`,
          email: normEmail,
          firstName: m.author && m.author !== "Anonyme" ? m.author : "Participant",
          fullName: m.author && m.author !== "Anonyme" ? m.author : "Participant",
          optInConsent: cleanOptIn,
          rgpdStatus: cleanOptIn ? "opt_in" : "opt_out",
          createdAt: m.createdAt,
          lastSubmissionAt: m.createdAt,
          totalSubmissions: 1,
          latestMemoryText: m.text,
          allMemoryIds: [m.id],
          source: "Mur 40 ans - Concours 1 an de spectacles",
        });
      }
    }
  });
  return Array.from(map.values()).sort((a, b) => b.lastSubmissionAt - a.lastSubmissionAt);
}

function registerOrUpdateParticipant(data: {
  email: string;
  author: string;
  optInConsent: boolean;
  memoryId: string;
  memoryText: string;
}): ParticipantRecord {
  const normEmail = data.email.trim().toLowerCase();
  const existingIndex = participants.findIndex((p) => p.email === normEmail);
  const now = Date.now();

  let pRecord: ParticipantRecord;

  if (existingIndex >= 0) {
    pRecord = participants[existingIndex];
    pRecord.totalSubmissions += 1;
    pRecord.lastSubmissionAt = now;
    pRecord.latestMemoryText = data.memoryText;
    if (data.author && data.author !== "Anonyme") {
      pRecord.firstName = data.author;
      pRecord.fullName = data.author;
    }
    // Si la personne a validé l'opt-in lors de cette participation, le consentement devient actif
    if (data.optInConsent) {
      pRecord.optInConsent = true;
      pRecord.rgpdStatus = "opt_in";
    }
    if (!pRecord.allMemoryIds.includes(data.memoryId)) {
      pRecord.allMemoryIds.push(data.memoryId);
    }
    // Remonter en tête de liste
    participants.splice(existingIndex, 1);
    participants.unshift(pRecord);
  } else {
    pRecord = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: normEmail,
      firstName: data.author && data.author !== "Anonyme" ? data.author : "Participant",
      fullName: data.author && data.author !== "Anonyme" ? data.author : "Participant",
      optInConsent: Boolean(data.optInConsent),
      rgpdStatus: data.optInConsent ? "opt_in" : "opt_out",
      createdAt: now,
      lastSubmissionAt: now,
      totalSubmissions: 1,
      latestMemoryText: data.memoryText,
      allMemoryIds: [data.memoryId],
      source: "Mur 40 ans - Concours 1 an de spectacles",
    };
    participants.unshift(pRecord);
  }

  saveParticipants();
  broadcastEvent("participant_updated", pRecord);

  // Déclencher le webhook CRM si configuré
  triggerCrmWebhook(pRecord);

  return pRecord;
}

async function triggerCrmWebhook(p: ParticipantRecord): Promise<void> {
  if (!wallConfig.crmWebhookUrl || !wallConfig.crmAutoSync) return;
  try {
    const payload = {
      event: "participant_submitted",
      email: p.email,
      firstName: p.firstName,
      fullName: p.fullName,
      optIn: p.optInConsent,
      rgpdStatus: p.rgpdStatus,
      submittedAt: new Date(p.lastSubmissionAt).toISOString(),
      memory: p.latestMemoryText,
      source: p.source,
      campaign: "Bleu Citron - 1 An de spectacles",
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    await fetch(wallConfig.crmWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "BleuCitron-CRM-Integration/1.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    p.crmExportedAt = Date.now();
    saveParticipants();
  } catch (err) {
    console.warn("CRM Webhook sync warning:", err);
  }
}

// Server-Sent Events (SSE) subscribers
interface SseClient {
  id: number;
  res: express.Response;
}
let sseClients: SseClient[] = [];
let nextClientId = 1;

function broadcastEvent(type: string, payload: unknown) {
  const data = JSON.stringify({ type, data: payload, timestamp: Date.now() });
  sseClients.forEach((client) => {
    try {
      client.res.write(`event: ${type}\ndata: ${data}\n\n`);
    } catch {
      // client may be closed
    }
  });
}

// Gemini AI client initialization
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Automated Moderation via Gemini API with smart fallback
async function moderateMessageWithAI(text: string, author: string): Promise<AiModerationResult> {
  const client = getGemini();

  if (client) {
    try {
      const prompt = `Tu es le moteur de modération automatique par IA pour le dispositif urbain interactif de Bleu Citron Productions (producteur de spectacles vivants, concerts, tournées et festivals).
Des passants scannent un QR Code sur des affiches physiques dans les rues et rédigent une phrase libre destinée à être projetée sur le grand mur public ou l'installation digitale.
Analyse le message suivant avec discernement culturel et bienveillance :
Auteur: "${author}"
Message: "${text}"

Critères :
- Interdit (unsafe) : insultes, menaces, diffamation, discours haineux, harcèlement, pornographie, spam commercial agressif, divulgation de données privées (téléphone, IBAN).
- Doute (warning) : humour noir sensible, vulgarité légère ou ambiguïté à faire relire par l'équipe régie Bleu Citron.
- Bienvenue (safe) : messages poétiques, enthousiasme culturel, déclarations, émotions du public, avis artistiques, humour sain.

Réponds obligatoirement en JSON selon le schéma demandé.
Format JSON requis:
- verdict: "safe" (approprié/bienveillant), "warning" (potentiellement limite/équivoque), ou "unsafe" (clairement toxique, haineux, insultant ou spam).
- summary: Brève explication en français (max 12 mots) expliquant le diagnostic pour l'administrateur.
- toxicityScore: Nombre entier de 0 (parfaitement sûr) à 100 (extrêmement toxique).
- flaggedCategories: Liste de catégories problématiques si détectées (ex: ["insulte", "spam", "vulgarite", "haine", "donnees_privees"]), sinon liste vide.
- suggestedAction: "approve" (si safe), "review" (si doute/warning), "reject" (si unsafe).`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                description: "safe, warning or unsafe",
              },
              summary: {
                type: Type.STRING,
                description: "Short French moderation summary",
              },
              toxicityScore: {
                type: Type.INTEGER,
                description: "Score from 0 to 100",
              },
              flaggedCategories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Categories of issues detected",
              },
              suggestedAction: {
                type: Type.STRING,
                description: "approve, review, or reject",
              },
            },
            required: ["verdict", "summary", "toxicityScore", "flaggedCategories", "suggestedAction"],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      return {
        verdict: (parsed.verdict === "unsafe" || parsed.verdict === "warning") ? parsed.verdict : "safe",
        summary: parsed.summary || (parsed.verdict === "safe" ? "Message conforme et bienveillant." : "Contenu à vérifier."),
        toxicityScore: typeof parsed.toxicityScore === "number" ? Math.max(0, Math.min(100, parsed.toxicityScore)) : 0,
        flaggedCategories: Array.isArray(parsed.flaggedCategories) ? parsed.flaggedCategories : [],
        suggestedAction: (parsed.suggestedAction === "reject" || parsed.suggestedAction === "review") ? parsed.suggestedAction : "approve",
        analyzedAt: Date.now(),
      };
    } catch (err) {
      console.warn("Gemini moderation error, using heuristic fallback:", err);
    }
  }

  // Heuristic rule-based fallback
  return heuristicModeration(text, author);
}

function heuristicModeration(text: string, _author: string): AiModerationResult {
  const lower = text.toLowerCase();
  const badWords = [
    "merde", "putain", "con", "connard", "salope", "encule", "batard",
    "tg", "fdp", "ntm", "nazi", "hitler", "suicide", "bitch", "fuck",
    "chienne", "pd", "nique"
  ];

  const foundBadWords = badWords.filter((w) => {
    const regex = new RegExp(`\\b${w}\\b`, "i");
    return regex.test(lower);
  });

  const hasExcessiveLinks = (lower.match(/https?:\/\//g) || []).length > 1;
  const isAllUpper = text.length > 15 && text === text.toUpperCase();

  if (foundBadWords.length > 0) {
    return {
      verdict: "unsafe",
      summary: `Termes offensants détectés: ${foundBadWords.join(", ")}`,
      toxicityScore: 85,
      flaggedCategories: ["insulte", "vulgarite"],
      suggestedAction: "reject",
      analyzedAt: Date.now(),
    };
  }

  if (hasExcessiveLinks || isAllUpper) {
    return {
      verdict: "warning",
      summary: hasExcessiveLinks ? "Présence de liens externes (spam possible)." : "Texte écrit intégralement en majuscules.",
      toxicityScore: 40,
      flaggedCategories: hasExcessiveLinks ? ["spam"] : ["forme"],
      suggestedAction: "review",
      analyzedAt: Date.now(),
    };
  }

  return {
    verdict: "safe",
    summary: "Analyse automatique : message bienveillant et conforme.",
    toxicityScore: 5,
    flaggedCategories: [],
    suggestedAction: "approve",
    analyzedAt: Date.now(),
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));

  // SSE Stream for real-time live synchronization
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const clientId = nextClientId++;
    const newClient: SseClient = { id: clientId, res };
    sseClients.push(newClient);

    // Initial ping & sync
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

    req.on("close", () => {
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Check availability of official campaign visual assets
  app.get("/api/check-assets", (_req, res) => {
    const targetDir = path.join(process.cwd(), "public", "images");
    const requiredFiles = [
      "BANNIERE-CONCOURS_CRUSH-A.png",
      "BANNIERE-CONCOURS_LARMES-A.png",
      "BANNIERE-CONCOURS_PARENTS-A.png",
      "BANNIERE-CONCOURS_PETITESOEUR-A.png",
      "BANNIERE-CONCOURS_POTES-A.png",
      "PASTILLE 1 AN DE SPECTACLES.png",
    ];
    const status: Record<string, boolean> = {};
    requiredFiles.forEach((f) => {
      status[f] = fs.existsSync(path.join(targetDir, f));
    });
    res.json({ targetDir, status });
  });

  // Direct upload endpoint for official PNG campaign assets
  app.post("/api/upload-asset", (req, res) => {
    try {
      const { filename, base64Data } = req.body;
      if (!filename || !base64Data) {
        res.status(400).json({ error: "filename and base64Data required" });
        return;
      }
      const safeName = path.basename(filename);
      const targetDir = path.join(process.cwd(), "public", "images");
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Strip data URL prefix if present (e.g. data:image/png;base64,...)
      const cleanedBase64 = base64Data.replace(/^data:image\/[a-z0-9+-]+;base64,/, "");
      const buffer = Buffer.from(cleanedBase64, "base64");
      const filePath = path.join(targetDir, safeName);
      fs.writeFileSync(filePath, buffer);

      // Also copy to dist/images if dist directory exists
      const distDir = path.join(process.cwd(), "dist", "images");
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(path.join(distDir, safeName), buffer);
      }

      // If it's the pastille, also create standard symlinks/copies
      if (safeName === "PASTILLE 1 AN DE SPECTACLES.png") {
        fs.writeFileSync(path.join(targetDir, "pastille-1-an-de-spectacles.png"), buffer);
        fs.writeFileSync(path.join(targetDir, "pastille.png"), buffer);
        if (fs.existsSync(distDir)) {
          fs.writeFileSync(path.join(distDir, "pastille-1-an-de-spectacles.png"), buffer);
          fs.writeFileSync(path.join(distDir, "pastille.png"), buffer);
        }
      }

      console.log(`Successfully uploaded ${safeName} (${buffer.length} bytes)`);
      broadcastEvent("asset_updated", { filename: safeName, timestamp: Date.now() });
      res.json({ success: true, filename: safeName, size: buffer.length });
    } catch (err: any) {
      console.error("Asset upload error:", err);
      res.status(500).json({ error: err.message || "Failed to save asset" });
    }
  });

  // Get Wall Configuration
  app.get("/api/config", (_req, res) => {
    res.json(wallConfig);
  });

  // Update Wall Configuration
  app.put("/api/config", (req, res) => {
    const updates = req.body;
    wallConfig = {
      ...wallConfig,
      ...updates,
    };
    saveConfig();
    broadcastEvent("config_updated", wallConfig);
    res.json(wallConfig);
  });

  // Get Messages
  // ?view=wall -> only approved and non-archived
  // ?view=admin -> all messages (pending, approved, rejected, archived)
  // ?view=archive -> only archived messages
  app.get("/api/messages", (req, res) => {
    const view = req.query.view as string;

    if (view === "admin") {
      res.json(messages);
      return;
    }

    if (view === "archive") {
      const archived = messages.filter((m) => m.status === "archived");
      res.json(archived);
      return;
    }

    // Default: public wall view (approved & active)
    const wallMessages = messages
      .filter((m) => m.status === "approved")
      .sort((a, b) => {
        // Pinned first, then newest
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt - a.createdAt;
      });

    res.json(wallMessages);
  });

  // Check specific message status (for submitter mobile confirmation screen)
  app.get("/api/messages/:id/status", (req, res) => {
    const msg = messages.find((m) => m.id === req.params.id);
    if (!msg) {
      res.status(404).json({ error: "Message non trouvé" });
      return;
    }
    res.json({
      id: msg.id,
      status: msg.status,
      author: msg.author,
      text: msg.text,
      aiModeration: msg.aiModeration,
      createdAt: msg.createdAt,
      moderatedAt: msg.moderatedAt,
    });
  });

  // Submit a new message from QR code mobile interface
  app.post("/api/messages", async (req, res) => {
    try {
      const { text, author, color, fontFamily, email, optInConsent } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        res.status(400).json({ error: "Le texte du message est obligatoire." });
        return;
      }

      const cleanText = text.trim().slice(0, wallConfig.maxChars || 280);
      const cleanAuthor = (author && typeof author === "string" && author.trim())
        ? author.trim().slice(0, 40)
        : (wallConfig.allowAnonymous ? "Anonyme" : "Participant");
      const cleanEmail = (email && typeof email === "string") ? email.trim().slice(0, 100) : undefined;
      const cleanOptIn = Boolean(optInConsent);

      const validColors: WallMessage["color"][] = ["yellow", "pink", "blue", "green", "purple", "orange", "white"];
      const noteColor: WallMessage["color"] = validColors.includes(color) ? color : "yellow";

      const validFonts = ["outfit", "caveat", "playfair", "syne", "dancing", "space-mono"];
      const cleanFontFamily = validFonts.includes(fontFamily) ? fontFamily : "outfit";

      // Random gentle rotation between -3.5 and 3.5 degrees
      const rotation = Number(((Math.random() * 7) - 3.5).toFixed(1));

      // 1. Run Automated AI Moderation
      const aiResult = await moderateMessageWithAI(cleanText, cleanAuthor);

      // Calcul du score de bienveillance et conformité (0 à 100%)
      const qualityScore = Math.max(0, 100 - (aiResult.toxicityScore ?? 0));

      // Règle utilisateur : Si un message est détecté comme bon à 90% minimum (et verdict safe),
      // le message se publie directement sur le mur sans besoin de validation manuelle de l'équipe.
      const isNinetyPercentGood = (
        qualityScore >= 90 &&
        aiResult.verdict === "safe" &&
        (!aiResult.flaggedCategories || aiResult.flaggedCategories.length === 0)
      );

      let initialStatus: WallMessage["status"] = "pending";
      if (isNinetyPercentGood || (wallConfig.autoApproveSafe && aiResult.verdict === "safe")) {
        initialStatus = "approved";
      }

      const newMessage: WallMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: cleanText,
        author: cleanAuthor,
        email: cleanEmail,
        optInConsent: cleanOptIn,
        color: noteColor,
        fontFamily: cleanFontFamily,
        createdAt: Date.now(),
        status: initialStatus,
        pinned: false,
        rotation,
        aiModeration: aiResult,
        moderatedAt: initialStatus === "approved" ? Date.now() : undefined,
      };

      messages.unshift(newMessage);
      saveMessages();

      // Enregistrement et synchronisation CRM du participant si email renseigné
      let registeredParticipant: ParticipantRecord | undefined;
      if (cleanEmail) {
        registeredParticipant = registerOrUpdateParticipant({
          email: cleanEmail,
          author: cleanAuthor,
          optInConsent: cleanOptIn,
          memoryId: newMessage.id,
          memoryText: cleanText,
        });
      }

      // Notify clients via SSE for real-time update
      broadcastEvent("message_created", newMessage);
      if (initialStatus === "approved") {
        broadcastEvent("message_approved", { message: newMessage });
      }

      res.status(201).json({
        success: true,
        message: newMessage,
        publishedDirectly: initialStatus === "approved",
        qualityScore,
        requiresHumanReview: initialStatus === "pending",
        participant: registeredParticipant,
      });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Une erreur est survenue lors de l'enregistrement." });
    }
  });

  // Admin moderation action on a single message
  app.post("/api/admin/moderate/:id", (req, res) => {
    const { id } = req.params;
    const { action, text, author, note } = req.body;

    const msgIndex = messages.findIndex((m) => m.id === id);
    if (msgIndex === -1) {
      res.status(404).json({ error: "Message introuvable" });
      return;
    }

    const msg = messages[msgIndex];

    if (action === "approve") {
      msg.status = "approved";
      msg.moderatedAt = Date.now();
      if (note) msg.moderatorNote = note;
    } else if (action === "reject") {
      msg.status = "rejected";
      msg.moderatedAt = Date.now();
      if (note) msg.moderatorNote = note;
    } else if (action === "archive") {
      msg.status = "archived";
    } else if (action === "unarchive") {
      msg.status = "approved";
    } else if (action === "pin") {
      msg.pinned = !msg.pinned;
    } else if (action === "edit") {
      if (text && typeof text === "string") msg.text = text.trim().slice(0, wallConfig.maxChars);
      if (author && typeof author === "string") msg.author = author.trim().slice(0, 40);
      msg.status = "approved";
      msg.moderatedAt = Date.now();
    } else if (action === "delete") {
      messages.splice(msgIndex, 1);
      saveMessages();
      broadcastEvent("message_deleted", { id });
      res.json({ success: true, deletedId: id });
      return;
    } else {
      res.status(400).json({ error: "Action inconnue" });
      return;
    }

    saveMessages();
    broadcastEvent("message_updated", msg);
    res.json({ success: true, message: msg });
  });

  // Admin bulk moderation
  app.post("/api/admin/bulk-moderate", (req, res) => {
    const { ids, action } = req.body as { ids: string[]; action: "approve" | "reject" | "archive" | "delete" };
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "Identifiants requis" });
      return;
    }

    let modifiedCount = 0;
    if (action === "delete") {
      messages = messages.filter((m) => !ids.includes(m.id));
      modifiedCount = ids.length;
    } else {
      messages.forEach((msg) => {
        if (ids.includes(msg.id)) {
          if (action === "approve") {
            msg.status = "approved";
            msg.moderatedAt = Date.now();
          } else if (action === "reject") {
            msg.status = "rejected";
            msg.moderatedAt = Date.now();
          } else if (action === "archive") {
            msg.status = "archived";
          }
          modifiedCount++;
        }
      });
    }

    saveMessages();
    broadcastEvent("messages_bulk_updated", { ids, action });
    res.json({ success: true, count: modifiedCount });
  });

  // Archive all currently approved messages (e.g., at end of session or event)
  app.post("/api/admin/archive-all", (_req, res) => {
    let count = 0;
    messages.forEach((m) => {
      if (m.status === "approved") {
        m.status = "archived";
        count++;
      }
    });

    saveMessages();
    broadcastEvent("all_messages_archived", { count });
    res.json({ success: true, archivedCount: count });
  });

  // Export messages
  app.get("/api/admin/export", (req, res) => {
    const format = req.query.format as string;
    if (format === "csv") {
      const headers = ["ID", "Date", "Auteur", "Email", "Opt-in Consentement", "Message", "Statut", "Modération IA", "Score Toxicité"];
      const rows = messages.map((m) => [
        `"${m.id}"`,
        `"${new Date(m.createdAt).toISOString()}"`,
        `"${m.author.replace(/"/g, '""')}"`,
        `"${(m.email || '').replace(/"/g, '""')}"`,
        `"${m.optInConsent ? 'Oui' : 'Non'}"`,
        `"${m.text.replace(/"/g, '""')}"`,
        `"${m.status}"`,
        `"${m.aiModeration.verdict}"`,
        m.aiModeration.toxicityScore,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="mur_messages_${Date.now()}.csv"`);
      res.send(csv);
      return;
    }

    res.setHeader("Content-Disposition", `attachment; filename="mur_messages_${Date.now()}.json"`);
    res.json({ exportDate: new Date().toISOString(), config: wallConfig, messages });
  });

  // Reset sample demo messages
  app.post("/api/admin/reset-demo", (_req, res) => {
    messages = [...INITIAL_MESSAGES];
    saveMessages();
    participants = buildParticipantsFromMessages(messages);
    saveParticipants();
    broadcastEvent("wall_reset", { messages });
    res.json({ success: true, count: messages.length, participantsCount: participants.length });
  });

  // Stats
  app.get("/api/admin/stats", (_req, res) => {
    const stats = {
      total: messages.length,
      pending: messages.filter((m) => m.status === "pending").length,
      approved: messages.filter((m) => m.status === "approved").length,
      rejected: messages.filter((m) => m.status === "rejected").length,
      archived: messages.filter((m) => m.status === "archived").length,
    };
    res.json(stats);
  });

  // =========================================================================
  // CRM & PARTICIPANTS ENDPOINTS (Stockage, Filtrage Opt-in, Exports & Sync)
  // =========================================================================

  // 1. Get Participants list & KPI statistics
  app.get("/api/admin/participants", (req, res) => {
    const filter = (req.query.filter as string) || "all";
    const search = ((req.query.search as string) || "").trim().toLowerCase();

    let filtered = [...participants];

    if (filter === "opt_in") {
      filtered = filtered.filter((p) => p.optInConsent === true);
    } else if (filter === "opt_out") {
      filtered = filtered.filter((p) => p.optInConsent === false);
    }

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.email.toLowerCase().includes(search) ||
          p.firstName.toLowerCase().includes(search) ||
          p.latestMemoryText.toLowerCase().includes(search)
      );
    }

    const totalParticipants = participants.length;
    const totalOptIn = participants.filter((p) => p.optInConsent === true).length;
    const totalOptOut = totalParticipants - totalOptIn;
    const optInRate = totalParticipants > 0 ? Number(((totalOptIn / totalParticipants) * 100).toFixed(1)) : 0;
    const latestParticipantAt = participants.length > 0 ? participants[0].lastSubmissionAt : undefined;

    const stats: CrmStats = {
      totalParticipants,
      totalOptIn,
      totalOptOut,
      optInRate,
      latestParticipantAt,
    };

    res.json({
      participants: filtered,
      stats,
      totalCount: totalParticipants,
      filteredCount: filtered.length,
    });
  });

  // 2. Export Participants in universal CRM CSV format (Brevo, Mailchimp, HubSpot, Salesforce, Excel)
  app.get("/api/admin/participants/export/csv", (req, res) => {
    const filter = (req.query.filter as string) || "all";
    let exportList = [...participants];

    if (filter === "opt_in") {
      exportList = exportList.filter((p) => p.optInConsent === true);
    } else if (filter === "opt_out") {
      exportList = exportList.filter((p) => p.optInConsent === false);
    }

    // Standard headers compatible with all CRMs
    const headers = [
      "Email",
      "Prenom",
      "Nom_Complet",
      "Opt_In",
      "Statut_Consentement_RGPD",
      "Date_Inscription",
      "Heure_Inscription",
      "Nombre_Participations",
      "Dernier_Souvenir",
      "Origine_Campagne",
    ];

    const rows = exportList.map((p) => {
      const dateObj = new Date(p.lastSubmissionAt);
      const dateStr = dateObj.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
      const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

      return [
        `"${p.email.replace(/"/g, '""')}"`,
        `"${p.firstName.replace(/"/g, '""')}"`,
        `"${p.fullName.replace(/"/g, '""')}"`,
        `"${p.optInConsent ? "OUI" : "NON"}"`,
        `"${p.optInConsent ? "CONSENTEMENT ACTIF" : "NON CONSENTI (Tirage au sort uniquement)"}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        p.totalSubmissions,
        `"${(p.latestMemoryText || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
        `"${(p.source || "Bleu Citron 40 ans").replace(/"/g, '""')}"`,
      ];
    });

    // Add UTF-8 BOM (\uFEFF) so Excel opens accents cleanly without glitching
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const filenameFilter = filter === "opt_in" ? "opt-in" : filter === "opt_out" ? "non-opt-in" : "tous";
    const dateStamp = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="participants_crm_bleu_citron_${filenameFilter}_${dateStamp}.csv"`);
    res.send(csvContent);
  });

  // 3. Export Participants in JSON format (Direct API / Webhook connectors)
  app.get("/api/admin/participants/export/json", (req, res) => {
    const filter = (req.query.filter as string) || "all";
    let exportList = [...participants];

    if (filter === "opt_in") {
      exportList = exportList.filter((p) => p.optInConsent === true);
    } else if (filter === "opt_out") {
      exportList = exportList.filter((p) => p.optInConsent === false);
    }

    const payload = {
      campaign: "Bleu Citron Productions - 1 An de spectacles",
      exportDate: new Date().toISOString(),
      filterApplied: filter,
      totalContacts: exportList.length,
      contacts: exportList.map((p) => ({
        email: p.email,
        firstName: p.firstName,
        fullName: p.fullName,
        optInConsent: p.optInConsent,
        rgpdStatus: p.rgpdStatus,
        firstRegisteredAt: new Date(p.createdAt).toISOString(),
        lastSubmissionAt: new Date(p.lastSubmissionAt).toISOString(),
        participationsCount: p.totalSubmissions,
        latestMemory: p.latestMemoryText,
        source: p.source,
      })),
    };

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="participants_crm_bleu_citron_${Date.now()}.json"`);
    res.json(payload);
  });

  // 4. Force Resync of Participants from all messages
  app.post("/api/admin/participants/sync", (_req, res) => {
    participants = buildParticipantsFromMessages(messages);
    saveParticipants();
    res.json({
      success: true,
      totalParticipants: participants.length,
      totalOptIn: participants.filter((p) => p.optInConsent).length,
    });
  });

  // 5. Delete a participant (Right to be forgotten / RGPD)
  app.delete("/api/admin/participants/:id", (req, res) => {
    const { id } = req.params;
    const index = participants.findIndex((p) => p.id === id || p.email === id);
    if (index === -1) {
      res.status(404).json({ error: "Participant introuvable" });
      return;
    }
    const removed = participants.splice(index, 1)[0];
    saveParticipants();
    broadcastEvent("participant_deleted", { id: removed.id, email: removed.email });
    res.json({ success: true, removedEmail: removed.email });
  });

  // 6. Test external CRM webhook
  app.post("/api/admin/crm/test-webhook", async (req, res) => {
    try {
      const { webhookUrl } = req.body;
      if (!webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.startsWith("http")) {
        res.status(400).json({ error: "URL de webhook invalide (doit commencer par http:// ou https://)" });
        return;
      }

      const testPayload = {
        event: "test_ping",
        source: "Bleu Citron Productions - Mur Collaboratif",
        timestamp: new Date().toISOString(),
        testParticipant: {
          email: "test.crm@bleucitron.net",
          firstName: "Participant Test",
          optIn: true,
          rgpdStatus: "OPT_IN",
          memory: "Ceci est un test de synchronisation CRM depuis l'espace Régie Bleu Citron.",
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "BleuCitron-CRM-Tester/1.0",
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      res.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || "Erreur de connexion au Webhook",
      });
    }
  });

  // Serve static assets from public/ directly
  app.use(express.static(path.join(process.cwd(), "public")));

  // Vite middleware setup (Express v4: use app.get('*', ...))
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mur Collaboratif server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
