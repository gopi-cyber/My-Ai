import { Message, Project } from "../types";

/**
 * Detects which local AI providers are reachable.
 * Priority: 1. Ollama (local), 2. Mock (simulation)
 */
export async function getActiveAIProvider(): Promise<'ollama' | 'mock'> {
  try {
    const response = await fetch("/api/ai/health");
    if (response.ok) {
      const status = await response.json();
      if (status.ollama === "online") return "ollama";
    }
  } catch (e) {}

  return 'mock';
}

const MOCK_PROJECTS: Record<string, Project> = {
  "landing": {
    id: "mock-landing",
    name: "Modern Landing Page",
    description: "A sleek, responsive landing page with a hero section and features.",
    html: `<div class="min-h-screen bg-zinc-950 text-white font-sans">
  <nav class="p-6 flex justify-between items-center border-b border-zinc-800">
    <div class="text-xl font-bold tracking-tighter">ANTIGRAVITY_GEN</div>
    <div class="space-x-6 text-sm text-zinc-400">
      <a href="#">Features</a>
      <a href="#">Pricing</a>
      <a href="#">Contact</a>
    </div>
  </nav>
  <main class="max-w-4xl mx-auto py-20 px-6 text-center">
    <h1 class="text-6xl font-black tracking-tight mb-6">Build the future with local AI.</h1>
    <p class="text-xl text-zinc-400 mb-10">High-performance neural interfaces delivered instantly to your browser.</p>
    <button class="bg-blue-600 px-8 py-4 rounded-full font-bold hover:bg-blue-500 transition-all">Get Started</button>
  </main>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Landing page initialized');",
    python: "",
    timestamp: Date.now()
  },
  "dashboard": {
    id: "mock-dashboard",
    name: "Analytics Dashboard",
    description: "A data-driven dashboard with sidebar navigation and metric cards.",
    html: `<div class="flex h-screen bg-zinc-900 text-zinc-100">
  <aside class="w-64 border-r border-zinc-800 p-6">
    <div class="text-lg font-bold mb-10">CORE_DASH</div>
    <nav class="space-y-4 text-sm text-zinc-500">
      <div class="text-zinc-100">Overview</div>
      <div>Analytics</div>
      <div>Settings</div>
    </nav>
  </aside>
  <main class="flex-1 p-10">
    <header class="flex justify-between items-center mb-10">
      <h1 class="text-2xl font-bold">System Overview</h1>
      <div class="text-xs text-zinc-500 font-mono">STATUS: OPTIMAL</div>
    </header>
    <div class="grid grid-cols-3 gap-6">
      <div class="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
        <div class="text-xs text-zinc-500 uppercase mb-2">Throughput</div>
        <div class="text-3xl font-bold">1.2 GB/s</div>
      </div>
      <div class="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
        <div class="text-xs text-zinc-500 uppercase mb-2">Latency</div>
        <div class="text-3xl font-bold">4.2 ms</div>
      </div>
      <div class="bg-zinc-800 p-6 rounded-xl border border-zinc-700">
        <div class="text-xs text-zinc-500 uppercase mb-2">Uptime</div>
        <div class="text-3xl font-bold">99.9%</div>
      </div>
    </div>
  </main>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Dashboard initialized');",
    python: "",
    timestamp: Date.now()
  },
  "device": {
    id: "mock-device",
    name: "Neural Device Controller",
    description: "A multi-app interface for controlling hardware components like cameras and speakers.",
    html: `<div class="min-h-screen bg-zinc-950 text-white p-8 font-sans">
  <div class="max-w-6xl mx-auto">
    <header class="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
      <div>
        <h1 class="text-3xl font-black tracking-tighter">DEVICE_HUB_v1.0</h1>
        <p class="text-zinc-500 text-sm font-mono mt-1">CONNECTED_NODES: 04 | STATUS: ACTIVE</p>
      </div>
    </header>
    <div class="p-10 bg-zinc-900 rounded-xl border border-zinc-800 text-center">
      <p class="text-zinc-500 uppercase text-xs tracking-widest font-bold">Local interface active. Connect neural link to proceed.</p>
    </div>
  </div>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Device Hub active');",
    python: "",
    timestamp: Date.now()
  },
  "python": {
    id: "mock-python",
    name: "Python Processor",
    description: "Local data analysis using Python logic.",
    html: `<div class="p-10 bg-zinc-950 text-white font-mono">
      <h1>Python Environment</h1>
      <p>Running local Wasm-based Python functions.</p>
    </div>`,
    css: "body { background: black; }",
    js: "console.log('Python analysis ready');",
    python: "print('Hello from Antigravity Local AI')",
    timestamp: Date.now()
  }
};

export async function* streamChat(messages: Message[], systemInstruction?: string) {
  // Primary: Local Ollama
  try {
    const response = await fetch("/api/ollama/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        system: systemInstruction || "You are an expert AI developer assistant. You run entirely locally.",
        stream: true
      })
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.message?.content) yield data.message.content;
            } catch (e) {}
          }
        }
      }
      return;
    }
  } catch (e) {
    console.warn("Local AI Core (Ollama) unreachable, falling back to simulation.");
  }

  // Fallback: Pure Simulation Mode
  const mockText = "System operating in Pure Privacy mode. No external API keys or local neural cores (Ollama) detected. How can I assist your offline operations today?";
  for (const char of mockText) {
    yield char;
    await new Promise(r => setTimeout(r, 10));
  }
}

export async function generateProject(prompt: string, context?: Project): Promise<Project> {
  // Local Ollama JSON Mode
  try {
    const response = await fetch("/api/ollama/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Generate a complete project for: ${prompt}. Return ONLY a JSON object with keys: name, description, html, css, js, python.`,
        format: "json",
        stream: false,
        system: "You are an AI architect. Return ONLY valid JSON."
      })
    });
    if (response.ok) {
      const data = await response.json();
      const projectData = JSON.parse(data.response);
      return {
        id: Date.now().toString(),
        name: projectData.name || "Local Sync Project",
        description: projectData.description || "Synthesized by Pure Local Core.",
        html: projectData.html || "",
        css: projectData.css || "",
        js: projectData.js || "",
        python: projectData.python || "",
        timestamp: Date.now()
      };
    }
  } catch (e) {
    console.warn("Local project synthesis offline, using simulation template.");
  }

  return getMockProject(prompt);
}

export function getMockProject(message: string): Project {
  const msg = message.toLowerCase();
  if (msg.includes("python")) return MOCK_PROJECTS["python"];
  if (msg.includes("device")) return MOCK_PROJECTS["device"];
  if (msg.includes("dashboard")) return MOCK_PROJECTS["dashboard"];
  return MOCK_PROJECTS["landing"];
}

/**
 * Placeholder for former cloud features.
 * Now points to local browser alternatives.
 */
export const getLiveSession = (callbacks: any, systemInstruction?: string) => {
  console.warn("Cloud-based Gemini Live is disabled in Pure Local Mode.");
  return null;
};

export async function generateCode(prompt: string, type: string, context?: Project): Promise<string> {
  // Local fallback simplified for now
  return `/* Local code generation for ${type} in progress... Please verify Ollama is active. */`;
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  console.warn("Cloud image generation disabled for privacy. Local SD integration pending.");
  return "";
}

export async function evolveApp(prompt: string, currentCode: string): Promise<string> {
  return currentCode;
}
