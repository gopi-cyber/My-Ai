import { Message, Project } from "../types";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
      <div class="flex gap-4">
        <div class="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span class="text-[10px] font-bold uppercase tracking-widest">Neural Link Stable</span>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-8">
      <!-- Camera Module -->
      <div class="col-span-8 space-y-6">
        <div class="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
          <div class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500"></div>
              <span class="text-xs font-bold uppercase tracking-widest">Live Feed: Primary_Optic</span>
            </div>
            <div class="flex gap-2">
              <button id="startCam" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-bold uppercase transition-colors">Start Feed</button>
              <button id="stopCam" class="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[10px] font-bold uppercase transition-colors">Kill Feed</button>
            </div>
          </div>
          <div class="aspect-video bg-black flex items-center justify-center relative group">
            <video id="video" autoplay playsinline class="w-full h-full object-cover opacity-0 transition-opacity duration-500"></video>
            <div id="camPlaceholder" class="absolute inset-0 flex flex-col items-center justify-center text-zinc-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span class="text-[10px] uppercase tracking-[0.2em] mt-4 font-bold">No Signal Detected</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Speaker Output</h3>
            <div class="flex items-center gap-4">
              <button id="testSound" class="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-blue-600 transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover:scale-110 transition-transform"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </button>
              <div class="flex-1">
                <div class="text-[10px] font-bold uppercase tracking-widest mb-2">Volume Level</div>
                <div class="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Neural Processing</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span>Inference Load</span>
                <span class="text-blue-400">42%</span>
              </div>
              <div class="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 w-[42%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Controls -->
      <div class="col-span-4 space-y-6">
        <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <h3 class="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Active Sub-Apps</h3>
          <div class="space-y-4">
            <div class="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-4 group cursor-pointer hover:border-blue-500/50 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div class="text-xs font-bold uppercase tracking-widest">Security_Core</div>
                <div class="text-[10px] text-zinc-500">Encrypted Tunnel Active</div>
              </div>
            </div>
            <div class="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-4 group cursor-pointer hover:border-blue-500/50 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </div>
              <div>
                <div class="text-xs font-bold uppercase tracking-widest">Night_Vision</div>
                <div class="text-[10px] text-zinc-500">Standby Mode</div>
              </div>
            </div>
            <div class="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-4 group cursor-pointer hover:border-blue-500/50 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              <div>
                <div class="text-xs font-bold uppercase tracking-widest">Voice_Synth</div>
                <div class="text-[10px] text-zinc-500">Neural Voice Ready</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-900/20">
          <h3 class="text-xs font-bold uppercase tracking-widest text-blue-100 mb-2">System Action</h3>
          <p class="text-sm text-blue-100/80 mb-6">Synchronize all connected sub-apps to the neural core.</p>
          <button class="w-full py-3 bg-white text-blue-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-blue-50 transition-colors">Sync All Devices</button>
        </div>
      </div>
    </div>
  </div>
</div>`,
    css: `
      body { margin: 0; overflow-x: hidden; }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `,
    js: `
      const video = document.getElementById('video');
      const startBtn = document.getElementById('startCam');
      const stopBtn = document.getElementById('stopCam');
      const placeholder = document.getElementById('camPlaceholder');
      const testSound = document.getElementById('testSound');

      let stream = null;

      startBtn.onclick = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
          video.classList.remove('opacity-0');
          placeholder.classList.add('opacity-0');
          console.log('Camera started');
        } catch (err) {
          console.error('Camera error:', err);
          alert('Camera access denied or not available.');
        }
      };

      stopBtn.onclick = () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          video.classList.add('opacity-0');
          placeholder.classList.remove('opacity-0');
          console.log('Camera stopped');
        }
      };

      testSound.onclick = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 1);
        console.log('Test sound played');
      };
    `,
    python: "",
    timestamp: Date.now()
  },
  "python": {
    id: "mock-python",
    name: "Python Data Processor",
    description: "A Python-based data processing script with basic analysis functions.",
    html: `<div class="p-8 bg-zinc-950 min-h-screen text-white font-mono">
  <h1 class="text-2xl font-bold mb-4">Python Data Processor</h1>
  <div class="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
    <p class="text-zinc-400">This project includes a Python script for data analysis. View the main.py file to see the logic.</p>
  </div>
</div>`,
    css: "body { margin: 0; }",
    js: "console.log('Python project UI initialized');",
    python: `def analyze_data(data):
    """Performs a basic analysis on a list of numbers."""
    if not data:
        return {"mean": 0, "max": 0, "min": 0}
    
    mean = sum(data) / len(data)
    return {
        "mean": mean,
        "max": max(data),
        "min": min(data),
        "count": len(data)
    }

# Example usage
sample_data = [10, 20, 30, 40, 50]
results = analyze_data(sample_data)
print(f"Analysis Results: {results}")
`,
    timestamp: Date.now()
  }
};

export async function* streamChat(messages: Message[], systemInstruction?: string) {
  // Real Gemini Chat
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API_KEY_MISSING: Neural core requires a valid API key. Please check your environment configuration.");
    }

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => {
        const parts: any[] = [{ text: m.content }];
        
        if (m.attachments && m.attachments.length > 0) {
          m.attachments.forEach(att => {
            const [mime, data] = att.split(',');
            parts.push({
              inlineData: {
                mimeType: mime.split(':')[1].split(';')[0],
                data: data
              }
            });
          });
        }

        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts
        };
      }),
      config: {
        systemInstruction: systemInstruction || "You are an expert AI developer assistant. You can generate full projects, modify existing code, and help with complex technical tasks.",
        tools: [{ googleSearch: {} }],
      }
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes("API_KEY_MISSING")) {
      throw error;
    }
    
    if (error.message?.includes("fetch failed") || error.name === "TypeError") {
      throw new Error("NETWORK_ERROR: Connection to neural core failed. Please check your internet connection.");
    }

    if (error.status === 429) {
      throw new Error("RATE_LIMIT_EXCEEDED: Neural core is overloaded. Please wait a moment before retrying.");
    }

    throw new Error(`API_ERROR: ${error.message || "An unexpected error occurred while communicating with the neural core."}`);
  }
}

export async function generateProject(prompt: string, context?: Project): Promise<Project> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API_KEY_MISSING");
    }

    const systemInstruction = `You are an expert full-stack developer. Generate a complete project (HTML, CSS, JavaScript, and optionally Python) based on the user's request.
    ${context ? `The user wants to modify or extend an existing project. Here is the current code:
    HTML: ${context.html}
    CSS: ${context.css}
    JS: ${context.js}
    Python: ${context.python || ''}` : 'This is a new project.'}
    
    Return the result as a JSON object with the following structure:
    {
      "name": "Project Name",
      "description": "Project Description",
      "html": "HTML code",
      "css": "CSS code",
      "js": "JavaScript code",
      "python": "Python code (optional)"
    }
    Ensure the code is modern, responsive, and functional.
    The HTML should include all necessary structure.
    The CSS should use Tailwind CSS (assume it's available via @import "tailwindcss").
    The JS should be clean and handle interactions.
    Do not include any markdown formatting in the JSON response.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      }
    });

    let responseText = response.text || "{}";
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?|```/g, '').trim();
    
    let projectData;
    try {
      projectData = JSON.parse(responseText);
    } catch (e) {
      // Fallback: try to extract JSON from extra text by finding the outermost braces
      const start = responseText.indexOf('{');
      let end = responseText.lastIndexOf('}');
      let parsed = false;
      
      while (start !== -1 && end > start) {
        try {
          projectData = JSON.parse(responseText.substring(start, end + 1));
          parsed = true;
          break;
        } catch (e2) {
          // If parsing fails, try the next '}' from the end
          end = responseText.lastIndexOf('}', end - 1);
        }
      }
      
      if (!parsed) {
        throw new Error("Project synthesis failed: Invalid JSON format.");
      }
    }
    
    // Extract grounding metadata if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) || [];

    return {
      id: Date.now().toString(),
      name: projectData.name || "Untitled Project",
      description: (projectData.description || "A project generated by AI") + (sources.length > 0 ? `\n\nSources: ${sources.join(', ')}` : ""),
      html: projectData.html || "",
      css: projectData.css || "",
      js: projectData.js || "",
      python: projectData.python || "",
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Project generation error:", error);
    throw error;
  }
}

export function getMockProject(message: string): Project {
  const msg = message.toLowerCase();
  if (msg.includes("python") || msg.includes("script") || msg.includes("data")) {
    return MOCK_PROJECTS["python"];
  }
  if (msg.includes("device") || msg.includes("camera") || msg.includes("speaker") || msg.includes("multiple")) {
    return MOCK_PROJECTS["device"];
  }
  if (msg.includes("dashboard") || msg.includes("app")) {
    return MOCK_PROJECTS["dashboard"];
  }
  return MOCK_PROJECTS["landing"];
}

export const getLiveSession = (callbacks: any, systemInstruction?: string) => {
  return ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    callbacks,
    config: {
      systemInstruction: systemInstruction || "You are a helpful AI assistant in live voice mode.",
      responseModalities: ["AUDIO" as any],
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
      }
    }
  });
};

export async function generateCode(prompt: string, type: 'html' | 'css' | 'js' | 'python', context?: Project): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API_KEY_MISSING");
    }

    const systemInstruction = `You are an expert developer. Generate ONLY the ${type.toUpperCase()} code based on the user's request. 
    Do not include markdown code blocks, explanations, or any other text. 
    Just the raw code.
    ${context ? `
    Existing Project Context:
    HTML:
    ${context.html}
    
    CSS:
    ${context.css}
    
    JS:
    ${context.js}
    
    Python:
    ${context.python || ''}
    ` : ''}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });

    return response.text?.replace(/```[a-z]*\n?|```/g, '').trim() || "";
  } catch (error) {
    console.error("Code generation error:", error);
    throw error;
  }
}

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}

export async function evolveApp(prompt: string, currentCode: string): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API_KEY_MISSING");
    }

    const systemInstruction = `You are a System Architect AI. You have the ability to modify your own source code (App.tsx) based on user needs.
    Analyze the current code and the user's request. Propose a complete, updated version of the code.
    Return ONLY the updated code. Do not include markdown code blocks or explanations.
    
    Current App.tsx:
    ${currentCode}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      }
    });

    return response.text?.replace(/```[a-z]*\n?|```/g, '').trim() || "";
  } catch (error) {
    console.error("Self-evolution error:", error);
    throw error;
  }
}
