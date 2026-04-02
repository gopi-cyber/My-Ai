import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Loader2, X, Trash2, ChevronRight, Sparkles, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JSREPLProps {
  code: string;
  onCodeChange: (code: string) => void;
  onAiInteract?: (output: string) => void;
}

interface REPLOutput {
  type: 'stdout' | 'result' | 'error' | 'system';
  content: string;
}

export function JSREPL({ code, onCodeChange, onAiInteract }: JSREPLProps) {
  const [outputs, setOutputs] = useState<REPLOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [input, setInput] = useState('');
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOutputs([{ type: 'system', content: 'JavaScript (ES6+) REPL initialized. Ready for execution.' }]);
  }, []);

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs]);

  const runCode = async (codeToRun: string) => {
    if (isExecuting) return;

    setIsExecuting(true);
    
    try {
      // Create a sandbox-like environment using a function
      // Note: This is not a true secure sandbox, but sufficient for a REPL
      const consoleLog = (...args: any[]) => {
        const content = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        setOutputs(prev => [...prev, { type: 'stdout', content }]);
      };

      const sandbox = {
        console: {
          log: consoleLog,
          error: (...args: any[]) => {
            const content = args.map(arg => String(arg)).join(' ');
            setOutputs(prev => [...prev, { type: 'error', content }]);
          },
          warn: consoleLog,
          info: consoleLog,
        }
      };

      const func = new Function('sandbox', `
        with (sandbox) {
          return (async () => {
            ${codeToRun}
          })();
        }
      `);

      const result = await func(sandbox);
      
      if (result !== undefined) {
        setOutputs(prev => [...prev, { type: 'result', content: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result) }]);
      }
    } catch (err: any) {
      setOutputs(prev => [...prev, { type: 'error', content: err.message }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setOutputs(prev => [...prev, { type: 'system', content: `> ${input}` }]);
    runCode(input);
    setInput('');
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
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">JS REPL</span>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Output Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 text-[12px]">
        {outputs.map((out, i) => (
          <div 
            key={i} 
            className={cn(
              "whitespace-pre-wrap break-all",
              out.type === 'stdout' && "text-zinc-300",
              out.type === 'result' && "text-yellow-400 font-bold",
              out.type === 'error' && "text-red-500 bg-red-500/10 p-2 rounded border border-red-500/20",
              out.type === 'system' && "text-zinc-500 italic"
            )}
          >
            {out.content}
          </div>
        ))}
        <div ref={outputEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 bg-card border-t border-border">
        <form onSubmit={handleInputSubmit} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type JS code and press Enter..."
            disabled={isExecuting}
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-zinc-300 placeholder:text-zinc-600"
          />
          <div className="flex items-center gap-1">
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-blue-500 hover:bg-blue-500/10"
              onClick={() => runCode(code)}
              disabled={isExecuting || !code}
              title="Run main.js"
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
