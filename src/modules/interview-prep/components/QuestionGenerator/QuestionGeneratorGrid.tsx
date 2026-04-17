'use client';

import { useState } from 'react';
import { Users, Cpu, Network, Building2, Sparkles, Send } from 'lucide-react';
import { QuestionCard } from './QuestionCard';
import type { InterviewPrepData } from '../../types/interview.types';

const ICONS = {
  hr: Users,
  technical: Cpu,
  system: Network,
  company: Building2,
} as const;

type QuestionGeneratorGridProps = {
  items: InterviewPrepData['questionGenerator'];
  onGenerate: (type: string) => void;
};

export function QuestionGeneratorGrid({ items, onGenerate }: QuestionGeneratorGridProps) {
  const [prompt, setPrompt] = useState('');

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI question generator</h2>
        <p className="mt-1 text-sm font-normal text-gray-500">
          One-tap sets — wire to your prompt API. Voice + transcript hooks ready in{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">useInterviewPrep</code>.
        </p>
      </div>
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 to-white p-1.5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-2 rounded-xl bg-white p-2">
          <div className="hidden sm:flex items-center pl-3">
            <Sparkles className="h-5 w-5 text-violet-500" strokeWidth={2} />
          </div>
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask AI to generate a custom practice set..."
            className="flex-1 bg-transparent px-3 py-2 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && prompt.trim()) {
                onGenerate(prompt.trim());
                setPrompt('');
              }
            }}
          />
          <button
            type="button"
            className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-violet-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!prompt.trim()}
            onClick={() => {
              onGenerate(prompt.trim());
              setPrompt('');
            }}
          >
            Generate set
            <Send className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
