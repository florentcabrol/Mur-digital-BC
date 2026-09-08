import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { WallMessage, WallConfig, AiModerationResult } from "./src/types";

const PORT = 3000;
let DATA_DIR = path.join(process.cwd(), "data");
let MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
let CONFIG_FILE = path.join(DATA_DIR, "config.json");

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
  subtitle: "Partage ton meilleur souvenir de concert / spectacle avec Bleu Citron",
  theme: "bleu-nuit",
  allowAnonymous: true,
  maxChars: 400,
  autoApproveSafe: false, // Default: require admin human validation as requested
  campaignCity: "Bleu Citron",
  brandName: "Bleu Citron Productions",
};

// Initial default messages with Bleu Citron concert & show memories
const INITIAL_MESSAGES: WallMessage[] = [
  {
    id: "msg_init_1",
    text: "Le concert de Bigflo & Oli au Stadium... Une communion totale avec 30 000 personnes et une émotion inoubliable du début à la fin !",
    author: "Sophie M.",
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

  app.use(express.json());

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
      const { text, author, color, fontFamily } = req.body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        res.status(400).json({ error: "Le texte du message est obligatoire." });
        return;
      }

      const cleanText = text.trim().slice(0, wallConfig.maxChars || 280);
      const cleanAuthor = (author && typeof author === "string" && author.trim())
        ? author.trim().slice(0, 40)
        : (wallConfig.allowAnonymous ? "Anonyme" : "Participant");

      const validColors: WallMessage["color"][] = ["yellow", "pink", "blue", "green", "purple", "orange", "white"];
      const noteColor: WallMessage["color"] = validColors.includes(color) ? color : "yellow";

      const validFonts = ["outfit", "caveat", "playfair", "syne", "dancing", "space-mono"];
      const cleanFontFamily = validFonts.includes(fontFamily) ? fontFamily : "outfit";

      // Random gentle rotation between -3.5 and 3.5 degrees
      const rotation = Number(((Math.random() * 7) - 3.5).toFixed(1));

      // 1. Run Automated AI Moderation
      const aiResult = await moderateMessageWithAI(cleanText, cleanAuthor);

      // Determine initial status
      let initialStatus: WallMessage["status"] = "pending";
      if (wallConfig.autoApproveSafe && aiResult.verdict === "safe") {
        initialStatus = "approved";
      }

      const newMessage: WallMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: cleanText,
        author: cleanAuthor,
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

      // Notify clients via SSE
      broadcastEvent("message_created", newMessage);

      res.status(201).json({
        success: true,
        message: newMessage,
        requiresHumanReview: initialStatus === "pending",
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
      const headers = ["ID", "Date", "Auteur", "Message", "Statut", "Modération IA", "Score Toxicité"];
      const rows = messages.map((m) => [
        `"${m.id}"`,
        `"${new Date(m.createdAt).toISOString()}"`,
        `"${m.author.replace(/"/g, '""')}"`,
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
    broadcastEvent("wall_reset", { messages });
    res.json({ success: true, count: messages.length });
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
