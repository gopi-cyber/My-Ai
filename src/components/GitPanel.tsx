import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Plus, 
  Check, 
  Clock,
  AlertCircle,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface GitStatus {
  not_added: string[];
  conflicted: string[];
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: string[];
  staged: string[];
  ahead: number;
  behind: number;
  current: string;
  tracking: string;
}

interface GitLog {
  all: {
    hash: string;
    date: string;
    message: string;
    author_name: string;
    author_email: string;
  }[];
}

export function GitPanel() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [log, setLog] = useState<GitLog | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'changes' | 'history'>('changes');

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/git/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch git status:', err);
    }
  };

  const fetchLog = async () => {
    try {
      const res = await fetch('/api/git/log');
      const data = await res.json();
      setLog(data);
    } catch (err) {
      console.error('Failed to fetch git log:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLog();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMessage }),
      });
      if (res.ok) {
        toast.success('Changes committed successfully');
        setCommitMessage('');
        fetchStatus();
        fetchLog();
      } else {
        const data = await res.json();
        toast.error(`Commit failed: ${data.error}`);
      }
    } catch (err) {
      toast.error('Failed to commit changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/push', { method: 'POST' });
      if (res.ok) {
        toast.success('Changes pushed to remote');
        fetchStatus();
      } else {
        const data = await res.json();
        toast.error(`Push failed: ${data.error}`);
      }
    } catch (err) {
      toast.error('Failed to push changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/pull', { method: 'POST' });
      if (res.ok) {
        toast.success('Changes pulled from remote');
        fetchStatus();
        fetchLog();
      } else {
        const data = await res.json();
        toast.error(`Pull failed: ${data.error}`);
      }
    } catch (err) {
      toast.error('Failed to pull changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageAll = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/stage', { method: 'POST' });
      if (res.ok) {
        toast.success('All changes staged');
        fetchStatus();
      } else {
        const data = await res.json();
        toast.error(`Staging failed: ${data.error}`);
      }
    } catch (err) {
      toast.error('Failed to stage changes');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = status && (
    status.modified.length > 0 || 
    status.not_added.length > 0 || 
    status.deleted.length > 0 || 
    status.staged.length > 0
  );

  return (
    <div className="flex flex-col h-full bg-background border-l border-border w-full max-w-md">
      <header className="h-14 border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-widest">Git Control</span>
          {status?.current && (
            <Badge variant="outline" className="ml-2 text-[10px] border-border text-muted-foreground">
              {status.current}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { fetchStatus(); fetchLog(); }} className="h-8 w-8 text-muted-foreground">
            <RefreshCw className={isLoading ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
          </Button>
        </div>
      </header>

      <div className="flex border-b border-border">
        <button 
          onClick={() => setView('changes')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${view === 'changes' ? 'text-orange-500 bg-orange-500/5' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Changes
          {hasChanges && <span className="ml-2 w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />}
        </button>
        <button 
          onClick={() => setView('history')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${view === 'history' ? 'text-orange-500 bg-orange-500/5' : 'text-muted-foreground hover:text-foreground'}`}
        >
          History
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {view === 'changes' ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Staged Changes</h3>
                  <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">
                    {status?.staged.length || 0}
                  </Badge>
                </div>
                {status?.staged.length === 0 ? (
                  <div className="text-[10px] text-muted-foreground/60 italic py-2">No staged changes</div>
                ) : (
                  <div className="space-y-1">
                    {status?.staged.map(file => (
                      <div key={file} className="flex items-center gap-2 text-[11px] text-green-400 bg-green-500/5 px-2 py-1.5 rounded border border-green-500/10">
                        <Plus className="w-3 h-3" />
                        {file}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator className="bg-border" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unstaged Changes</h3>
                  <div className="flex items-center gap-2">
                    {((status?.modified.length || 0) + (status?.not_added.length || 0)) > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleStageAll}
                        disabled={isLoading}
                        className="h-6 text-[9px] uppercase tracking-tighter text-orange-500 hover:text-orange-400 px-2"
                      >
                        Stage All
                      </Button>
                    )}
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">
                      {(status?.modified.length || 0) + (status?.not_added.length || 0)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  {status?.modified.map(file => (
                    <div key={file} className="flex items-center gap-2 text-[11px] text-orange-400 bg-orange-500/5 px-2 py-1.5 rounded border border-orange-500/10">
                      <AlertCircle className="w-3 h-3" />
                      {file}
                      <span className="ml-auto text-[8px] uppercase opacity-50">Modified</span>
                    </div>
                  ))}
                  {status?.not_added.map(file => (
                    <div key={file} className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted px-2 py-1.5 rounded border border-border">
                      <Plus className="w-3 h-3" />
                      {file}
                      <span className="ml-auto text-[8px] uppercase opacity-50">Untracked</span>
                    </div>
                  ))}
                  {!hasChanges && (
                    <div className="text-[10px] text-muted-foreground/60 italic py-2">Workspace clean</div>
                  )}
                </div>
              </div>

              {hasChanges && (
                <div className="pt-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Commit Message</label>
                    <Input 
                      placeholder="What did you change?"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="bg-muted border-border text-xs h-10 focus:ring-orange-500/20"
                    />
                  </div>
                  <Button 
                    onClick={handleCommit}
                    disabled={isLoading || !commitMessage.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest h-10"
                  >
                    <GitCommit className="w-3.5 h-3.5 mr-2" />
                    Commit Changes
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Commit History</h3>
              <div className="space-y-3">
                {log?.all.map((commit, i) => (
                  <div key={commit.hash} className="relative pl-6 pb-6 border-l border-border last:pb-0">
                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-muted border-2 border-background" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">{commit.message}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/60">{commit.hash.substring(0, 7)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(commit.date).toLocaleDateString()}
                        <Separator orientation="vertical" className="h-2 bg-border" />
                        {commit.author_name}
                      </div>
                    </div>
                  </div>
                ))}
                {(!log || log.all.length === 0) && (
                  <div className="text-[10px] text-muted-foreground/60 italic py-2 text-center">No commit history found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t border-border bg-muted/30 space-y-3">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePull}
            disabled={isLoading}
            className="flex-1 border-border text-muted-foreground hover:bg-muted text-[9px] font-bold uppercase tracking-widest h-9"
          >
            <ArrowDown className="w-3 h-3 mr-2" />
            Pull
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePush}
            disabled={isLoading}
            className="flex-1 border-border text-muted-foreground hover:bg-muted text-[9px] font-bold uppercase tracking-widest h-9"
          >
            <ArrowUp className="w-3 h-3 mr-2" />
            Push
          </Button>
        </div>
        <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground/60 uppercase tracking-tighter">
          <div className="flex items-center gap-1">
            <ArrowUp className="w-2.5 h-2.5" />
            {status?.ahead || 0} Ahead
          </div>
          <div className="flex items-center gap-1">
            <ArrowDown className="w-2.5 h-2.5" />
            {status?.behind || 0} Behind
          </div>
        </div>
      </footer>
    </div>
  );
}
