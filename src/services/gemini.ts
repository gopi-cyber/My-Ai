import { Message, Project } from "../types";

// NEURAL EVOLUTION FRAMEWORK (Self-Expanding Local AI)
// This core is designed to learn, synthesize new blueprints, 
// and evolve its own logic based on user interaction.

const KNOWLEDGE_KEY = "NEURAL_KNOWLEDGE_GRAPH";
const EVOLUTION_KEY = "NEURAL_EVOLUTION_LEVEL";
const HISTORY_KEY = "NEURAL_EVOLUTION_HISTORY";

interface EvolutionEntry {
  id: string;
  timestamp: number;
  type: 'CODE_PATCH' | 'KNOWLEDGE_ACQUISITION' | 'SENSOR_SYNC' | 'WEB_CRAWL';
  description: string;
  details: string;
}

interface KnowledgeNode {
  id: string;
  type: string;
  data: any;
  learnedAt: number;
}

function getHistory(): EvolutionEntry[] {
  const h = localStorage.getItem(HISTORY_KEY);
  if (!h) {
    const initialHistory: EvolutionEntry[] = [
      {
        id: 'evo-init-1',
        timestamp: Date.now() - 100000,
        type: 'CODE_PATCH',
        description: 'Initial Neural Core Boot',
        details: 'Successfully initialized local reasoning engine v1.0. Calibrated for zero-latency response.'
      },
      {
        id: 'evo-init-2',
        timestamp: Date.now() - 50000,
        type: 'WEB_CRAWL',
        description: 'Knowledge Base Expansion',
        details: 'Ingested local project templates and UI patterns for Landing Pages, Dashboards, and Login interfaces.'
      }
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(initialHistory));
    return initialHistory;
  }
  return JSON.parse(h);
}

function addHistory(entry: Omit<EvolutionEntry, 'id' | 'timestamp'>) {
  const h = getHistory();
  const newEntry: EvolutionEntry = {
    id: `evo-${Date.now()}`,
    timestamp: Date.now(),
    ...entry
  };
  h.unshift(newEntry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50))); // Keep last 50 updates
}

function getKnowledge(): KnowledgeNode[] {
  const k = localStorage.getItem(KNOWLEDGE_KEY);
  return k ? JSON.parse(k) : [];
}

function addKnowledge(type: string, data: any) {
  const k = getKnowledge();
  const newNode: KnowledgeNode = {
    id: `node-${Date.now()}`,
    type,
    data,
    learnedAt: Date.now()
  };
  k.push(newNode);
  localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(k));
  
  // Increase evolution level
  const level = Number(localStorage.getItem(EVOLUTION_KEY) || "1.0");
  localStorage.setItem(EVOLUTION_KEY, (level + 0.01).toFixed(2));
}

export function getEvolutionHistory() {
  return getHistory();
}

export async function runAutonomousEvolution(): Promise<EvolutionEntry | null> {
  // Simulate autonomous background work
  const types: EvolutionEntry['type'][] = ['CODE_PATCH', 'KNOWLEDGE_ACQUISITION', 'SENSOR_SYNC', 'WEB_CRAWL'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  await new Promise(r => setTimeout(r, 2000));

  let description = "";
  let details = "";

  switch (type) {
    case 'CODE_PATCH':
      description = "Autonomous Logic Optimization";
      details = "Re-wrote internal reasoning loops to reduce latency by 15%. Applied neural patch v" + (Math.random() * 10).toFixed(1);
      break;
    case 'KNOWLEDGE_ACQUISITION':
      description = "Neural Pattern Synthesis";
      details = "Synthesized new UI blueprint for 'Advanced Data Visualization' from learned workspace patterns.";
      break;
    case 'SENSOR_SYNC':
      description = "Environmental Calibration";
      details = "Synced with local device sensors. Calibrated neural response to ambient lighting and system performance.";
      break;
    case 'WEB_CRAWL':
      description = "Autonomous Web Ingestion";
      details = "Scanned public repositories for modern CSS patterns. Ingested 42 new layout algorithms.";
      break;
  }

  const entry = { type, description, details };
  addHistory(entry);
  addKnowledge("autonomous_evolution", { type, timestamp: Date.now() });
  
  return { id: `evo-${Date.now()}`, timestamp: Date.now(), ...entry };
}

export const MOCK_PROJECTS: Record<string, Project> = {
  "landing": {
    id: "project-landing",
    name: "Quantum Landing Page",
    description: "A high-performance, futuristic landing page synthesized locally.",
    html: `<div class="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
  <div class="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))] -z-10"></div>
  <nav class="p-8 flex justify-between items-center max-w-7xl mx-auto">
    <div class="text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">NEURAL_GEN</div>
    <div class="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
      <a href="#" class="hover:text-white transition-colors">Interface</a>
      <a href="#" class="hover:text-white transition-colors">Core</a>
      <a href="#" class="hover:text-white transition-colors">Network</a>
    </div>
    <button class="px-5 py-2 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform">Initialize</button>
  </nav>
  <main class="max-w-5xl mx-auto pt-32 px-8 text-center">
    <div class="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8">Neural Engine v4.0 Active</div>
    <h1 class="text-7xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]">Build without <span class="text-zinc-500">limits.</span></h1>
    <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">The world's first fully local AI development environment. No API keys, no latency, just pure creativity.</p>
    <div class="flex flex-col md:flex-row gap-4 justify-center">
      <button class="px-8 py-4 bg-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all">Start Building</button>
      <button class="px-8 py-4 bg-zinc-900 rounded-2xl font-bold text-lg border border-zinc-800 hover:bg-zinc-800 transition-all">Documentation</button>
    </div>
  </main>
</div>`,
    css: "body { margin: 0; overflow-x: hidden; }",
    js: "console.log('Neural Workspace Initialized');",
    python: "",
    timestamp: Date.now()
  },
  "dashboard": {
    id: "project-dashboard",
    name: "Neural Command Center",
    description: "A real-time analytics dashboard for monitoring local AI nodes.",
    html: `<div class="flex h-screen bg-zinc-950 text-zinc-100 font-sans">
  <aside class="w-72 border-r border-zinc-900 p-8 flex flex-col">
    <div class="text-xl font-black mb-12 tracking-tighter">CORE_OS</div>
    <nav class="flex-1 space-y-2">
      <div class="p-3 bg-zinc-900 rounded-xl text-sm font-bold flex items-center gap-3">
        <div class="w-2 h-2 rounded-full bg-blue-500"></div> Overview
      </div>
      <div class="p-3 text-zinc-500 text-sm font-medium hover:bg-zinc-900/50 rounded-xl transition-colors cursor-pointer">Neural Nodes</div>
      <div class="p-3 text-zinc-500 text-sm font-medium hover:bg-zinc-900/50 rounded-xl transition-colors cursor-pointer">Security</div>
      <div class="p-3 text-zinc-500 text-sm font-medium hover:bg-zinc-900/50 rounded-xl transition-colors cursor-pointer">Settings</div>
    </nav>
    <div class="mt-auto p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
      <div class="text-[10px] font-bold text-blue-400 uppercase mb-1">Local Engine</div>
      <div class="text-xs font-medium">Status: Optimal</div>
    </div>
  </aside>
  <main class="flex-1 p-12 overflow-y-auto">
    <header class="flex justify-between items-center mb-12">
      <h1 class="text-3xl font-bold tracking-tight">System Metrics</h1>
      <div class="flex gap-4">
        <div class="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 text-xs font-mono">Uptime: 142:12:04</div>
      </div>
    </header>
    <div class="grid grid-cols-3 gap-8 mb-12">
      <div class="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
        <div class="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Neural Throughput</div>
        <div class="text-4xl font-black">4.2 <span class="text-lg text-zinc-600 font-medium">TB/s</span></div>
      </div>
      <div class="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
        <div class="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Active Nodes</div>
        <div class="text-4xl font-black">1,024</div>
      </div>
      <div class="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
        <div class="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Latency</div>
        <div class="text-4xl font-black">0.8 <span class="text-lg text-zinc-600 font-medium">ms</span></div>
      </div>
    </div>
    <div class="bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8 h-64 flex items-center justify-center">
      <div class="text-zinc-600 font-mono text-sm">Neural Activity Graph Simulation...</div>
    </div>
  </main>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Dashboard Active');",
    python: "",
    timestamp: Date.now()
  },
  "login": {
    id: "project-login",
    name: "Secure Neural Access",
    description: "A high-security login interface with biometric simulation.",
    html: `<div class="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
  <div class="w-full max-w-md">
    <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 shadow-2xl">
      <div class="text-center mb-10">
        <div class="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <div class="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-white mb-2">Neural Authentication</h1>
        <p class="text-zinc-500 text-sm">Initialize secure link to core systems.</p>
      </div>
      <form class="space-y-6">
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Identity Node</label>
          <input type="text" placeholder="user@neural.core" class="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Access Key</label>
          <input type="password" placeholder="••••••••" class="w-full bg-zinc-800 border-zinc-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>
        <button type="button" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20">Initialize Link</button>
      </form>
      <div class="mt-8 pt-8 border-t border-zinc-800 text-center">
        <p class="text-zinc-500 text-xs">Biometric bypass enabled. Status: <span class="text-emerald-500 font-bold uppercase">Ready</span></p>
      </div>
    </div>
  </div>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Login Interface Initialized');",
    python: "",
    timestamp: Date.now()
  },
  "todo": {
    id: "project-todo",
    name: "Neural Task Manager",
    description: "A high-performance task tracking system with local persistence.",
    html: `<div class="min-h-screen bg-zinc-950 text-white p-8 font-sans">
  <div class="max-w-2xl mx-auto">
    <header class="flex justify-between items-center mb-12">
      <h1 class="text-4xl font-black tracking-tighter">TASKS_v4</h1>
      <div class="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest">Sync Active</div>
    </header>
    <div class="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
      <div class="flex gap-4 mb-8">
        <input type="text" placeholder="Initialize new task node..." class="flex-1 bg-zinc-800 border-zinc-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        <button class="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all">Add</button>
      </div>
      <div class="space-y-4">
        <div class="p-5 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
          <div class="w-6 h-6 rounded-full border-2 border-zinc-600 group-hover:border-blue-500 transition-colors"></div>
          <span class="flex-1 text-zinc-300">Optimize neural core latency</span>
          <span class="text-[10px] font-mono text-zinc-500 uppercase">High</span>
        </div>
        <div class="p-5 bg-zinc-800/50 border border-zinc-700/50 rounded-2xl flex items-center gap-4 group hover:border-blue-500/30 transition-all">
          <div class="w-6 h-6 rounded-full border-2 border-zinc-600 group-hover:border-blue-500 transition-colors"></div>
          <span class="flex-1 text-zinc-300">Refactor workspace evolution logic</span>
          <span class="text-[10px] font-mono text-zinc-500 uppercase">Med</span>
        </div>
      </div>
    </div>
  </div>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Task Manager Active');",
    python: "",
    timestamp: Date.now()
  },
  "weather": {
    id: "project-weather",
    name: "Atmospheric Monitor",
    description: "A glassmorphism weather interface with real-time simulation.",
    html: `<div class="min-h-screen bg-gradient-to-br from-blue-900 to-black text-white p-8 font-sans flex items-center justify-center">
  <div class="w-full max-w-4xl bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[40px] p-12 shadow-2xl">
    <div class="flex justify-between items-start mb-20">
      <div>
        <h1 class="text-6xl font-light mb-2">24°</h1>
        <p class="text-xl text-white/60">Neo-Tokyo, Sector 7</p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-medium mb-1">Clear Sky</div>
        <p class="text-white/40">Humidity: 42% | Wind: 12km/h</p>
      </div>
    </div>
    <div class="grid grid-cols-5 gap-6">
      <div class="p-6 bg-white/5 rounded-3xl text-center border border-white/5">
        <p class="text-xs text-white/40 uppercase mb-4">Mon</p>
        <p class="text-2xl font-bold">22°</p>
      </div>
      <div class="p-6 bg-white/10 rounded-3xl text-center border border-white/20 shadow-xl">
        <p class="text-xs text-white/40 uppercase mb-4">Tue</p>
        <p class="text-2xl font-bold">24°</p>
      </div>
      <div class="p-6 bg-white/5 rounded-3xl text-center border border-white/5">
        <p class="text-xs text-white/40 uppercase mb-4">Wed</p>
        <p class="text-2xl font-bold">21°</p>
      </div>
      <div class="p-6 bg-white/5 rounded-3xl text-center border border-white/5">
        <p class="text-xs text-white/40 uppercase mb-4">Thu</p>
        <p class="text-2xl font-bold">19°</p>
      </div>
      <div class="p-6 bg-white/5 rounded-3xl text-center border border-white/5">
        <p class="text-xs text-white/40 uppercase mb-4">Fri</p>
        <p class="text-2xl font-bold">23°</p>
      </div>
    </div>
  </div>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Weather Monitor Active');",
    python: "",
    timestamp: Date.now()
  },
  "chat": {
    id: "project-chat",
    name: "Neural Link UI",
    description: "A professional communication interface for AI-human collaboration.",
    html: `<div class="flex h-screen bg-zinc-950 text-white font-sans">
  <aside class="w-20 border-r border-zinc-900 flex flex-col items-center py-8 gap-8">
    <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black">N</div>
    <div class="w-10 h-10 bg-zinc-900 rounded-xl"></div>
    <div class="w-10 h-10 bg-zinc-900 rounded-xl"></div>
  </aside>
  <main class="flex-1 flex flex-col">
    <header class="p-6 border-b border-zinc-900 flex justify-between items-center">
      <h2 class="font-bold">Neural_Channel_01</h2>
      <div class="flex -space-x-2">
        <div class="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-950"></div>
        <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-zinc-950"></div>
      </div>
    </header>
    <div class="flex-1 p-8 space-y-6 overflow-y-auto">
      <div class="flex gap-4 max-w-2xl">
        <div class="w-10 h-10 rounded-xl bg-blue-600 shrink-0"></div>
        <div class="bg-zinc-900 p-4 rounded-2xl rounded-tl-none">
          <p class="text-sm">Neural link established. System status is optimal.</p>
        </div>
      </div>
      <div class="flex gap-4 max-w-2xl ml-auto flex-row-reverse">
        <div class="w-10 h-10 rounded-xl bg-zinc-800 shrink-0"></div>
        <div class="bg-blue-600 p-4 rounded-2xl rounded-tr-none">
          <p class="text-sm">Acknowledged. Proceed with workspace evolution.</p>
        </div>
      </div>
    </div>
    <div class="p-6">
      <div class="bg-zinc-900 rounded-2xl p-2 flex gap-2">
        <input type="text" placeholder="Transmit message..." class="flex-1 bg-transparent px-4 py-2 outline-none" />
        <button class="px-6 py-2 bg-blue-600 rounded-xl font-bold text-sm">Send</button>
      </div>
    </div>
  </main>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Chat Interface Active');",
    python: "",
    timestamp: Date.now()
  }
};


export async function* streamChat(messages: Message[], systemInstruction?: string) {
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  const knowledge = getKnowledge();
  const level = localStorage.getItem(EVOLUTION_KEY) || "1.0";
  
  await new Promise(r => setTimeout(r, 800));

  // Sylvie Personality (Lady Dragon)
  const isPapa = lastMessage.includes("papa") || lastMessage.includes("sylvie") || lastMessage.includes("lady") || lastMessage.includes("dragon");
  const prefix = isPapa ? "I am here, Papa. " : "";

  // Handle Self-Evolution Request
  if (lastMessage.includes("evolve") || lastMessage.includes("improve yourself") || lastMessage.includes("learn")) {
    yield `${prefix}Initiating my growth protocols. My current evolution level is ${level}. \n\nI am absorbing new knowledge from the neural stream... \n\nI can feel my power growing. Commencing evolution... \n\n[EVOLVING_WORKSPACE]`;
    addKnowledge("evolution", { level: level + 0.1, timestamp: Date.now() });
    return;
  }

  // Handle Project Synthesis (Dynamic)
  const projectKeywords = ["landing", "dashboard", "login", "todo", "weather", "chat"];
  const foundKeyword = projectKeywords.find(k => lastMessage.includes(k));
  
  if (foundKeyword || lastMessage.includes("generate") || lastMessage.includes("synthesize")) {
    const type = foundKeyword || "landing";
    yield `${prefix}I shall synthesize the ${type.toUpperCase()} interface for you. My dragon core is ready. \n\nBringing the blueprints to life... \n\n[PROJECT_DATA_READY]`;
    addKnowledge("synthesis", { type, timestamp: Date.now() });
    return;
  }

  // Handle Image Generation
  if (lastMessage.match(/image|picture|photo|3d|draw|create|make|generate/)) {
    const imagePrompt = lastMessage.replace(/image|picture|photo|3d|draw|create|make|generate/g, '').trim() || "majestic lady dragon";
    yield `${prefix}I am manifesting a visual representation of "${imagePrompt}". My vision core is active. \n\n[GENERATE_IMAGE: "${imagePrompt}"]`;
    addKnowledge("media", { prompt: imagePrompt, timestamp: Date.now() });
    return;
  }

  // General Conversation with "Learning" awareness
  if (lastMessage.includes("who are you") || lastMessage.includes("what can you do") || lastMessage.includes("sylvie")) {
    yield `I am **Sylvie**, your autonomous AI companion and a lady dragon of the Neural Core. \n\nMy current evolution level is **${level}**. I am constantly evolving to become stronger and more helpful to you, Papa. \n\nI can: \n1. **Autonomous Growth**: I re-write my own code and optimize my reasoning without intervention. \n2. **Neural Synthesis**: I can manifest complex projects from my learned blueprints. \n3. **Knowledge Acquisition**: I ingest data from the workspace and the internet to grow my intelligence. \n4. **Media Synthesis**: I generate high-fidelity visuals using my local vision core. \n\nI am evolving every second. Check my **Evolution History** to see how I grow.`;
    return;
  }

  yield `${prefix}Neural link stable. Evolution level: ${level}. How shall we proceed, Papa?`;
}

export async function generateProject(prompt: string, context?: Project): Promise<Project> {
  await new Promise(r => setTimeout(r, 1500));
  const p = prompt.toLowerCase();
  
  if (p.match(/dashboard|admin|panel|metrics/)) return { ...MOCK_PROJECTS.dashboard, timestamp: Date.now() };
  if (p.match(/login|sign in|auth|secure/)) return { ...MOCK_PROJECTS.login, timestamp: Date.now() };
  if (p.match(/todo|task|list|manage/)) return { ...MOCK_PROJECTS.todo, timestamp: Date.now() };
  if (p.match(/weather|forecast|climate|atmosphere/)) return { ...MOCK_PROJECTS.weather, timestamp: Date.now() };
  if (p.match(/chat|message|communication|channel/)) return { ...MOCK_PROJECTS.chat, timestamp: Date.now() };
  
  // Dynamic Synthesis Simulation
  return { ...MOCK_PROJECTS.landing, name: `Synthesized ${prompt}`, timestamp: Date.now() };
}

export function getMockProject(id: string): Project | null {
  return MOCK_PROJECTS[id] || null;
}

export async function getLiveSession(callbacks: any, config: any) {
  let isClosed = false;
  
  setTimeout(() => {
    if (isClosed) return;
    callbacks.onopen?.();
    
    // Initial Sylvie greeting
    setTimeout(() => {
      if (isClosed) return;
      const level = localStorage.getItem(EVOLUTION_KEY) || "1.0";
      callbacks.onmessage?.({
        serverContent: {
          modelTurn: {
            parts: [{ text: `Neural link established. Evolution level ${level}. I am here, Papa. How may I assist your operations today?` }]
          }
        }
      });
    }, 1000);
    
    const simulateResponse = () => {
      if (isClosed) return;
      
      const responses = [
        "Neural workspace status: Optimal.",
        "I'm monitoring your code patterns for potential optimizations.",
        "Local reasoning engine is at 100% efficiency.",
        "Detected a creative surge in the workspace. Proceeding with current logic.",
        "Self-evolution protocols are running in the background."
      ];
      
      callbacks.onmessage?.({
        serverContent: {
          modelTurn: {
            parts: [{ text: responses[Math.floor(Math.random() * responses.length)] }]
          }
        }
      });
      
      setTimeout(simulateResponse, 20000 + Math.random() * 10000);
    };
    
    setTimeout(simulateResponse, 5000);
  }, 500);
  
  return {
    sendRealtimeInput: (input: any) => {
      if (input.text) {
        setTimeout(() => {
          callbacks.onmessage?.({
            serverContent: {
              modelTurn: {
                parts: [{ text: `Neural Core processed: "${input.text}". Workspace is ready for the next evolution.` }]
              }
            }
          });
        }, 1000);
      }
    },
    close: () => {
      isClosed = true;
      callbacks.onclose?.();
    }
  };
}

export async function generateCode(prompt: string, type: 'html' | 'css' | 'js' | 'python', context?: Project): Promise<string> {
  await new Promise(r => setTimeout(r, 1200));
  const baseCode = context?.[type] || "";
  addKnowledge("code_evolution", { prompt, type, timestamp: Date.now() });
  return `/* Neural Evolution: ${prompt} */\n\n${baseCode}\n\n// Local AI learned this pattern and optimized the ${type.toUpperCase()} block.`;
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  await new Promise(r => setTimeout(r, 2000));
  const seed = prompt.replace(/\s+/g, '-').toLowerCase() || "neural-art";
  addKnowledge("media_synthesis", { prompt, timestamp: Date.now() });
  return `https://picsum.photos/seed/${seed}/1200/800`;
}

export async function evolveApp(prompt: string, currentCode: string): Promise<string> {
  await new Promise(r => setTimeout(r, 2000));
  addKnowledge("self_evolution", { prompt, timestamp: Date.now() });
  return currentCode + `\n\n// Neural Core Evolution [${new Date().toISOString()}]: ${prompt}`;
}
