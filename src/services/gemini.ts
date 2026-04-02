import { Message, Project } from "../types";

// Local AI Simulator - Works without API keys
// Mimics AI behavior using local logic and templates

export const MOCK_PROJECTS: Record<string, Project> = {
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
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  
  await new Promise(r => setTimeout(r, 1000));

  if (lastMessage.includes("landing")) {
    yield "I've detected you want a landing page. I'm preparing the neural workspace for you now.\n\n[PROJECT_DATA_READY]";
    return;
  }

  if (lastMessage.includes("dashboard")) {
    yield "Synthesizing an analytics dashboard template for your project.\n\n[PROJECT_DATA_READY]";
    return;
  }

  if (lastMessage.includes("hello") || lastMessage.includes("hi")) {
    yield "Greetings. I am your Local AI Assistant. I can help you build projects and manage your workspace without any external API calls.";
    return;
  }

  yield "I'm processing your request locally. You can ask me to generate a 'landing page' or a 'dashboard' to see the workspace features in action.";
}

export async function generateProject(prompt: string, context?: Project): Promise<Project> {
  await new Promise(r => setTimeout(r, 2000));
  const p = prompt.toLowerCase();
  
  if (p.includes("dashboard")) return MOCK_PROJECTS.dashboard;
  return MOCK_PROJECTS.landing;
}

export function getMockProject(id: string): Project | null {
  return MOCK_PROJECTS[id] || null;
}

export async function getLiveSession(callbacks: any, config: any) {
  setTimeout(() => {
    callbacks.onopen?.();
  }, 500);
  
  return {
    sendRealtimeInput: (input: any) => {
      console.log("Simulating realtime input:", input);
    },
    close: () => {}
  };
}

export async function generateCode(prompt: string, type: 'html' | 'css' | 'js' | 'python', context?: Project): Promise<string> {
  await new Promise(r => setTimeout(r, 1500));
  return `/* Local AI Generated ${type.toUpperCase()} */\n\n${context?.[type] || ""}\n\n// Added local simulation logic for: ${prompt}`;
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  await new Promise(r => setTimeout(r, 2000));
  const seed = prompt.replace(/\s+/g, '-').toLowerCase();
  return `https://picsum.photos/seed/${seed}/800/800`;
}

export async function evolveApp(prompt: string, currentCode: string): Promise<string> {
  return currentCode + `\n\n// Local Evolution: ${prompt}`;
}
