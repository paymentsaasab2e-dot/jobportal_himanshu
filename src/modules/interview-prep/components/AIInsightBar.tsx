'use client';

import { Brain } from 'lucide-react';

type AIInsightBarProps = {
  message: string;
};

export function AIInsightBar({ message }: AIInsightBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-violet-100 bg-violet-50/80 px-4 py-2.5 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md">
      <Brain className="h-4 w-4 shrink-0 text-violet-600" strokeWidth={2} aria-hidden />
      <p className="text-xs sm:text-sm font-medium text-violet-950 leading-snug">{message}</p>
    </div>
  );
}
