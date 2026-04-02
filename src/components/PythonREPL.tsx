import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Loader2, X, Trash2, ChevronRight, Sparkles, Plus, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import initRuff, { Workspace, PositionEncoding } from '@astral-sh/ruff-wasm-web';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

interface PythonREPLProps {
  code: string;
  onCodeChange: (code: string) => void;
  onAiInteract?: (output: string) => void;
}

interface REPLOutput {
  type: 'stdout' | 'stderr' | 'result' | 'error' | 'system' | 'plot';
  content: string;
}

interface PythonVariable {
  name: string;
  type: string;
  value: string;
}

export function PythonREPL({ code, onCodeChange, onAiInteract }: PythonREPLProps) {
  const [pyodide, setPyodide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [outputs, setOutputs] = useState<REPLOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'console' | 'variables' | 'packages'>('console');
  const [variables, setVariables] = useState<PythonVariable[]>([]);
  const [packageName, setPackageName] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [ruffWorkspace, setRuffWorkspace] = useState<any>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRuff() {
      try {
        await initRuff();
        const workspace = new Workspace({
          'line-length': 88,
          'indent-width': 4,
          format: {
            'indent-style': 'space',
            'quote-style': 'double',
          }
        }, PositionEncoding.Utf16);
        setRuffWorkspace(workspace);
      } catch (err) {
        console.error("Failed to load Ruff:", err);
      }
    }
    loadRuff();
  }, []);

  useEffect(() => {
    async function loadPyodide() {
      setIsLoading(true);
      try {
        // @ts-ignore
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/"
        });
        
        // Load micropip for package management
        await py.loadPackage("micropip");
        
        // Setup plot capture
        await py.runPythonAsync(`
import io, base64
import sys

def _show_plot():
    try:
        import matplotlib.pyplot as plt
        if plt.get_fignums():
            buf = io.BytesIO()
            plt.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            img_str = base64.b64encode(buf.read()).decode('utf-8')
            plt.close('all')
            return f"data:image/png;base64,{img_str}"
    except Exception as e:
        return None
    return None

def _get_variables():
    import json
    import types
    
    exclude = ['_show_plot', '_get_variables', 'io', 'base64', 'sys', 'json', 'types', 'micropip', 'pyodide']
    vars_dict = []
    
    for name, value in globals().items():
        if name.startswith('_') or name in exclude:
            continue
            
        try:
            type_name = type(value).__name__
            if isinstance(value, (int, float, str, bool, list, dict, set, tuple)):
                val_str = str(value)
                if len(val_str) > 100:
                    val_str = val_str[:97] + "..."
            else:
                val_str = f"<{type_name} object>"
                
            vars_dict.append({
                "name": name,
                "type": type_name,
                "value": val_str
            })
        except:
            continue
            
    return json.dumps(vars_dict)
        `);

        setPyodide(py);
        setOutputs([{ type: 'system', content: 'Python 3.11 (Pyodide) initialized with micropip. Ready for execution.' }]);
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
        setOutputs([{ type: 'error', content: 'Failed to initialize Python environment. Please check your connection.' }]);
      } finally {
        setIsLoading(false);
      }
    }

    if (!window.loadPyodide) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
      script.onload = loadPyodide;
      document.head.appendChild(script);
    } else {
      loadPyodide();
    }
  }, []);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs]);

  const runCode = async (codeToRun: string) => {
    if (!pyodide || isExecuting) return;

    setIsExecuting(true);
    const newOutputs: REPLOutput[] = [];
    
    try {
      // Capture stdout
      pyodide.setStdout({
        batched: (text: string) => {
          setOutputs(prev => [...prev, { type: 'stdout', content: text }]);
        }
      });

      pyodide.setStderr({
        batched: (text: string) => {
          setOutputs(prev => [...prev, { type: 'stderr', content: text }]);
        }
      });

      const result = await pyodide.runPythonAsync(codeToRun);
      
      // Check for plots
      const plotData = await pyodide.runPythonAsync("_show_plot()");
      if (plotData) {
        setOutputs(prev => [...prev, { type: 'plot', content: plotData }]);
      }

      if (result !== undefined) {
        setOutputs(prev => [...prev, { type: 'result', content: String(result) }]);
      }
      
      // Update variables
      const varsJson = await pyodide.runPythonAsync("_get_variables()");
      setVariables(JSON.parse(varsJson));
    } catch (err: any) {
      setOutputs(prev => [...prev, { type: 'error', content: err.message }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setOutputs(prev => [...prev, { type: 'system', content: `>>> ${input}` }]);
    runCode(input);
    setInput('');
  };

  const installPackage = async () => {
    if (!pyodide || !packageName.trim() || isInstalling) return;
    
    setIsInstalling(true);
    setOutputs(prev => [...prev, { type: 'system', content: `Installing package: ${packageName}...` }]);
    
    try {
      const micropip = pyodide.pyimport("micropip");
      await micropip.install(packageName);
      setOutputs(prev => [...prev, { type: 'system', content: `Successfully installed ${packageName}` }]);
      setPackageName('');
    } catch (err: any) {
      setOutputs(prev => [...prev, { type: 'error', content: `Failed to install ${packageName}: ${err.message}` }]);
    } finally {
      setIsInstalling(false);
    }
  };

  const formatCode = async () => {
    if (!ruffWorkspace || isFormatting) return;
    setIsFormatting(true);
    try {
      const formatted = ruffWorkspace.format(code);
      onCodeChange(formatted);
      setOutputs(prev => [...prev, { type: 'system', content: 'Code formatted successfully with Ruff.' }]);
    } catch (err: any) {
      setOutputs(prev => [...prev, { type: 'error', content: `Formatting failed: ${err.message}` }]);
    } finally {
      setIsFormatting(false);
    }
  };

  const clearREPL = () => setOutputs([]);

  const handleAiAnalyze = () => {
    if (onAiInteract && outputs.length > 0) {
      const lastOutput = outputs[outputs.length - 1].content;
      onAiInteract(lastOutput);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-xl overflow-hidden font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Python REPL</span>
          </div>
          
          <div className="flex items-center gap-1 bg-background rounded-md p-0.5 border border-border">
            <button 
              onClick={() => setActiveTab('console')}
              className={cn(
                "px-2 py-1 text-[9px] font-bold uppercase tracking-tighter rounded transition-colors",
                activeTab === 'console' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Console
            </button>
            <button 
              onClick={() => setActiveTab('variables')}
              className={cn(
                "px-2 py-1 text-[9px] font-bold uppercase tracking-tighter rounded transition-colors",
                activeTab === 'variables' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Variables
            </button>
            <button 
              onClick={() => setActiveTab('packages')}
              className={cn(
                "px-2 py-1 text-[9px] font-bold uppercase tracking-tighter rounded transition-colors",
                activeTab === 'packages' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Packages
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-zinc-500 hover:text-red-400"
            onClick={clearREPL}
            title="Clear Console"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[12px]">
        {activeTab === 'console' && (
          <>
            {outputs.map((out, i) => (
              <div 
                key={i} 
                className={cn(
                  "whitespace-pre-wrap break-all",
                  out.type === 'stdout' && "text-zinc-300",
                  out.type === 'stderr' && "text-red-400",
                  out.type === 'result' && "text-blue-400 font-bold",
                  out.type === 'error' && "text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20",
                  out.type === 'system' && "text-zinc-500 italic",
                  out.type === 'plot' && "flex justify-center my-2"
                )}
              >
                {out.type === 'plot' ? (
                  <img src={out.content} alt="Python Plot" className="max-w-full rounded border border-border" />
                ) : (
                  out.content
                )}
              </div>
            ))}
            <div ref={outputEndRef} />
          </>
        )}

        {activeTab === 'variables' && (
          <div className="space-y-2">
            {variables.length === 0 ? (
              <div className="text-zinc-600 italic text-center py-8">No variables defined in global scope.</div>
            ) : (
              <div className="grid grid-cols-3 gap-2 border border-border rounded-lg overflow-hidden">
                <div className="bg-muted p-2 text-muted-foreground font-bold border-b border-r border-border">Name</div>
                <div className="bg-muted p-2 text-muted-foreground font-bold border-b border-r border-border">Type</div>
                <div className="bg-muted p-2 text-muted-foreground font-bold border-b border-border">Value</div>
                {variables.map((v, i) => (
                  <React.Fragment key={i}>
                    <div className="p-2 border-b border-r border-border text-blue-400 font-bold truncate">{v.name}</div>
                    <div className="p-2 border-b border-r border-border text-muted-foreground">{v.type}</div>
                    <div className="p-2 border-b border-border text-foreground truncate">{v.value}</div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg border border-border space-y-3">
              <h3 className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">Install Package</h3>
              <div className="flex gap-2">
                <input 
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g. numpy, pandas, matplotlib"
                  className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-[11px] outline-none focus:border-blue-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && installPackage()}
                />
                <Button 
                  size="sm" 
                  onClick={installPackage}
                  disabled={isInstalling || !packageName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-auto py-1.5"
                >
                  {isInstalling ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Plus className="w-3 h-3 mr-2" />}
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={formatCode}
                  disabled={isFormatting || !ruffWorkspace || !code.trim()}
                  className="h-auto py-1.5 border-border hover:bg-muted"
                  title="Format code with Ruff"
                >
                  {isFormatting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <AlignLeft className="w-3 h-3 mr-2" />}
                  Format Code
                </Button>
              </div>
              <p className="text-[10px] text-zinc-600">
                Packages are installed from PyPI using micropip. Some packages with C extensions may not be supported.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 bg-card border-t border-border">
        <form onSubmit={handleInputSubmit} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Loading Python..." : "Type Python code and press Enter..."}
            disabled={isLoading || isExecuting}
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-zinc-300 placeholder:text-zinc-600"
          />
          <div className="flex items-center gap-1">
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-purple-500 hover:bg-purple-500/10"
              onClick={() => {
                // Trigger AI generation for Python in the parent component
                // This is a bit tricky since we need to communicate back to App.tsx
                // Let's assume we can pass a callback or use a shared state
                if (onAiInteract) {
                  onAiInteract("GENERATE_FUNCTION_REQUEST");
                }
              }}
              title="Generate a function"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-blue-500 hover:bg-blue-500/10"
              onClick={() => runCode(code)}
              disabled={isLoading || isExecuting || !code}
              title="Run main.py"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </Button>
            {onAiInteract && outputs.length > 0 && (
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-purple-500 hover:bg-purple-500/10"
                onClick={handleAiAnalyze}
                title="Ask AI about output"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
