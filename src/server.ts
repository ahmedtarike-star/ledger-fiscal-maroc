import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import cron from "node-cron";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

app.use(express.json());

// --- AI Setup ---
const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- DB Helpers ---
async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    return {
      news: [],
      aiNews: [],
      publishedArticles: [],
      lastUpdate: new Date(0).toISOString()
    };
  }
}

async function writeDB(data: any) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// --- Automation Logic ---
async function generateDailyContent() {
  console.log("Generating daily content...");
  try {
    const db = await readDB();
    
    // 1. Generate News Item
    const newsPrompt = "Génère un titre d'actualité fiscale marocaine réaliste pour l'année 2026. Format JSON: { \"title\": string, \"source\": string, \"category\": string, \"url\": string }. Ne réponds QUE le JSON.";
    const newsResult = await model.generateContent(newsPrompt);
    const newsText = newsResult.response.text().replace(/```json|```/g, "").trim();
    const newsItem = JSON.parse(newsText);
    newsItem.date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    db.news.unshift(newsItem);

    // 2. Generate AI News Item
    const aiNewsPrompt = "Génère une actualité sur l'IA dans la fiscalité marocaine pour 2026. Format JSON: { \"title\": string, \"impact\": \"Élevé\" | \"Moyen\" | \"Critique\", \"topic\": string, \"url\": string }. Ne réponds QUE le JSON.";
    const aiNewsResult = await model.generateContent(aiNewsPrompt);
    const aiNewsText = aiNewsResult.response.text().replace(/```json|```/g, "").trim();
    const aiNewsItem = JSON.parse(aiNewsText);
    db.aiNews.unshift(aiNewsItem);

    // 3. Generate Expert Article
    const articlePrompt = "Rédige un article d'expertise fiscale marocaine (300-400 mots) sur un sujet d'actualité en 2026. Format JSON: { \"title\": string, \"content\": string, \"topic\": string }. Le contenu doit être en Markdown. Ne réponds QUE le JSON.";
    const articleResult = await model.generateContent(articlePrompt);
    const articleText = articleResult.response.text().replace(/```json|```/g, "").trim();
    const articleItem = JSON.parse(articleText);
    articleItem.id = Date.now().toString();
    articleItem.date = "À l'instant";
    articleItem.author = "Expert Ledger IA";
    db.publishedArticles.unshift(articleItem);

    db.lastUpdate = new Date().toISOString();
    await writeDB(db);
    console.log("Daily content generated successfully.");
  } catch (error) {
    console.error("Error generating daily content:", error);
  }
}

// --- Cron Job ---
// Runs at 00:00 every day
cron.schedule("0 0 * * *", () => {
  generateDailyContent();
});

// --- API Routes ---
app.get("/api/content", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db);
  } catch (error) {
    res.status(500).json({ error: "Failed to read database" });
  }
});

app.post("/api/articles", async (req, res) => {
  const article = req.body;
  const db = await readDB();
  db.publishedArticles.unshift(article);
  await writeDB(db);
  res.json({ message: "Article published", article });
});

app.post("/api/articles/generate", async (req, res) => {
  await generateDailyContent();
  res.json({ message: "Content generated" });
});

app.delete("/api/articles/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  db.publishedArticles = db.publishedArticles.filter((a: any) => a.id !== id);
  await writeDB(db);
  res.json({ message: "Article deleted" });
});

app.put("/api/articles/:id", async (req, res) => {
  const { id } = req.params;
  const updatedArticle = req.body;
  const db = await readDB();
  db.publishedArticles = db.publishedArticles.map((a: any) => a.id === id ? { ...a, ...updatedArticle } : a);
  await writeDB(db);
  res.json({ message: "Article updated" });
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Check if we need to run the daily update on start
    readDB().then(db => {
      const lastUpdate = new Date(db.lastUpdate);
      const now = new Date();
      // If last update was more than 24h ago, run it
      if (now.getTime() - lastUpdate.getTime() > 24 * 60 * 60 * 1000) {
        generateDailyContent();
      }
    });
  });
}

startServer();
