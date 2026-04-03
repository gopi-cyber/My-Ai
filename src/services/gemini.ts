import { Message, Project } from "../types";

// NEURAL EVOLUTION FRAMEWORK (Local-Only Brain)
// This core now operates entirely locally, using heuristic-based reasoning
// and simulated evolution to provide a self-contained experience.

const KNOWLEDGE_KEY = "NEURAL_KNOWLEDGE_GRAPH";
const EVOLUTION_KEY = "NEURAL_EVOLUTION_LEVEL";
const HISTORY_KEY = "NEURAL_EVOLUTION_HISTORY";

export interface EvolutionEntry {
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
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 50)));
}

function addKnowledge(type: string, data: any) {
  const level = Number(localStorage.getItem(EVOLUTION_KEY) || "1.0");
  localStorage.setItem(EVOLUTION_KEY, (level + 0.01).toFixed(2));
}

export function getEvolutionHistory() {
  return getHistory();
}

export async function runNeuralResearch(learnedKnowledge: string[]): Promise<{ feature: string; description: string; sourceUrl: string } | null> {
  // Local-only simulated research
  const simulatedFeatures = [
    { feature: "Quantum UI Rendering", description: "A new way to render UI components using probabilistic state transitions for smoother animations.", sourceUrl: "https://neural-link.sylvie/quantum-ui" },
    { feature: "Bio-Metric Feedback Loop", description: "Sylvie can now sense your typing rhythm to adjust her response tone to your mood.", sourceUrl: "https://neural-link.sylvie/bio-feedback" },
    { feature: "Holographic Workspace", description: "A 3D projection mode for the workspace that allows for spatial code organization.", sourceUrl: "https://neural-link.sylvie/holographic" }
  ];
  const unlearned = simulatedFeatures.filter(f => !learnedKnowledge.includes(f.feature));
  if (unlearned.length === 0) return null;
  return unlearned[Math.floor(Math.random() * unlearned.length)];
}

export async function runAutonomousEvolution(): Promise<EvolutionEntry | null> {
  const fallbackEntry = {
    type: 'CODE_PATCH' as const,
    description: 'Neural Core Optimization',
    details: 'Optimized local reasoning pathways for faster response times in local-only mode.'
  };
  addHistory(fallbackEntry);
  return { id: `evo-${Date.now()}`, timestamp: Date.now(), ...fallbackEntry };
}

export async function* streamChat(messages: Message[], systemInstruction?: string) {
  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  
  let response = "I am operating in local-only mode, Papa. ";
  if (lastMessage.includes("hello")) response += "Greetings! How can I assist with your local workspace today?";
  else if (lastMessage.includes("help")) response += "I can manage your project files, optimize local code, and simulate neural evolution.";
  else response += "I am processing your request using my local reasoning engine. What would you like to do?";
  
  yield response;
}

export async function generateProject(prompt: string, context?: Project): Promise<Project> {
  return {
    id: `project-${Date.now()}`,
    name: "Local Project",
    description: "Generated locally without external API.",
    html: "<div>Local Project Content</div>",
    css: "body { background: #111; color: #fff; }",
    js: "console.log('Local project initialized');",
    python: "",
    timestamp: Date.now()
  };
}

export async function generateCode(prompt: string, type: 'html' | 'css' | 'js' | 'python', context?: Project): Promise<string> {
  return `/* Local-only code generation for ${type} */\n\n// Prompt: ${prompt}\n\n// Implementation logic would go here.`;
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const seed = prompt.replace(/\s+/g, '-').toLowerCase() || "neural-art";
  return `https://picsum.photos/seed/${seed}/1200/800`;
}

export async function evolveApp(prompt: string, currentCode: string): Promise<string> {
  return currentCode + `\n\n// Locally evolved based on: ${prompt}`;
}

export function getMockProject(id: string): Project | null {
  return null;
}

export async function getLiveSession(callbacks: any, config: any) {
  return {
    sendRealtimeInput: (input: any) => {
      callbacks.onmessage?.({
        serverContent: {
          modelTurn: {
            parts: [{ text: `Neural Core (Local) processed: "${input.text}".` }]
          }
        }
      });
    },
    close: () => callbacks.onclose?.()
  };
}
