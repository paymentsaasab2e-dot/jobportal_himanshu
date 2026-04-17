'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, X, MessageSquare, ShieldCheck } from 'lucide-react';
import { useLmsToast } from './ux/LmsToastProvider';
import { useLmsState } from '../state/LmsStateProvider';

export function GlobalAiAssistant() {
  const toast = useLmsToast();
  const { state } = useLmsState();
  const [aiCommand, setAiCommand] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAiCommand = async () => {
    if (!aiCommand.trim() || isThinking) return;
    
    setIsThinking(true);
    
    // Simulate internal AI logic based on state
    const context = state.resumeDraft.sections.basics.name 
      ? `Acting for ${state.resumeDraft.sections.basics.name}.` : "";
      
    const message = `Analyzing: "${aiCommand}"... ${context} I'm auditing your profile and career path.`;
    
    toast.push({ 
      title: 'Global AI Coach', 
      message,
      tone: 'info' 
    });

    // Simulate backend delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    toast.push({
      title: 'AI Insight',
      message: "I've processed your request. Since you're building a resume, I recommend emphasizing your 'ATS Readiness' score by completing the Skills section.",
      tone: 'success'
    });

    setAiCommand('');
    setIsThinking(false);
  };

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] pointer-events-none p-8 flex flex-col items-center select-none">
      
      {/* Search Input Bar */}
      <div className={`w-full max-w-2xl transition-all duration-500 ease-out transform ${
        isExpanded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
      }`}>
        <div className="relative group overflow-hidden rounded-[2.5rem] border border-slate-700/60 bg-slate-900/95 p-3 pr-4 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-sky-400 border border-slate-700/50 transition-transform ${isThinking ? 'animate-spin-slow' : 'group-hover:rotate-12'}`}>
              <Sparkles className="h-6 w-6" strokeWidth={2.2} />
            </div>
            
            <input 
              ref={inputRef}
              type="text"
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiCommand()}
              placeholder={isThinking ? "AI is thinking..." : "Ask your Global Coach anything..."}
              disabled={isThinking}
              className="w-full bg-transparent border-none text-base font-medium text-white placeholder-slate-500 focus:ring-0 outline-none cursor-text pointer-events-auto"
            />

            <div className="flex items-center gap-2">
               <button 
                onClick={handleAiCommand}
                disabled={!aiCommand.trim() || isThinking}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500 text-white transition-all hover:bg-sky-400 active:scale-95 disabled:opacity-30 disabled:grayscale pointer-events-auto shadow-lg shadow-sky-500/20"
              >
                <Send className="h-5 w-5 fill-current" />
              </button>
              <button 
                onClick={() => setIsExpanded(false)}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors pointer-events-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className={`absolute bottom-8 right-8 transition-all duration-500 ${
        isExpanded ? 'translate-x-24 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100 pointer-events-auto'
      }`}>
        <div className="relative group">
          <button
            onClick={() => setIsExpanded(true)}
            className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-slate-950 border border-slate-700/50 text-white shadow-[0_24px_56px_-12px_rgba(0,0,0,0.6)] transition-all duration-500 hover:scale-110 active:scale-90"
          >
            <div className="absolute -inset-1 animate-pulse rounded-[2.2rem] bg-sky-500/20 blur-2xl group-hover:bg-sky-400/30" />
            <div className="relative flex flex-col items-center">
              <Sparkles className="h-8 w-8 text-sky-400 group-hover:scale-110 transition-transform duration-300" strokeWidth={2.5} />
            </div>
          </button>
          
          <div className="absolute -right-2 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white shadow-lg">
             <Bot className="h-4 w-4 text-white" />
          </div>

          <div className="absolute -top-12 right-0 bg-white px-4 py-2 rounded-2xl shadow-xl border border-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none">
             <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                AI Coach Active
             </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
