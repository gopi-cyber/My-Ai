import { Message, Project } from "../types";

/**
 * Detects which AI providers are reachable.
 * Priority: 1. NVIDIA NIM (elite), 2. Ollama (local), 3. Mock (simulation)
 */
export async function getActiveAIProvider(): Promise<'nvidia' | 'ollama' | 'mock'> {
  try {
    const response = await fetch("/api/ai/health");
    if (response.ok) {
      const status = await response.json();
      if (status.nvidia === "active") return "nvidia";
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
  }
};

export async function* streamChat(messages: Message[], systemInstruction?: string) {
  const provider = await getActiveAIProvider();

  // Primary: NVIDIA NIM (Elite)
  if (provider === 'nvidia') {
    try {
      const response = await fetch("/api/ai/nvidia/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "z-ai/glm4.7",
          messages: [
            { role: "system", content: systemInstruction || "You are an expert AI developer assistant." },
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 16384,
          stream: true,
          extra_body: {
            chat_template_kwargs: {
              enable_thinking: true,
              clear_thinking: false
            }
          }
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const data = JSON.parse(dataStr);
                const delta = data.choices[0].delta;
                
                // Prioritize reasoning if present
                if (delta.reasoning_content) {
                  yield `\n> [THINK]: ${delta.reasoning_content}\n`;
                }
                
                if (delta.content) {
                  yield delta.content;
                }
              } catch (e) {}
            }
          }
        }
        return;
      }
    } catch (e) {
      console.warn("NVIDIA Elite core unreachable, falling back to local...");
    }
  }

  // Fallback: Local Ollama
  try {
    const response = await fetch("/api/ollama/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        system: systemInstruction || "You are a local AI assistant.",
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
  } catch (e) {}

  // Final Fallback: Simulation
  const mockText = "Operating in Simulation mode. Use NVIDIA NIM or Ollama for full intelligence.";
  for (const char of mockText) {
    yield char;
    await new Promise(r => setTimeout(r, 10));
  }
}

export async function generateProject(prompt: string, context?: Project): Promise<Project> {
  const provider = await getActiveAIProvider();

  if (provider === 'nvidia') {
    try {
      const response = await fetch("/api/ai/nvidia/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "z-ai/glm4.7",
          messages: [
            { role: "system", content: "You are an AI architect. Return ONLY valid JSON for a project with keys: name, description, html, css, js, python." },
            { role: "user", content: `Generate a complete project for: ${prompt}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });
      if (response.ok) {
        const data = await response.json();
        const projectData = JSON.parse(data.choices[0].message.content.replace(/```json\n?|```/g, '').trim());
        return {
          id: Date.now().toString(),
          name: projectData.name || "NVIDIA Synthesis",
          description: projectData.description || "Synthesized by NVIDIA Elite Core.",
          html: projectData.html || "",
          css: projectData.css || "",
          js: projectData.js || "",
          python: projectData.python || "",
          timestamp: Date.now()
        };
      }
    } catch (e) {}
  }

  // Ollama Fallback
  try {
    const response = await fetch("/api/ollama/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        prompt: `Generate a complete project for: ${prompt}. Return ONLY a JSON object with keys: name, description, html, css, js, python.`,
        format: "json",
        stream: false
      })
    });
    if (response.ok) {
      const data = await response.json();
      const projectData = JSON.parse(data.response);
      return {
        id: Date.now().toString(),
        name: projectData.name || "Local Sync Project",
        description: projectData.description || "Synthesized locally.",
        html: projectData.html || "",
        css: projectData.css || "",
        js: projectData.js || "",
        python: projectData.python || "",
        timestamp: Date.now()
      };
    }
  } catch (e) {}

  return getMockProject(prompt);
}

export function getMockProject(message: string): Project {
  return MOCK_PROJECTS["landing"];
}

export const getLiveSession = (callbacks: any, systemInstruction?: string) => null;

export async function generateCode(prompt: string, type: string, context?: Project): Promise<string> {
  return `/* Generation logic to be updated for NVIDIA/Ollama. */`;
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  return "";
}

export async function evolveApp(prompt: string, currentCode: string): Promise<string> {
  return currentCode;
}
