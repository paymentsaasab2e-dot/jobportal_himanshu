'use client';

import { useState } from 'react';
import { Mic2, Sparkles, ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { MockConfigPanel } from './MockConfigPanel';
import { MockStartButton } from './MockStartButton';

type MockInterviewCardProps = {
  difficulty: string;
  role: string;
  onChangeConfig: (next: { difficulty: string; role: string }) => void;
  onStartMock: () => void;
};

export function MockInterviewCard({ difficulty, role, onChangeConfig, onStartMock }: MockInterviewCardProps) {
  const [topic, setTopic] = useState('');

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#28A8E1]/10 text-[#28A8E1] ring-1 ring-[#28A8E1]/20">
          <Mic2 className="h-6 w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">AI mock interview</h2>
          <p className="mt-0.5 text-sm font-normal text-gray-500">Choose your role and configure your session.</p>
        </div>
      </div>

      {/* Two-card layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Left card – Become the interviewer */}
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-4 space-y-3 flex flex-col">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <BriefcaseBusiness className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700">Become the interviewer</p>
              <p className="text-xs text-gray-400 font-normal">Enter who you are interviewing to generate questions.</p>
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute left-3 top-3">
              <Sparkles className="h-4 w-4 text-amber-400" strokeWidth={2} />
            </div>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Junior Frontend Developer, Product Manager candidate, Data Analyst applicant..."
              rows={4}
              className="w-full h-full min-h-[100px] resize-none rounded-xl border border-amber-200/60 bg-white pl-9 pr-3 pt-2.5 pb-2.5 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
            />
          </div>

          <button
            type="button"
            disabled={!topic.trim()}
            onClick={() => {
              if (topic.trim()) {
                onChangeConfig({ difficulty, role: topic.trim() });
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-amber-600 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate interview questions
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Right card – Be interviewed (config + start) */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="inline-block rounded-md bg-[#28A8E1] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">Be interviewed</span>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">Jump straight into the real-time AI mock session. You can seamlessly configure your role and interview parameters directly inside the module.</p>
          </div>
          <button 
             onClick={() => window.location.href = '/Aimockinter'}
             className="w-full mt-4 rounded-xl bg-[#28A8E1] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#1a85b6] hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
             <Mic2 className="w-5 h-5 flex-shrink-0" /> Launch AI Interview
          </button>
        </div>

      </div>
    </section>
  );
}
