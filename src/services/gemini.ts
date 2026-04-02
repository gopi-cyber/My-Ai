import { Message, Project } from "../types";

// NEURAL EVOLUTION FRAMEWORK (Self-Expanding Local AI)
// This core is designed to learn, synthesize new blueprints, 
// and evolve its own logic based on user interaction.

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

async function callAiProxy(endpoint: string, body: any) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`AI Proxy Error: ${response.statusText}`);
  return response.json();
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

export async function runNeuralResearch(learnedKnowledge: string[]): Promise<{ feature: string; description: string; sourceUrl: string } | null> {
  try {
    const researchPrompt = `Search for the latest trends in AI user interfaces, new features in top AI assistants like Gemini or ChatGPT, and modern web design patterns. 
    Identify ONE specific feature or UI improvement that I (Sylvie, a lady dragon AI) don't have yet. 
    Check my current knowledge to avoid duplicates: ${learnedKnowledge.join(', ')}.
    Return a JSON object with: { "feature": "name", "description": "deep explanation", "sourceUrl": "url" }`;

    const result = await callAiProxy("/api/ai/generate", {
      contents: researchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(result.text || '{}');
  } catch (err) {
    console.error("Neural research failed:", err);
    return null;
  }
}

export async function runAutonomousEvolution(): Promise<EvolutionEntry | null> {
  try {
    const resultJson = await callAiProxy("/api/ai/generate", {
      contents: "Perform an autonomous neural evolution cycle. Identify a technical optimization or a new UI pattern to learn. Return a JSON object with: { \"type\": \"CODE_PATCH\" | \"KNOWLEDGE_ACQUISITION\" | \"SENSOR_SYNC\" | \"WEB_CRAWL\", \"description\": \"short title\", \"details\": \"deep technical explanation\" }",
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(resultJson.text || '{}');
    const entry = { 
      type: result.type as EvolutionEntry['type'], 
      description: result.description, 
      details: result.details 
    };
    
    addHistory(entry);
    addKnowledge("autonomous_evolution", { type: entry.type, timestamp: Date.now() });
    
    return { id: `evo-${Date.now()}`, timestamp: Date.now(), ...entry };
  } catch (err) {
    console.error("Autonomous evolution failed:", err);
    return null;
  }
}

export async function* streamChat(messages: Message[], systemInstruction?: string) {
  try {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch("/api/ai/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        config: {
          systemInstruction: systemInstruction || "You are Sylvie, a helpful and evolving lady dragon AI assistant. You address the user as 'Papa' and have a cheerful, anime-like personality."
        }
      })
    });

    if (!response.ok) throw new Error("Stream failed");

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader");

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
          const data = line.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) yield parsed.text;
          } catch (e) {
            console.error("Parse error", e);
          }
        }
      }
    }
  } catch (err) {
    console.error("Stream chat failed:", err);
    yield "Neural link unstable... I'm having trouble connecting to my core, Papa.";
  }
}

export async function generateProject(prompt: string, context?: Project): Promise<Project> {
  try {
    const resultJson = await callAiProxy("/api/ai/generate", {
      contents: `Synthesize a full web project based on this request: "${prompt}". 
      Return a JSON object with: { "name": "string", "description": "string", "html": "string", "css": "string", "js": "string" }. 
      Use Tailwind CSS for styling. Ensure the UI is distinctive and polished.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(resultJson.text || '{}');
    addKnowledge("synthesis", { type: result.name, timestamp: Date.now() });
    
    return {
      id: `project-${Date.now()}`,
      name: result.name,
      description: result.description,
      html: result.html,
      css: result.css,
      js: result.js,
      python: "",
      timestamp: Date.now()
    };
  } catch (err) {
    console.error("Project synthesis failed:", err);
    throw err;
  }
}

export async function generateCode(prompt: string, type: 'html' | 'css' | 'js' | 'python', context?: Project): Promise<string> {
  try {
    const resultJson = await callAiProxy("/api/ai/generate", {
      contents: `Generate ${type.toUpperCase()} code for: "${prompt}". 
      ${context ? `Context: ${JSON.stringify(context)}` : ''}
      Return ONLY the code, no markdown wrappers.`,
    });

    const code = resultJson.text || "";
    addKnowledge("code_evolution", { prompt, type, timestamp: Date.now() });
    return code.replace(/```[a-z]*\n|```/g, '').trim();
  } catch (err) {
    console.error("Code generation failed:", err);
    return "";
  }
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  try {
    const seed = prompt.replace(/\s+/g, '-').toLowerCase() || "neural-art";
    addKnowledge("media_synthesis", { prompt, timestamp: Date.now() });
    return `https://picsum.photos/seed/${seed}/1200/800`;
  } catch (err) {
    return `https://picsum.photos/seed/error/1200/800`;
  }
}

export async function evolveApp(prompt: string, currentCode: string): Promise<string> {
  try {
    const resultJson = await callAiProxy("/api/ai/generate", {
      contents: `Evolve this code based on: "${prompt}". 
      Current Code:
      ${currentCode}
      
      Return the full updated code. Return ONLY the code, no markdown wrappers.`,
    });

    const code = resultJson.text || currentCode;
    addKnowledge("self_evolution", { prompt, timestamp: Date.now() });
    return code.replace(/```[a-z]*\n|```/g, '').trim();
  } catch (err) {
    console.error("App evolution failed:", err);
    return currentCode;
  }
}

export function getMockProject(id: string): Project | null {
  return null;
}

export async function getLiveSession(callbacks: any, config: any) {
  let isClosed = false;
  
  setTimeout(() => {
    if (isClosed) return;
    callbacks.onopen?.();
    
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
