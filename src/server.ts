import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

app.use(express.json());

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

// --- API Routes ---
app.get("/api/content", async (req, res) => {
  try {
    const db = await readDB();
    res.json(db);
  } catch (error) {
    res.status(500).json({ error: "Failed to read database" });
  }
});

// Endpoint for frontend to push generated content
app.post("/api/content/update", async (req, res) => {
  try {
    const { news, aiNews, article } = req.body;
    console.log(`[DB] Update request received. Type: ${news ? 'news' : aiNews ? 'aiNews' : 'article'}`);
    const db = await readDB();
    
    if (news) {
      db.news.unshift(news);
      if (db.news.length > 20) db.news = db.news.slice(0, 20);
      console.log(`[DB] Added news: ${news.title}`);
    }
    
    if (aiNews) {
      db.aiNews.unshift(aiNews);
      if (db.aiNews.length > 20) db.aiNews = db.aiNews.slice(0, 20);
      console.log(`[DB] Added AI news: ${aiNews.title}`);
    }
    
    if (article) {
      db.publishedArticles.unshift(article);
      if (db.publishedArticles.length > 50) db.publishedArticles = db.publishedArticles.slice(0, 50);
      console.log(`[DB] Added article: ${article.title}`);
    }

    db.lastUpdate = new Date().toISOString();
    await writeDB(db);
    res.json({ message: "Content updated", db });
  } catch (error) {
    console.error("[DB] Update failed:", error);
    res.status(500).json({ error: "Failed to update content" });
  }
});

app.post("/api/articles", async (req, res) => {
  const article = req.body;
  const db = await readDB();
  db.publishedArticles.unshift(article);
  await writeDB(db);
  res.json({ message: "Article published", article });
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
  });
}

startServer();
