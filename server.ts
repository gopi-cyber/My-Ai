import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createProxyMiddleware } from "http-proxy-middleware";
import { simpleGit } from "simple-git";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const git = simpleGit();

  // Ollama Proxy
  app.use(
    "/api/ollama",
    createProxyMiddleware({
      target: "http://localhost:11434",
      changeOrigin: true,
      pathRewrite: {
        "^/api/ollama": "", // Remove /api/ollama from the forwarded path
      },
      on: {
        error: (err, req, res: any) => {
          console.error("Ollama Proxy Error:", err.message);
          if (res.status) {
            res.status(503).json({ 
              error: "OLLAMA_OFFLINE",
              message: "Neural core offline. Verify Ollama is running on localhost:11434."
            });
          }
        },
      },
    })
  );

  // NVIDIA NIM Proxy
  app.use(
    "/api/ai/nvidia",
    createProxyMiddleware({
      target: "https://integrate.api.nvidia.com/v1",
      changeOrigin: true,
      pathRewrite: {
        "^/api/ai/nvidia": "",
      },
      on: {
        proxyReq: (proxyReq, req: any) => {
          if (process.env.NVIDIA_API_KEY) {
            proxyReq.setHeader("Authorization", `Bearer ${process.env.NVIDIA_API_KEY}`);
          }
        },
        error: (err, req, res: any) => {
          console.error("NVIDIA Proxy Error:", err.message);
          if (res.status) {
            res.status(502).json({ error: "NVIDIA_PROXY_ERROR", message: err.message });
          }
        },
      },
    })
  );

  // AI Health Check
  app.get("/api/ai/health", async (req, res) => {
    const status: any = { ollama: "offline", gemini: "inactive" };
    
    // Check Ollama
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (response.ok) status.ollama = "online";
    } catch (e) {}

    // Check Gemini key
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_API_KEY") {
      status.gemini = "active";
    }

    // Check NVIDIA key
    if (process.env.NVIDIA_API_KEY) {
      status.nvidia = "active";
    }

    res.json(status);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
