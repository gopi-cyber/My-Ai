import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { simpleGit } from "simple-git";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { GoogleGenAI } from "@google/genai";

const app = express();
const git = simpleGit();

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not found in environment");
  return new GoogleGenAI({ apiKey });
};

app.use(express.json());

// Gemini API Proxy Endpoints
app.post("/api/ai/generate", async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: model || "gemini-3-flash-preview",
      contents,
      config
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/stream", async (req, res) => {
  try {
    const { model, contents, config } = req.body;
    const ai = getAi();
    const response = await ai.models.generateContentStream({
      model: model || "gemini-3-flash-preview",
      contents,
      config
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of response) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error("AI Stream Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Git API Endpoints
app.get("/api/git/status", async (req, res) => {
  try {
    const status = await git.status();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/git/stage", async (req, res) => {
  try {
    const result = await git.add(".");
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/git/commit", async (req, res) => {
  const { message } = req.body;
  try {
    await git.add(".");
    const result = await git.commit(message);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/git/push", async (req, res) => {
  try {
    const result = await git.push();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/git/pull", async (req, res) => {
  try {
    const result = await git.pull();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/git/init", async (req, res) => {
  try {
    const result = await git.init();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/git/log", async (req, res) => {
  try {
    const log = await git.log();
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
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

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
