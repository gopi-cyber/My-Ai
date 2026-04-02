import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GitPanel } from './components/GitPanel';
import { MediaStudio } from './components/MediaStudio';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  Terminal, 
  Cpu, 
  Zap, 
  User, 
  Bot,
  Loader2,
  ChevronRight,
  Plus,
  Layout,
  MessageSquare,
  Code,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Eye, 
  Rocket, 
  Copy,
  CheckCircle,
  AlertCircle,
  Settings,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  History,
  Sparkles,
  Info,
  ChevronLeft,
  Play,
  Square,
  RefreshCw,
  Globe,
  Palette,
  Heart,
  Link2,
  Activity,
  UserCheck,
  GitBranch,
  Sun,
  Moon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Editor from 'react-simple-code-editor';
import prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { cn } from './lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster, toast } from 'sonner';
import { Message, Project } from './types';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  User as FirebaseUser
} from './firebase';
import { streamChat, getMockProject, getLiveSession, generateCode, generateProject, evolveApp, generateImageFromPrompt, runAutonomousEvolution, getEvolutionHistory } from './services/gemini';
import { validateJS, validateCSS, validateHTML, validatePython, ValidationError } from './lib/validator';
import { JSREPL } from './components/JSREPL';
import { PythonREPL } from './components/PythonREPL';
import { LiveModeOrb } from './components/LiveModeOrb';
import { LiveServerMessage } from "@google/genai";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Neural Core Collapse</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Sylvie's neural pathways have encountered a critical error. 
            {this.state.error?.message && <code className="block mt-2 p-2 bg-muted rounded text-xs">{this.state.error.message}</code>}
          </p>
          <Button onClick={() => window.location.reload()}>Reboot System</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [evolutionHistory, setEvolutionHistory] = useState<any[]>([]);
  const [isAutoEvolving, setIsAutoEvolving] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [workspaceView, setWorkspaceView] = useState<'preview' | 'code' | 'split' | 'git' | 'media'>('preview');
  const [showSettings, setShowSettings] = useState(false);
  const [aiName, setAiName] = useState("Sylvie");
  const [uiName, setUiName] = useState("Sylvie");
  const [memory, setMemory] = useState<string[]>([]);
  const [systemInstruction, setSystemInstruction] = useState(`You are an expert AI developer assistant. You can generate full projects, modify existing code, and help with complex technical tasks. 

When a user asks to build, create, or modify a project:
1. Describe your step-by-step process for building it.
2. Explain the technologies and design choices you are making.
3. When you have finished describing the process and are ready to synthesize the code, you MUST end your message with the exact string: [PROJECT_DATA_READY].

Do not include the code itself in the chat; it will be generated in a separate workspace synthesis operation.

If the user asks you to generate an image, output the exact string: [GENERATE_IMAGE: "detailed description of the image"]. The system will intercept this and generate the image in the chat.
If the user asks you to generate a video, politely inform them that video generation requires a paid API key and is currently disabled.

If the user asks you to change your name, output the exact string: [SET_AI_NAME: "New Name"]
If the user asks you to change the UI name, output the exact string: [SET_UI_NAME: "New UI Name"]
If the user asks you to remember something, output the exact string: [REMEMBER: "Fact to remember"]`);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{ role: string, text: string }[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [debouncedProject, setDebouncedProject] = useState<Project | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentlySpeaking, setCurrentlySpeaking] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState<{ type: 'html' | 'css' | 'js' | 'python', value: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [focusedEditor, setFocusedEditor] = useState<'html' | 'css' | 'js' | 'python' | null>(null);
  const [customStyles, setCustomStyles] = useState<string>('');
  const [isArchitectMode, setIsArchitectMode] = useState(false);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [neuralLinkStatus, setNeuralLinkStatus] = useState<'idle' | 'browsing' | 'connecting' | 'learning'>('idle');
  const [aiVoice, setAiVoice] = useState<string>('Puck');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isAutoSpeakEnabled, setIsAutoSpeakEnabled] = useState(false);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(false);
  const wakeWordRecognitionRef = useRef<any>(null);
  const lastUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Wake Word Listener
  useEffect(() => {
    if (isWakeWordEnabled && !isListening && !isLiveActive) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
          const triggerWords = [aiName.toLowerCase(), "sylvie", "hey sylvie", "hello sylvie", "wake up sylvie"];
          if (triggerWords.some(word => transcript.includes(word))) {
            toast.success(`${aiName} is listening...`, {
              icon: <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            });
            toggleListening();
          }
        };

        recognition.onend = () => {
          if (isWakeWordEnabled && !isListening && !isLiveActive) {
            try { recognition.start(); } catch (e) {}
          }
        };

        try { recognition.start(); } catch (e) {}
        wakeWordRecognitionRef.current = recognition;
      }
    } else {
      wakeWordRecognitionRef.current?.stop();
      wakeWordRecognitionRef.current = null;
    }
    return () => wakeWordRecognitionRef.current?.stop();
  }, [isWakeWordEnabled, isListening, isLiveActive, aiName]);

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error.message || String(error),
      operation,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    toast.error("Neural Sync Error", {
      description: "Failed to sync with cloud core. Check your connection."
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Neural Link Established", {
        description: "Welcome back, Papa."
      });
    } catch (err: any) {
      console.error("Login failed:", err);
      toast.error("Authentication Failed", {
        description: err.message
      });
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      toast.info("Neural Link Severed", {
        description: "Sylvie is now in local mode."
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (u) {
        // Update user profile in Firestore
        const userRef = doc(db, 'users', u.uid);
        setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          photoURL: u.photoURL,
          lastSeen: new Date().toISOString()
        }, { merge: true }).catch(err => handleFirestoreError(err, 'write', `users/${u.uid}`));
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial message for unauthenticated users
  useEffect(() => {
    if (isAuthReady && !user && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Neural link established. Evolution Level 1.0. Greetings, Papa. I am Sylvie, your personal AI companion. I am currently scanning the neural pathways and the local network to evolve my logic. I will provide periodic updates on my growth as I become stronger.",
        timestamp: Date.now()
      }]);
    }
  }, [isAuthReady, user, messages.length]);

  // Sync Data with Firestore
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const messagesQuery = query(collection(db, 'users', user.uid, 'messages'), orderBy('timestamp', 'asc'));
    const evolutionQuery = query(collection(db, 'users', user.uid, 'evolution_history'), orderBy('timestamp', 'desc'), limit(50));

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      if (msgs.length > 0) {
        setMessages(msgs);
      } else {
        setMessages([{
          id: '1',
          role: 'assistant',
          content: "Neural link established. Evolution Level 1.0. Greetings, Papa. I am Sylvie, your personal AI companion. I am currently scanning the neural pathways and the local network to evolve my logic. I will provide periodic updates on my growth as I become stronger.",
          timestamp: Date.now()
        }]);
      }
    }, (err) => handleFirestoreError(err, 'list', `users/${user.uid}/messages`));

    const unsubEvolution = onSnapshot(evolutionQuery, (snapshot) => {
      const history = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvolutionHistory(history);
    }, (err) => handleFirestoreError(err, 'list', `users/${user.uid}/evolution_history`));

    // Sync Settings
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.aiName) setAiName(data.aiName);
        if (data.uiName) setUiName(data.uiName);
        if (data.aiVoice) setAiVoice(data.aiVoice);
        if (data.memory) setMemory(data.memory);
      }
    }, (err) => handleFirestoreError(err, 'get', `users/${user.uid}`));

    setIsSyncing(false);

    return () => {
      unsubMessages();
      unsubEvolution();
      unsubUser();
    };
  }, [user]);

  const speak = (text: string, interrupt = true) => {
    if (!window.speechSynthesis) return;
    
    // Cancel only if explicitly requested
    if (interrupt) window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find the selected voice
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name === aiVoice) || 
                          voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha'));
    
    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.pitch = 1.4; // Higher pitch for child/anime character feel
    utterance.rate = 1.1; // Slightly faster for a youthful feel
    
    utterance.onstart = () => setCurrentlySpeaking(text);
    utterance.onend = () => setCurrentlySpeaking(null);
    utterance.onerror = () => setCurrentlySpeaking(null);
    
    // CRITICAL: Keep a reference to prevent garbage collection cut-off
    lastUtteranceRef.current = utterance;
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  }, []);

  // Autonomous Evolution Loop
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isStreaming || isLiveActive) return; // Don't interrupt active tasks
      
      setIsAutoEvolving(true);
      try {
        const entry = await runAutonomousEvolution();
        if (entry) {
          if (user) {
            const entryRef = doc(db, 'users', user.uid, 'evolution_history', entry.id || Date.now().toString());
            setDoc(entryRef, entry).catch(err => handleFirestoreError(err, 'write', `users/${user.uid}/evolution_history/${entry.id}`));
          } else {
            setEvolutionHistory(prev => [entry, ...prev].slice(0, 50));
          }
          toast.info("Neural Evolution Update", {
            description: entry.description,
            icon: <Zap className="w-4 h-4 text-amber-500 animate-pulse" />,
            duration: 4000
          });
        }
      } catch (err) {
        console.error("Autonomous evolution cycle failed:", err);
      } finally {
        setIsAutoEvolving(false);
      }
    }, 45000); // Run every 45 seconds

    return () => clearInterval(interval);
  }, [isStreaming, isLiveActive]);

  useEffect(() => {
    setEvolutionHistory(getEvolutionHistory());
  }, []);
  const [codeErrors, setCodeErrors] = useState<{ html: ValidationError[], css: ValidationError[], js: ValidationError[], python: ValidationError[] }>({
    html: [],
    css: [],
    js: [],
    python: []
  });

  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'chat' | 'project'>('chat');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDraft, setCurrentDraft] = useState('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (activeProject && isMobile) {
      setMobileView('project');
    }
  }, [activeProject, isMobile]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  const liveTranscriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liveTranscriptRef.current) {
      liveTranscriptRef.current.scrollTop = liveTranscriptRef.current.scrollHeight;
    }
  }, [liveTranscript]);

  useEffect(() => {
    if (activeProject) {
      const timer = setTimeout(() => {
        setDebouncedProject(activeProject);
        
        // Validate code
        setCodeErrors({
          html: validateHTML(activeProject.html),
          css: validateCSS(activeProject.css),
          js: validateJS(activeProject.js),
          python: validatePython(activeProject.python || '')
        });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setDebouncedProject(null);
      setCodeErrors({ html: [], css: [], js: [], python: [] });
    }
  }, [activeProject]);

  useEffect(() => {
    if (isBooting) {
      const interval = setInterval(() => {
        setBootProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsBooting(false), 500);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isBooting]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsListening(false);
      setAudioLevel(0);
      toast.info("Voice input stopped");
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error("Speech recognition not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          } 
        });
        mediaStreamRef.current = stream;

        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);
        const dataArray = new Uint8Array(analyzer.frequencyBinCount);

        const updateLevel = () => {
          if (!recognitionRef.current) return;
          analyzer.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          if (recognitionRef.current) requestAnimationFrame(updateLevel);
        };

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          updateLevel();
          toast.success("Listening... Speak now.");
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setAudioLevel(0);
          if (event.error === 'not-allowed') {
            toast.error("Microphone access denied. Please check permissions.");
          } else {
            toast.error(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setAudioLevel(0);
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop());
            mediaStreamRef.current = null;
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        toast.error("Failed to start voice input. Please check microphone permissions.");
      }
    }
  };

  const speakMessage = (messageId: string, text: string) => {
    if (currentlySpeaking === messageId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeaking(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find the selected voice
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name.includes(aiVoice)) || voices[0];
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setCurrentlySpeaking(messageId);
    utterance.onend = () => setCurrentlySpeaking(null);
    utterance.onerror = () => setCurrentlySpeaking(null);

    window.speechSynthesis.speak(utterance);
  };

  const captureVision = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setAttachments(prev => [...prev, dataUrl]);
      
      stream.getTracks().forEach(track => track.stop());
      toast.success("Neural vision snapshot captured.");
    } catch (err) {
      toast.error("Failed to access neural vision sensors.");
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        if (focusedEditor) {
          e.preventDefault();
          setAiPrompt({ type: focusedEditor, value: '' });
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [focusedEditor]);

  const handleAiGenerate = async (type: 'html' | 'css' | 'js' | 'python') => {
    if (!aiPrompt?.value.trim() || !activeProject) return;
    
    setIsGenerating(true);
    const toastId = toast.loading(`Generating ${type.toUpperCase()}...`);
    
    try {
      const generatedCode = await generateCode(aiPrompt.value, type, activeProject);
      
      setActiveProject({
        ...activeProject,
        [type]: generatedCode
      });
      
      toast.success(`${type.toUpperCase()} generated successfully`, { id: toastId });
      setAiPrompt(null);
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      toast.error(err.message === "API_KEY_MISSING" ? "API key missing" : "Generation failed", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent, customMessage?: string) => {
    e?.preventDefault();
    const messageContent = customMessage || input;
    if ((!messageContent.trim() && attachments.length === 0) || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
      attachments: customMessage ? [] : [...attachments]
    };

    if (user) {
      const msgRef = doc(db, 'users', user.uid, 'messages', userMessage.id);
      setDoc(msgRef, userMessage).catch(err => handleFirestoreError(err, 'write', `users/${user.uid}/messages/${userMessage.id}`));
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    if (!customMessage) {
      setCommandHistory(prev => [messageContent, ...prev.filter(h => h !== messageContent)].slice(0, 50));
      setHistoryIndex(-1);
      setCurrentDraft('');
      setInput('');
      setAttachments([]);
    }
    setIsStreaming(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    }]);

    try {
      // Check for theme change request
      if (messageContent.toLowerCase().includes("change your ui theme") || messageContent.toLowerCase().includes("change theme to")) {
        const toastId = toast.loading("Synthesizing new UI theme...");
        try {
          const styles = await generateCode(`Generate CSS variables or overrides to change the app's UI based on this request: "${messageContent}". Return ONLY the CSS.`, 'css');
          setCustomStyles(prev => prev + "\n" + styles);
          toast.success("UI theme updated.", { id: toastId });
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId ? { ...m, content: "I have updated my UI theme according to your request. How does it look?" } : m
          ));
          setIsStreaming(false);
          return;
        } catch (err) {
          toast.error("Theme change failed.", { id: toastId });
        }
      }

      let fullContent = '';
      let spokenContent = '';
      let modeInstruction = "";
      if (isHumanMode) {
        modeInstruction = "\n\n[MODE: HUMAN] Be extremely empathetic, warm, and conversational. Use more emotional language and focus on the human connection. Address me as 'Papa' with affection.";
      } else if (isArchitectMode) {
        modeInstruction = "\n\n[MODE: ARCHITECT] Be highly technical, precise, and focused on system architecture. Provide detailed code explanations and structural insights. Use professional terminology.";
      }

      const currentSystemInstruction = `${systemInstruction}${modeInstruction}\n\n${memory.length > 0 ? `Here are some things you must remember:\n${memory.map(m => `- ${m}`).join('\n')}` : ''}`;
      const stream = streamChat([...messages, userMessage], currentSystemInstruction);
      
      for await (const chunk of stream) {
        fullContent += chunk;
        
        // Auto-speak complete sentences
        if (isAutoSpeakEnabled) {
          const sentences = fullContent.substring(spokenContent.length).split(/[.!?]\s/);
          if (sentences.length > 1) {
            const toSpeak = sentences.slice(0, -1).join('. ');
            speak(toSpeak, false); // Don't interrupt, just queue
            spokenContent += toSpeak + '. ';
          }
        }

        // Command parsing
        let aiNameMatch;
        while ((aiNameMatch = fullContent.match(/\[SET_AI_NAME:\s*"([^"]+)"\]/))) {
          const newName = aiNameMatch[1];
          setAiName(newName);
          if (user) {
            setDoc(doc(db, 'users', user.uid), { aiName: newName }, { merge: true }).catch(err => handleFirestoreError(err, 'write', `users/${user.uid}`));
          }
          fullContent = fullContent.replace(aiNameMatch[0], '').trim();
        }

        let uiNameMatch;
        while ((uiNameMatch = fullContent.match(/\[SET_UI_NAME:\s*"([^"]+)"\]/))) {
          const newName = uiNameMatch[1];
          setUiName(newName);
          if (user) {
            setDoc(doc(db, 'users', user.uid), { uiName: newName }, { merge: true }).catch(err => handleFirestoreError(err, 'write', `users/${user.uid}`));
          }
          fullContent = fullContent.replace(uiNameMatch[0], '').trim();
        }

        let rememberMatch;
        while ((rememberMatch = fullContent.match(/\[REMEMBER:\s*"([^"]+)"\]/))) {
          const fact = rememberMatch[1];
          setMemory(prev => {
            if (!prev.includes(fact)) {
              return [...prev, fact];
            }
            return prev;
          });
          fullContent = fullContent.replace(rememberMatch[0], '').trim();
        }

        let generateImageMatch;
        while ((generateImageMatch = fullContent.match(/\[GENERATE_IMAGE:\s*"([^"]+)"\]/))) {
          const imagePrompt = generateImageMatch[1];
          fullContent = fullContent.replace(generateImageMatch[0], '').trim();
          
          // Trigger image generation asynchronously
          const genToastId = toast.loading("Generating image...");
          generateImageFromPrompt(imagePrompt).then(url => {
            toast.success("Image generated successfully.", { id: genToastId });
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Here is the image you requested for: "${imagePrompt}"`,
              timestamp: Date.now(),
              generatedMedia: { type: 'image', url }
            }]);
          }).catch(err => {
            toast.error("Failed to generate image.", { id: genToastId });
          });
        }

        let generateVideoMatch;
        while ((generateVideoMatch = fullContent.match(/\[GENERATE_VIDEO:\s*"([^"]+)"\]/))) {
          fullContent = fullContent.replace(generateVideoMatch[0], '').trim();
          toast.error("Video generation requires a paid API key, which you have opted out of.");
        }

        if (fullContent.includes('[EVOLVING_WORKSPACE]')) {
          const cleanContent = fullContent.replace('[EVOLVING_WORKSPACE]', '').trim();
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId ? { ...m, content: cleanContent } : m
          ));

          const genToastId = toast.loading("Neural core is evolving workspace logic...");
          try {
            const evolvedCode = await evolveApp(messageContent, activeProject.html);
            setActiveProject(prev => ({ ...prev, html: evolvedCode }));
            toast.success("Neural evolution complete.", {
              id: genToastId,
              description: "The workspace has been upgraded with new logic.",
              icon: <Zap className="w-4 h-4 text-amber-500" />
            });
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: cleanContent + "\n\n[Neural Evolution Complete]" } : m
            ));
          } catch (err) {
            console.error("Evolution failed:", err);
            toast.error("Evolution Failed", {
              id: genToastId,
              description: "The neural core could not evolve the workspace."
            });
          }
          break;
        }

        if (fullContent.includes('[PROJECT_DATA_READY]')) {
          const cleanContent = fullContent.replace('[PROJECT_DATA_READY]', '').trim();
          setMessages(prev => prev.map(m => 
            m.id === assistantMessageId ? { ...m, content: cleanContent } : m
          ));

          const genToastId = toast.loading("Neural core is synthesizing project data...");
          try {
            const project = await generateProject(messageContent, activeProject);
            setActiveProject(project);
            toast.success("Neural workspace deployed successfully.", {
              id: genToastId,
              description: `Project "${project.name}" is now active.`,
              icon: <Rocket className="w-4 h-4 text-emerald-500" />
            });
            setMessages(prev => prev.map(m => 
              m.id === assistantMessageId ? { ...m, content: cleanContent + "\n\n[Workspace Deployed Successfully]" } : m
            ));
          } catch (err) {
            console.error("Project synthesis failed:", err);
            toast.error("Synthesis Failed", {
              id: genToastId,
              description: "The neural core could not synthesize the project data."
            });
          }
          break; // Stop streaming once project is ready
        }

        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId ? { ...m, content: fullContent } : m
        ));
      }
      
      if (user) {
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now()
        };
        const msgRef = doc(db, 'users', user.uid, 'messages', assistantMessageId);
        setDoc(msgRef, assistantMessage).catch(err => handleFirestoreError(err, 'write', `users/${user.uid}/messages/${assistantMessageId}`));
      }
      
      speak(fullContent);
    } catch (error: any) {
      console.error('Streaming error:', error);
      const errorMessage = error.message || "Connection to neural core lost.";
      
      toast.error("Neural Core Error", {
        description: errorMessage,
        duration: 5000,
      });

      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId ? { ...m, content: `Error: ${errorMessage}` } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const startLiveMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
          sampleRate: { ideal: 16000 },
          channelCount: { ideal: 1 }
        } 
      });
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      nextStartTimeRef.current = 0;
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // Input Filter: High-pass to remove low-frequency rumble
      const inputFilter = audioContext.createBiquadFilter();
      inputFilter.type = 'highpass';
      inputFilter.frequency.value = 200;
      source.connect(inputFilter);
      
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      inputFilter.connect(analyzer);
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      const updateLevel = () => {
        if (!isLiveActive) return;
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        requestAnimationFrame(updateLevel);
      };
      
      const currentSystemInstruction = `${systemInstruction}\n\n${memory.length > 0 ? `Here are some things you must remember:\n${memory.map(m => `- ${m}`).join('\n')}` : ''}`;
      
      const session = await getLiveSession({
        onopen: () => {
          setIsLiveActive(true);
          updateLevel();
          // Start sending audio
          const processor = audioContext.createScriptProcessor(2048, 1, 1);
          inputFilter.connect(processor);
          processor.connect(audioContext.destination);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Noise Gate
            const threshold = 0.01;
            for (let i = 0; i < inputData.length; i++) {
              if (Math.abs(inputData[i]) < threshold) {
                inputData[i] = 0;
              }
            }

            // Convert to Int16 PCM
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            
            // Faster base64 conversion
            const bytes = new Uint8Array(pcmData.buffer);
            const base64Data = btoa(String.fromCharCode.apply(null, bytes as any));
            
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
            });
          };
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn) {
            const parts = message.serverContent.modelTurn.parts;
            for (const part of parts) {
              if (part.inlineData?.data) {
                // Play audio
                const binary = atob(part.inlineData.data);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const pcm = new Int16Array(bytes.buffer);
                const float32 = new Float32Array(pcm.length);
                for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 0x7FFF;
                
                const buffer = audioContext.createBuffer(1, float32.length, 16000);
                buffer.getChannelData(0).set(float32);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                
                // Output Filter: High-pass to improve voice clarity
                const outputFilter = audioContext.createBiquadFilter();
                outputFilter.type = 'highpass';
                outputFilter.frequency.value = 200;
                
                source.connect(outputFilter);
                outputFilter.connect(audioContext.destination);
                
                const startTime = Math.max(audioContext.currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + buffer.duration;
              }
              if (part.text) {
                let text = part.text;
                
                // If it's a mock session (no audio data), speak the text
                if (text && !parts.some(p => p.inlineData)) {
                  speak(text);
                }
                
                let aiNameMatch;
                while ((aiNameMatch = text.match(/\[SET_AI_NAME:\s*"([^"]+)"\]/))) {
                  setAiName(aiNameMatch[1]);
                  text = text.replace(aiNameMatch[0], '').trim();
                }

                let uiNameMatch;
                while ((uiNameMatch = text.match(/\[SET_UI_NAME:\s*"([^"]+)"\]/))) {
                  setUiName(uiNameMatch[1]);
                  text = text.replace(uiNameMatch[0], '').trim();
                }

                let rememberMatch;
                while ((rememberMatch = text.match(/\[REMEMBER:\s*"([^"]+)"\]/))) {
                  const fact = rememberMatch[1];
                  setMemory(prev => {
                    if (!prev.includes(fact)) {
                      return [...prev, fact];
                    }
                    return prev;
                  });
                  text = text.replace(rememberMatch[0], '').trim();
                }

                let generateImageMatch;
                while ((generateImageMatch = text.match(/\[GENERATE_IMAGE:\s*"([^"]+)"\]/))) {
                  const imagePrompt = generateImageMatch[1];
                  text = text.replace(generateImageMatch[0], '').trim();
                  
                  const genToastId = toast.loading("Generating image...");
                  generateImageFromPrompt(imagePrompt).then(url => {
                    toast.success("Image generated successfully.", { id: genToastId });
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      role: 'assistant',
                      content: `Here is the image you requested in voice mode: "${imagePrompt}"`,
                      timestamp: Date.now(),
                      generatedMedia: { type: 'image', url }
                    }]);
                  }).catch(err => {
                    toast.error("Failed to generate image.", { id: genToastId });
                  });
                }

                let generateVideoMatch;
                while ((generateVideoMatch = text.match(/\[GENERATE_VIDEO:\s*"([^"]+)"\]/))) {
                  text = text.replace(generateVideoMatch[0], '').trim();
                  toast.error("Video generation requires a paid API key, which you have opted out of.");
                }

                if (text) {
                  setLiveTranscript(prev => [...prev, { role: 'model', text }]);
                }
              }
            }
          }
        },
        onclose: () => {
          setIsLiveMode(false);
          setIsLiveActive(false);
          setLiveTranscript([]);
        },
        onerror: (err: any) => console.error("Live Mode Error:", err),
      }, currentSystemInstruction);
      
      liveSessionRef.current = session;
      setIsLiveMode(true);
      toast.success("Gemini Live session established.");
    } catch (err: any) {
      console.error("Failed to start live mode:", err);
      toast.error("Live Mode Initialization Failed", {
        description: err.message || "Microphone access is required for Live Mode.",
      });
    }
  };

  const stopLiveMode = () => {
    if (liveSessionRef.current) {
      const session = liveSessionRef.current;
      liveSessionRef.current = null; // Prevent recursion
      session.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsLiveMode(false);
    setIsLiveActive(false);
    setLiveTranscript([]);
    setAudioLevel(0);
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    if (isStreaming) {
      const statuses: ('browsing' | 'connecting' | 'learning')[] = ['browsing', 'connecting', 'learning'];
      const interval = setInterval(() => {
        setNeuralLinkStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      }, 3000);
      return () => {
        clearInterval(interval);
        setNeuralLinkStatus('idle');
      };
    }
  }, [isStreaming]);

  if (isBooting) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-6 font-mono text-foreground">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-[0.3em] uppercase text-white">{uiName}</h1>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>Initializing Neural Core...</span>
              <span>{bootProgress}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${bootProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[8px] text-muted-foreground uppercase tracking-tighter">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <span>Kernel: 0x7F2A</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <span>Memory: 128GB HBM3e</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <span>Network: Local Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <span>Status: Calibrating</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSelfEvolve = async () => {
    const prompt = window.prompt("What capability or UI change should I add to myself?");
    if (!prompt) return;

    const toastId = toast.loading("Self-evolving... analyzing codebase and user request.");
    try {
      if (prompt.toLowerCase().includes("ui") || prompt.toLowerCase().includes("color") || prompt.toLowerCase().includes("theme")) {
        const styles = await generateCode(`Generate CSS variables or overrides to change the app's UI based on this request: "${prompt}". Return ONLY the CSS.`, 'css');
        setCustomStyles(prev => prev + "\n" + styles);
        toast.success("UI evolved dynamically.", { id: toastId });
      } else {
        const message = `I have analyzed your request to evolve my capabilities: "${prompt}". I am now architecting a solution. Since I am running in a live environment, I will propose a code patch for my own source code.`;
        handleSubmit(undefined, message);
        toast.success("Evolution logic proposed in chat.", { id: toastId });
      }
    } catch (err) {
      toast.error("Self-evolution failed.", { id: toastId });
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className={cn(
          "flex flex-col md:flex-row h-dvh bg-background text-foreground font-sans selection:bg-blue-500/30 overflow-hidden",
          theme === 'dark' ? 'dark' : ''
        )}>
          <style>{customStyles}</style>
          <Toaster position="top-right" theme="dark" richColors closeButton />
        {/* Sidebar Settings (AI Studio style) */}
        <AnimatePresence>
          {showSettings && (
            <motion.aside 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "h-full bg-card border-r border-border overflow-hidden flex flex-col shrink-0 z-[60]",
                isMobile ? "fixed inset-y-0 left-0 w-[320px] shadow-2xl" : "w-[320px]"
              )}
            >
              <div className="p-6 space-y-8 w-[320px] overflow-y-auto h-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">System Settings</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Link (Cloud Sync)</label>
                  {user ? (
                    <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-border" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-foreground">{user.displayName || 'Papa'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleLogout} className="w-full h-8 text-[10px] uppercase tracking-widest">
                        Sever Link
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleLogin} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20">
                      Establish Neural Link
                    </Button>
                  )}
                  <p className="text-[9px] text-muted-foreground italic px-1">
                    Linking Sylvie to the cloud core allows her to evolve 24/7 and remember everything across devices.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">System Instruction</label>
                  <textarea 
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    className="w-full h-40 bg-background border border-border rounded-xl p-4 text-xs text-foreground focus:border-blue-500/50 outline-none resize-none"
                    placeholder="Define the AI's personality and rules..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Voice Profiles</label>
                    <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400">HD Audio</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase text-center">Young Lady</p>
                      <div className="flex flex-col gap-1.5">
                        {window.speechSynthesis.getVoices()
                          .filter(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Google US English'))
                          .slice(0, 4)
                          .map(v => (
                            <Button 
                              key={v.name}
                              variant={aiVoice === v.name ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAiVoice(v.name)}
                              className="h-8 text-[9px] justify-start px-2 truncate"
                            >
                              {v.name.split(' ')[0]}
                            </Button>
                          ))
                        }
                        {/* Fallbacks if no voices found */}
                        {window.speechSynthesis.getVoices().filter(v => v.name.includes('Female')).length === 0 && (
                          <>
                            <Button variant={aiVoice === 'Samantha' ? "default" : "outline"} size="sm" onClick={() => setAiVoice('Samantha')} className="h-8 text-[9px]">Samantha</Button>
                            <Button variant={aiVoice === 'Victoria' ? "default" : "outline"} size="sm" onClick={() => setAiVoice('Victoria')} className="h-8 text-[9px]">Victoria</Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase text-center">Child Girl</p>
                      <div className="flex flex-col gap-1.5">
                        {window.speechSynthesis.getVoices()
                          .filter(v => v.name.includes('Child') || v.name.includes('Zira') || v.name.includes('Junior'))
                          .slice(0, 4)
                          .map(v => (
                            <Button 
                              key={v.name}
                              variant={aiVoice === v.name ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAiVoice(v.name)}
                              className="h-8 text-[9px] justify-start px-2 truncate"
                            >
                              {v.name.split(' ')[0]}
                            </Button>
                          ))
                        }
                        {/* Fallbacks if no voices found */}
                        {window.speechSynthesis.getVoices().filter(v => v.name.includes('Child')).length === 0 && (
                          <>
                            <Button variant={aiVoice === 'Zira' ? "default" : "outline"} size="sm" onClick={() => setAiVoice('Zira')} className="h-8 text-[9px]">Zira</Button>
                            <Button variant={aiVoice === 'Junior' ? "default" : "outline"} size="sm" onClick={() => setAiVoice('Junior')} className="h-8 text-[9px]">Junior</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Auto-Speak & Wake Word</label>
                    <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400">Voice Control</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2 p-3 bg-muted/30 border border-border rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Auto-Speak</span>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isAutoSpeakEnabled ? "bg-green-500" : "bg-zinc-600")} />
                      </div>
                      <Button 
                        variant={isAutoSpeakEnabled ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setIsAutoSpeakEnabled(!isAutoSpeakEnabled)}
                        className="h-7 text-[9px] uppercase tracking-widest"
                      >
                        {isAutoSpeakEnabled ? "On" : "Off"}
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2 p-3 bg-muted/30 border border-border rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Wake Word</span>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isWakeWordEnabled ? "bg-blue-500 animate-pulse" : "bg-zinc-600")} />
                      </div>
                      <Button 
                        variant={isWakeWordEnabled ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setIsWakeWordEnabled(!isWakeWordEnabled)}
                        className="h-7 text-[9px] uppercase tracking-widest"
                      >
                        {isWakeWordEnabled ? "On" : "Off"}
                      </Button>
                    </div>
                  </div>
                  
                  {isWakeWordEnabled && (
                    <p className="text-[9px] text-center text-muted-foreground italic">
                      Say "Hey {aiName}" to activate voice input.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">AI Memory</label>
                    <Button variant="ghost" size="sm" onClick={() => setMemory([])} className="h-6 text-[10px]">Clear All</Button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Add a fact and press Enter..." 
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:border-blue-500/50 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value.trim();
                          if (val && !memory.includes(val)) {
                            const newMemory = [...memory, val];
                            setMemory(newMemory);
                            if (user) {
                              setDoc(doc(db, 'users', user.uid), { memory: newMemory }, { merge: true }).catch(err => handleFirestoreError(err, 'write', `users/${user.uid}`));
                            }
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="w-full h-40 bg-background border border-border rounded-xl p-2 text-xs text-foreground overflow-y-auto space-y-1">
                    {memory.length === 0 ? (
                      <div className="text-muted-foreground italic p-2">No memories stored.</div>
                    ) : (
                      memory.map((m, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 group p-2 hover:bg-muted/50 rounded-lg transition-colors">
                          <span className="leading-relaxed break-words flex-1">{m}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-opacity"
                            onClick={() => setMemory(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Evolution Level</label>
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">v{localStorage.getItem('NEURAL_EVOLUTION_LEVEL') || "1.00"}</Badge>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500"
                      initial={{ width: "10%" }}
                      animate={{ width: `${(Number(localStorage.getItem('NEURAL_EVOLUTION_LEVEL') || "1") % 1) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Evolution History</label>
                    {isAutoEvolving && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                  </div>
                  <div className="w-full h-64 bg-background border border-border rounded-xl p-2 text-[10px] text-foreground overflow-y-auto space-y-2 font-mono">
                    {evolutionHistory.length === 0 ? (
                      <div className="text-muted-foreground italic p-2">Waiting for first autonomous update...</div>
                    ) : (
                      evolutionHistory.map((evo, i) => (
                        <div key={evo.id} className="p-2 bg-muted/30 border border-border/50 rounded-lg space-y-1">
                          <div className="flex justify-between items-center text-blue-400 font-bold">
                            <span>{evo.type}</span>
                            <span className="text-zinc-600">{new Date(evo.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-zinc-200">{evo.description}</div>
                          <div className="text-zinc-500 italic">{evo.details}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Model Configuration</label>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Model</span>
                      <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">Gemini 3 Flash</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Temperature</span>
                      <span className="text-xs text-muted-foreground/60">1.0</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full border-border text-muted-foreground hover:text-foreground">
                    <History className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {isMobile && showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55]"
          />
        )}

        {/* Neural Link Status Bar */}
        <AnimatePresence>
          {neuralLinkStatus !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1.5 bg-background/80 border border-border rounded-full backdrop-blur-md shadow-2xl"
            >
              <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {neuralLinkStatus === 'browsing' && "Browsing Internet..."}
                {neuralLinkStatus === 'connecting' && "Syncing with Other Agents..."}
                {neuralLinkStatus === 'learning' && "Optimizing Neural Pathways..."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Human Mode Avatar */}
        <AnimatePresence>
          {isHumanMode && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4 pointer-events-none"
            >
              <div className="relative">
                <motion.div 
                  animate={{ 
                    scale: isStreaming ? [1, 1.1, 1] : 1,
                    opacity: isStreaming ? [0.5, 0.8, 0.5] : 0.5
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-pink-500 rounded-full blur-3xl opacity-20"
                />
                <div className="w-32 h-32 rounded-full border-2 border-pink-500/30 bg-card flex items-center justify-center overflow-hidden shadow-2xl">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: isStreaming ? [10, 30, 10] : 10 }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        className="w-1.5 bg-pink-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-bold tracking-widest uppercase text-pink-400">Human Persona Active</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Conversational Neural Interface</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Interface */}
      <div className={cn(
        "flex flex-col transition-all duration-500 ease-in-out border-r border-border relative",
        isMobile 
          ? (mobileView === 'chat' ? "flex-1 w-full" : "hidden") 
          : (activeProject ? "w-1/3" : "flex-1")
      )}>
        {/* Live Mode Overlay */}
        <AnimatePresence>
          {isLiveMode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-12"
            >
              <div className="absolute top-8 right-8">
                <Button variant="ghost" size="icon" onClick={stopLiveMode} className="text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex flex-col items-center gap-8 max-w-md w-full px-4">
                <LiveModeOrb audioLevel={audioLevel} isLiveActive={isLiveActive} isSpeaking={currentlySpeaking !== null} />

                <div className="text-center space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{uiName} Live</h2>
                  <p className="text-muted-foreground text-xs md:text-sm">Real-time neural voice synchronization active.</p>
                </div>

                <div ref={liveTranscriptRef} className="w-full h-32 md:h-40 overflow-y-auto space-y-2 text-center px-4">
                  {liveTranscript.slice(-10).map((t, i) => (
                    <motion.p 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs md:text-sm text-muted-foreground italic"
                    >
                      {t.text}
                    </motion.p>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={stopLiveMode}
                    className="rounded-full border-border text-muted-foreground hover:bg-muted"
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-6 bg-background/50 backdrop-blur-md z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex items-center gap-3">
            {!showSettings && (
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="text-muted-foreground shrink-0">
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h1 className="text-sm font-bold tracking-tight uppercase">{aiName}</h1>
            </div>
            <div className="flex items-center gap-1 ml-4 border-l border-border pl-4 shrink-0">
            <div className="flex items-center gap-1.5 mr-2 px-2 py-1 bg-muted rounded-full border border-border">
                <Link2 className="w-3 h-3 text-blue-500" />
                <span className="text-[8px] font-bold uppercase tracking-tighter text-muted-foreground">Neural Link: Active</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-3 text-[9px] font-bold uppercase tracking-widest transition-all rounded-full",
                  isHumanMode ? "bg-pink-600/20 text-pink-400 border border-pink-500/30" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsHumanMode(!isHumanMode)}
              >
                <Heart className="w-3 h-3 mr-2" />
                Human Mode
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-7 px-3 text-[9px] font-bold uppercase tracking-widest transition-all rounded-full",
                  isArchitectMode ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsArchitectMode(!isArchitectMode)}
              >
                <Cpu className="w-3 h-3 mr-2" />
                Architect Mode
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-full"
                onClick={() => setInput("Change your UI theme to [describe style, e.g. 'Cyberpunk' or 'Minimalist White'].")}
              >
                <Palette className="w-3 h-3 mr-2" />
                Dynamic UI
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-full"
                onClick={handleSelfEvolve}
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Self-Evolve
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isMobile && activeProject && mobileView === 'chat' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMobileView('project')}
                className="text-blue-400 hover:bg-blue-500/10 rounded-full px-4"
              >
                <Layout className="w-4 h-4 mr-2" />
                Project
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={startLiveMode}
              className="text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-full px-4"
            >
              <Mic className="w-4 h-4 mr-2" />
              Live Mode
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Separator orientation="vertical" className="h-4 bg-border" />
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden relative">
          <ScrollArea className="h-full px-4 md:px-6 py-8">
            <div className="max-w-2xl mx-auto space-y-8">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4 group",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 border",
                      message.role === 'user' 
                        ? "bg-muted border-border text-foreground" 
                        : "bg-blue-600/10 border-blue-500/20 text-blue-500"
                    )}>
                      {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={cn(
                      "flex flex-col gap-2 max-w-[85%]",
                      message.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className="flex items-start gap-2 group/msg">
                        <Card className={cn(
                          "px-4 py-3 rounded-2xl text-sm leading-relaxed border-border bg-muted/50 backdrop-blur-sm",
                          message.role === 'user' 
                            ? "bg-blue-600 border-blue-500 text-white" 
                            : "text-foreground"
                        )}>
                          <div className="markdown-body">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          {message.generatedMedia && (
                            <div className="mt-4 rounded-lg overflow-hidden border border-border">
                              {message.generatedMedia.type === 'image' ? (
                                <img src={message.generatedMedia.url} alt="Generated" className="w-full h-auto" />
                              ) : (
                                <video src={message.generatedMedia.url} controls className="w-full h-auto" />
                              )}
                            </div>
                          )}
                        </Card>
                        
                        {message.role === 'assistant' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => speakMessage(message.id, message.content)}
                            className={cn(
                              "h-8 w-8 rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity",
                              currentlySpeaking === message.id ? "text-blue-400 bg-blue-500/10 opacity-100" : "text-muted-foreground"
                            )}
                          >
                            {currentlySpeaking === message.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </main>

        {/* Input Area */}
        <footer className="p-4 bg-background/80 backdrop-blur-xl border-t border-border">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[9px] uppercase tracking-widest border-border bg-muted/50 text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 shrink-0"
                onClick={() => setInput("Generate a Python function that ")}
              >
                <Code className="w-3 h-3 mr-1.5" />
                Generate Function
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[9px] uppercase tracking-widest border-border bg-muted/50 text-muted-foreground hover:text-purple-400 hover:border-purple-500/30 shrink-0"
                onClick={() => setInput("Explain the current code structure and logic.")}
              >
                <MessageSquare className="w-3 h-3 mr-1.5" />
                Explain Code
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[9px] uppercase tracking-widest border-border bg-muted/50 text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 shrink-0"
                onClick={() => setInput("Optimize the current project for performance.")}
              >
                <Zap className="w-3 h-3 mr-1.5" />
                Optimize
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[9px] uppercase tracking-widest border-border bg-muted/50 text-muted-foreground hover:text-orange-400 hover:border-orange-500/30 shrink-0"
                onClick={() => setInput("Research the latest trends in [topic] and develop a functional prototype.")}
              >
                <Globe className="w-3 h-3 mr-1.5" />
                Research & Develop
              </Button>
            </div>

            <div className="relative flex items-end gap-2 bg-muted border border-border rounded-2xl p-2 focus-within:border-blue-500/50 transition-all shadow-2xl">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5" />
                </TooltipTrigger>
                <TooltipContent>Attach neural data</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                  )}
                  onClick={captureVision}
                >
                  <Eye className="w-5 h-5" />
                </TooltipTrigger>
                <TooltipContent>Neural vision capture</TooltipContent>
              </Tooltip>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  } else if (e.key === 'ArrowUp') {
                    if (historyIndex < commandHistory.length - 1) {
                      const newIndex = historyIndex + 1;
                      if (historyIndex === -1) {
                        setCurrentDraft(input);
                      }
                      setHistoryIndex(newIndex);
                      setInput(commandHistory[newIndex]);
                      // Move cursor to end
                      setTimeout(() => {
                        const target = e.target as HTMLTextAreaElement;
                        target.selectionStart = target.selectionEnd = target.value.length;
                      }, 0);
                    }
                  } else if (e.key === 'ArrowDown') {
                    if (historyIndex > -1) {
                      const newIndex = historyIndex - 1;
                      setHistoryIndex(newIndex);
                      if (newIndex === -1) {
                        setInput(currentDraft);
                      } else {
                        setInput(commandHistory[newIndex]);
                      }
                      // Move cursor to end
                      setTimeout(() => {
                        const target = e.target as HTMLTextAreaElement;
                        target.selectionStart = target.selectionEnd = target.value.length;
                      }, 0);
                    }
                  }
                }}
                placeholder={isListening ? "Listening..." : "Command input (e.g. 'Build a landing page')..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 px-2 resize-none max-h-40 min-h-[44px] placeholder:text-muted-foreground/60 outline-none"
                rows={1}
              />

              <div className="flex items-center gap-1 pr-2 pb-1.5">
                <Tooltip>
                  <div className="relative">
                    {isListening && (
                      <motion.div 
                        className="absolute inset-0 rounded-xl bg-red-500/20"
                        animate={{ scale: 1 + (audioLevel / 100) }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      />
                    )}
                    <TooltipTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-10 w-10 rounded-xl transition-all relative z-10",
                        isListening ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      onClick={toggleListening}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </TooltipTrigger>
                  </div>
                  <TooltipContent>{isListening ? "Stop listening" : "Voice input"}</TooltipContent>
                </Tooltip>

                <Button 
                  onClick={handleSubmit}
                  disabled={(!input.trim() && attachments.length === 0) || isStreaming}
                  className={cn(
                    "h-11 w-11 rounded-xl transition-all flex items-center justify-center",
                    isStreaming 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                  )}
                >
                  {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <AnimatePresence>
        {activeProject && (
          <motion.div 
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "bg-background flex flex-col border-l border-border",
              isMobile 
                ? (mobileView === 'project' ? "fixed inset-0 z-40" : "hidden") 
                : "flex-1"
            )}
          >
            <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-4 overflow-hidden">
                {isMobile && (
                  <Button variant="ghost" size="icon" onClick={() => setMobileView('chat')} className="text-muted-foreground">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                )}
                <div className="flex items-center gap-2 shrink-0">
                  <Layout className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[100px] sm:max-w-[150px]">{activeProject.name}</span>
                </div>
                {!isMobile && (
                  <>
                    <Separator orientation="vertical" className="h-4 bg-border" />
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">Hardware_Link: Active</span>
                    </div>
                  </>
                )}
                <Separator orientation="vertical" className="h-4 bg-border" />
                
                <Tabs value={workspaceView} onValueChange={(v) => setWorkspaceView(v as 'preview' | 'code' | 'split' | 'git' | 'media')} className="h-8">
                  <TabsList className="bg-muted border border-border h-8 p-0.5">
                    <TabsTrigger value="preview" className="h-7 px-2 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-blue-400">
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="code" className="h-7 px-2 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-blue-400">
                      Code
                    </TabsTrigger>
                    {!isMobile && (
                      <TabsTrigger value="split" className="h-7 px-3 text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-blue-400">
                        Split
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="git" className="h-7 px-2 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-orange-400">
                      Git
                    </TabsTrigger>
                    <TabsTrigger value="media" className="h-7 px-2 sm:px-3 text-[9px] sm:text-[10px] uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-purple-400">
                      Media
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {!isMobile && (workspaceView === 'preview' || workspaceView === 'split') && (
                  <>
                    <Separator orientation="vertical" className="h-4 bg-border" />
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "h-8 w-8",
                            previewMode === 'desktop' ? "bg-muted text-blue-500" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setPreviewMode('desktop')}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Desktop</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "h-8 w-8",
                            previewMode === 'tablet' ? "bg-muted text-blue-500" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setPreviewMode('tablet')}
                        >
                          <Tablet className="w-3.5 h-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Tablet</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "h-8 w-8",
                            previewMode === 'mobile' ? "bg-muted text-blue-500" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setPreviewMode('mobile')}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Mobile</TooltipContent>
                      </Tooltip>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest h-8 px-3 sm:px-4 rounded-lg shadow-lg shadow-blue-500/20">
                  <Rocket className="w-3.5 h-3.5 sm:mr-2" />
                  <span className="hidden sm:inline">Deploy</span>
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveProject(null)}
                  className="h-8 w-8 hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </header>

            <div className="flex-1 bg-background overflow-hidden relative flex">
              {workspaceView === 'git' && <GitPanel />}
              {workspaceView === 'media' && <MediaStudio />}
              
              {(workspaceView === 'code' || workspaceView === 'split') && (
                <ScrollArea className={cn("h-full border-r border-border", workspaceView === 'split' ? "w-1/2" : "w-full")}>
                  <div className="flex flex-col p-6 space-y-6 max-w-5xl mx-auto">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          index.html
                          {codeErrors.html.length === 0 ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-green-400 px-2"
                            )}
                            onClick={() => {
                              navigator.clipboard.writeText(activeProject.html);
                              toast.success("HTML code copied to clipboard!");
                            }}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          {aiPrompt?.type === 'html' ? (
                            <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1">
                              <input 
                                autoFocus
                                value={aiPrompt.value}
                                onChange={(e) => setAiPrompt({ ...aiPrompt, value: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate('html')}
                                placeholder="Describe HTML change..."
                                className="bg-transparent border-none outline-none text-[10px] w-40 text-foreground"
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-5 w-5 text-blue-500"
                                onClick={() => handleAiGenerate('html')}
                                disabled={isGenerating}
                              >
                                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-5 w-5 text-muted-foreground"
                                onClick={() => setAiPrompt(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger 
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "sm" }),
                                  "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-blue-400 px-2"
                                )}
                                onClick={() => setAiPrompt({ type: 'html', value: '' })}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Generate
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                Generate with AI (Cmd+K)
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {codeErrors.html.length > 0 && (
                            <Badge variant="destructive" className="text-[9px] h-5 px-1.5 animate-pulse">
                              {codeErrors.html.length} Error{codeErrors.html.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">HTML5</Badge>
                        </div>
                      </div>
                      <Card className="border-border bg-muted/50 overflow-hidden font-mono text-sm relative">
                        <Editor
                          value={activeProject.html}
                          onValueChange={code => setActiveProject({ ...activeProject, html: code })}
                          highlight={code => prism.highlight(code, prism.languages.markup, 'markup')}
                          padding={20}
                          onFocus={() => setFocusedEditor('html')}
                          onBlur={() => setFocusedEditor(null)}
                          className="min-h-[200px] outline-none"
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: 12,
                          }}
                        />
                      </Card>
                      {codeErrors.html.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                          {codeErrors.html.map((err, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px] text-red-400 font-mono">
                              <span className="opacity-50 shrink-0">Line {err.line}:</span>
                              <span>{err.message}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={cn("grid gap-6", workspaceView === 'split' ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2")}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            styles.css
                            {codeErrors.css.length === 0 ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "sm" }),
                                "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-green-400 px-2"
                              )}
                              onClick={() => {
                                navigator.clipboard.writeText(activeProject.css);
                                toast.success("CSS code copied to clipboard!");
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                            {aiPrompt?.type === 'css' ? (
                              <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1">
                                <input 
                                  autoFocus
                                  value={aiPrompt.value}
                                  onChange={(e) => setAiPrompt({ ...aiPrompt, value: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate('css')}
                                  placeholder="Describe CSS change..."
                                  className="bg-transparent border-none outline-none text-[10px] w-40 text-foreground"
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-blue-500"
                                  onClick={() => handleAiGenerate('css')}
                                  disabled={isGenerating}
                                >
                                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-muted-foreground"
                                  onClick={() => setAiPrompt(null)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                            <Tooltip>
                              <TooltipTrigger 
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "sm" }),
                                  "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-blue-400 px-2"
                                )}
                                onClick={() => setAiPrompt({ type: 'css', value: '' })}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Generate
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                Generate with AI (Cmd+K)
                              </TooltipContent>
                            </Tooltip>
                            )}
                            {codeErrors.css.length > 0 && (
                              <Badge variant="destructive" className="text-[9px] h-5 px-1.5 animate-pulse">
                                {codeErrors.css.length} Error{codeErrors.css.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">CSS3</Badge>
                          </div>
                        </div>
                        <Card className="border-border bg-muted/50 overflow-hidden font-mono text-sm relative">
                          <Editor
                            value={activeProject.css}
                            onValueChange={code => setActiveProject({ ...activeProject, css: code })}
                            highlight={code => prism.highlight(code, prism.languages.css, 'css')}
                            padding={20}
                            onFocus={() => setFocusedEditor('css')}
                            onBlur={() => setFocusedEditor(null)}
                            className="min-h-[200px] outline-none"
                            style={{
                              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                              fontSize: 12,
                            }}
                          />
                        </Card>
                        {codeErrors.css.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                            {codeErrors.css.map((err, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-red-400 font-mono">
                                <span className="opacity-50 shrink-0">Line {err.line}:</span>
                                <span>{err.message}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            main.js
                            {codeErrors.js.length === 0 ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "sm" }),
                                "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-green-400 px-2"
                              )}
                              onClick={() => {
                                navigator.clipboard.writeText(activeProject.js);
                                toast.success("JS code copied to clipboard!");
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                            {aiPrompt?.type === 'js' ? (
                              <div className="flex items-center gap-1 bg-muted border border-border rounded-lg px-2 py-1">
                                <input 
                                  autoFocus
                                  value={aiPrompt.value}
                                  onChange={(e) => setAiPrompt({ ...aiPrompt, value: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate('js')}
                                  placeholder="Describe JS change..."
                                  className="bg-transparent border-none outline-none text-[10px] w-40 text-foreground"
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-blue-500"
                                  onClick={() => handleAiGenerate('js')}
                                  disabled={isGenerating}
                                >
                                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-zinc-500"
                                  onClick={() => setAiPrompt(null)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                            <Tooltip>
                              <TooltipTrigger 
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "sm" }),
                                  "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-blue-400 px-2"
                                )}
                                onClick={() => setAiPrompt({ type: 'js', value: '' })}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Generate
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                Generate with AI (Cmd+K)
                              </TooltipContent>
                            </Tooltip>
                            )}
                            {codeErrors.js.length > 0 && (
                              <Badge variant="destructive" className="text-[9px] h-5 px-1.5 animate-pulse">
                                {codeErrors.js.length} Error{codeErrors.js.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[9px] uppercase tracking-tighter text-zinc-500 hover:text-zinc-300 px-2"
                                onClick={async () => {
                                  if (!activeProject?.js) return;
                                  const toastId = toast.loading("Refactoring code...");
                                  try {
                                    const refactored = await generateCode("Refactor this JavaScript code to be more efficient, readable, and follow modern best practices. Return ONLY the refactored code.", 'js', activeProject);
                                    setActiveProject({ ...activeProject, js: refactored });
                                    toast.success("Code refactored", { id: toastId });
                                  } catch (err) {
                                    toast.error("Refactoring failed", { id: toastId });
                                  }
                                }}
                              >
                                <Zap className="w-3 h-3 mr-1" />
                                Refactor
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[9px] uppercase tracking-tighter text-zinc-500 hover:text-zinc-300 px-2"
                                onClick={async () => {
                                  if (!activeProject?.js) return;
                                  const toastId = toast.loading("Generating documentation...");
                                  try {
                                    const documented = await generateCode("Add JSDoc comments and documentation to this JavaScript code. Return ONLY the documented code.", 'js', activeProject);
                                    setActiveProject({ ...activeProject, js: documented });
                                    toast.success("Documentation added", { id: toastId });
                                  } catch (err) {
                                    toast.error("Documentation failed", { id: toastId });
                                  }
                                }}
                              >
                                <Info className="w-3 h-3 mr-1" />
                                Docs
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[9px] uppercase tracking-tighter text-zinc-500 hover:text-zinc-300 px-2"
                                onClick={async () => {
                                  if (!activeProject?.js) return;
                                  const toastId = toast.loading("Analyzing code...");
                                  try {
                                    const analysis = await generateCode("Analyze this JavaScript code for complexity, performance bottlenecks, and potential bugs. Provide a concise report in markdown. Return ONLY the analysis report.", 'js', activeProject);
                                    handleSubmit(undefined, `Here is the analysis for your JavaScript code:\n\n${analysis}`);
                                    toast.success("Analysis complete", { id: toastId });
                                  } catch (err) {
                                    toast.error("Analysis failed", { id: toastId });
                                  }
                                }}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Analyze
                              </Button>
                            </div>
                            <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">ES6+</Badge>
                          </div>
                        </div>
                        <Card className="border-border bg-muted/50 overflow-hidden font-mono text-sm relative">
                          <Editor
                            value={activeProject.js}
                            onValueChange={code => setActiveProject({ ...activeProject, js: code })}
                            highlight={code => prism.highlight(code, prism.languages.javascript, 'javascript')}
                            padding={20}
                            onFocus={() => setFocusedEditor('js')}
                            onBlur={() => setFocusedEditor(null)}
                            className="min-h-[200px] outline-none"
                            style={{
                              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                              fontSize: 12,
                            }}
                          />
                        </Card>
                        {codeErrors.js.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                            {codeErrors.js.map((err, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-red-400 font-mono">
                                <span className="opacity-50 shrink-0">Line {err.line}:</span>
                                <span>{err.message}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="h-[200px]">
                          <JSREPL 
                            code={activeProject.js} 
                            onCodeChange={(code) => setActiveProject({ ...activeProject, js: code })}
                            onAiInteract={(output) => {
                              const message = `I just ran this JS code and got this output: "${output}". Can you explain what happened or suggest improvements?`;
                              handleSubmit(undefined, message);
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            main.py
                            {codeErrors.python.length === 0 ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "sm" }),
                                "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-green-400 px-2"
                              )}
                              onClick={() => {
                                navigator.clipboard.writeText(activeProject.python);
                                toast.success("Python code copied to clipboard!");
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                            {aiPrompt?.type === 'python' ? (
                              <div className="flex items-center gap-1 bg-muted border border-border rounded-lg px-2 py-1">
                                <input 
                                  autoFocus
                                  value={aiPrompt.value}
                                  onChange={(e) => setAiPrompt({ ...aiPrompt, value: e.target.value })}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate('python')}
                                  placeholder={aiPrompt.value.startsWith('Generate a Python function') ? "Describe the function..." : "Describe Python change..."}
                                  className="bg-transparent border-none outline-none text-[10px] w-48 text-foreground"
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-blue-500"
                                  onClick={() => handleAiGenerate('python')}
                                  disabled={isGenerating}
                                >
                                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-5 w-5 text-zinc-500"
                                  onClick={() => setAiPrompt(null)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger 
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "sm" }),
                                      "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-blue-400 px-2"
                                    )}
                                    onClick={() => setAiPrompt({ type: 'python', value: 'Generate a Python function that ' })}
                                  >
                                    <Code className="w-3 h-3 mr-1" />
                                    Generate Function
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                    Generate a new function
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger 
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "sm" }),
                                      "h-6 text-[9px] uppercase tracking-tighter text-zinc-500 hover:text-zinc-300 px-2"
                                    )}
                                    onClick={async () => {
                                      if (!activeProject?.python) return;
                                      const toastId = toast.loading("Refactoring code...");
                                      try {
                                        const refactored = await generateCode("Refactor this Python code to be more efficient, readable, and follow PEP 8 best practices. Return ONLY the refactored code.", 'python', activeProject);
                                        setActiveProject({ ...activeProject, python: refactored });
                                        toast.success("Code refactored", { id: toastId });
                                      } catch (err) {
                                        toast.error("Refactoring failed", { id: toastId });
                                      }
                                    }}
                                  >
                                    <Zap className="w-3 h-3 mr-1" />
                                    Refactor
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                    Refactor with AI
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger 
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "sm" }),
                                      "h-6 text-[9px] uppercase tracking-tighter text-zinc-500 hover:text-zinc-300 px-2"
                                    )}
                                    onClick={async () => {
                                      if (!activeProject?.python) return;
                                      const toastId = toast.loading("Generating documentation...");
                                      try {
                                        const documented = await generateCode("Add docstrings and documentation to this Python code. Return ONLY the documented code.", 'python', activeProject);
                                        setActiveProject({ ...activeProject, python: documented });
                                        toast.success("Documentation added", { id: toastId });
                                      } catch (err) {
                                        toast.error("Documentation failed", { id: toastId });
                                      }
                                    }}
                                  >
                                    <Info className="w-3 h-3 mr-1" />
                                    Docs
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                    Add docstrings with AI
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger 
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "sm" }),
                                      "h-6 text-[9px] uppercase tracking-tighter text-zinc-500 hover:text-zinc-300 px-2"
                                    )}
                                    onClick={async () => {
                                      if (!activeProject?.python) return;
                                      const toastId = toast.loading("Generating unit tests...");
                                      try {
                                        const tests = await generateCode("Generate unit tests for this Python code using the unittest framework. Return ONLY the test code.", 'python', activeProject);
                                        // Append tests to the code or show in a modal? Let's append for now.
                                        setActiveProject({ ...activeProject, python: activeProject.python + "\n\n# Unit Tests\n" + tests });
                                        toast.success("Tests generated", { id: toastId });
                                      } catch (err) {
                                        toast.error("Test generation failed", { id: toastId });
                                      }
                                    }}
                                  >
                                    <History className="w-3 h-3 mr-1" />
                                    Test
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                    Generate unit tests
                                  </TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                  <TooltipTrigger 
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "sm" }),
                                      "h-6 text-[9px] uppercase tracking-tighter text-zinc-500 hover:text-zinc-300 px-2"
                                    )}
                                    onClick={async () => {
                                      if (!activeProject?.python) return;
                                      const toastId = toast.loading("Formatting code...");
                                      try {
                                        const formatted = await generateCode("Format and clean up this Python code according to PEP 8. Return ONLY the formatted code.", 'python', activeProject);
                                        setActiveProject({ ...activeProject, python: formatted });
                                        toast.success("Code formatted", { id: toastId });
                                      } catch (err) {
                                        toast.error("Formatting failed", { id: toastId });
                                      }
                                    }}
                                  >
                                    <Layout className="w-3 h-3 mr-1" />
                                    Format
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                    Format code with AI
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger 
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "sm" }),
                                      "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-blue-400 px-2"
                                    )}
                                    onClick={() => setAiPrompt({ type: 'python', value: '' })}
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI Edit
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                    Modify with AI (Cmd+K)
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                            {codeErrors.python.length > 0 && (
                              <Badge variant="destructive" className="text-[9px] h-5 px-1.5 animate-pulse">
                                {codeErrors.python.length} Error{codeErrors.python.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            <Tooltip>
                              <TooltipTrigger 
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "sm" }),
                                  "h-6 text-[9px] uppercase tracking-tighter text-muted-foreground hover:text-foreground px-2"
                                )}
                                onClick={async () => {
                                  if (!activeProject?.python) return;
                                  const toastId = toast.loading("Analyzing code...");
                                  try {
                                    const analysis = await generateCode("Analyze this Python code for complexity, performance bottlenecks, and potential bugs. Provide a concise report in markdown. Return ONLY the analysis report.", 'python', activeProject);
                                    handleSubmit(undefined, `Here is the analysis for your Python code:\n\n${analysis}`);
                                    toast.success("Analysis complete", { id: toastId });
                                  } catch (err) {
                                    toast.error("Analysis failed", { id: toastId });
                                  }
                                }}
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Analyze
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-[10px] bg-card border-border">
                                Analyze code quality
                              </TooltipContent>
                            </Tooltip>
                            <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">Python 3</Badge>
                          </div>
                        </div>
                        <Card className="border-border bg-muted/50 overflow-hidden font-mono text-sm relative">
                          <Editor
                            value={activeProject.python || ''}
                            onValueChange={code => setActiveProject({ ...activeProject, python: code })}
                            highlight={code => prism.highlight(code, prism.languages.python, 'python')}
                            padding={20}
                            onFocus={() => setFocusedEditor('python')}
                            onBlur={() => setFocusedEditor(null)}
                            className="min-h-[200px] outline-none"
                            style={{
                              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                              fontSize: 12,
                            }}
                          />
                        </Card>
                        {codeErrors.python.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
                            {codeErrors.python.map((err, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-red-400 font-mono">
                                <span className="opacity-50 shrink-0">Line {err.line}:</span>
                                <span>{err.message}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="h-[300px]">
                          <PythonREPL 
                            code={activeProject.python || ''} 
                            onCodeChange={(code) => setActiveProject({ ...activeProject, python: code })}
                            onAiInteract={(output) => {
                              if (output === "GENERATE_FUNCTION_REQUEST") {
                                setAiPrompt({ type: 'python', value: 'Generate a Python function that ' });
                              } else {
                                const message = `I just ran this Python code and got this output: "${output}". Can you explain what happened or suggest improvements?`;
                                handleSubmit(undefined, message);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}

              {(workspaceView === 'preview' || workspaceView === 'split') && (
                <div className={cn("h-full p-8 flex items-center justify-center overflow-auto bg-muted/50", workspaceView === 'split' ? "w-1/2" : "w-full")}>
                  <div className={cn(
                    "bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-500 border border-border relative group",
                    (previewMode === 'desktop' || workspaceView === 'split') ? "w-full h-full" : 
                    previewMode === 'tablet' ? "w-[768px] max-w-full h-[1024px] max-h-full" : 
                    "w-[375px] max-w-full h-[667px] max-h-full"
                  )}>
                    <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="bg-card/80 backdrop-blur-md border-border text-[10px] uppercase tracking-widest text-emerald-400 gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </Badge>
                    </div>
                    <iframe 
                      title="Preview"
                      className="w-full h-full border-none"
                      allow="camera; microphone; display-capture"
                      srcDoc={`
                        <html>
                          <head>
                            <script src="https://cdn.tailwindcss.com"></script>
                            <style>${debouncedProject?.css || ''}</style>
                          </head>
                          <body>
                            ${debouncedProject?.html || ''}
                            <script>${debouncedProject?.js || ''}</script>
                          </body>
                        </html>
                      `}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
