'use client';

import type { InterviewScore } from '../types/interview.types';

const LABELS: { key: keyof InterviewScore; label: string }[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'technical', label: 'Technical' },
  { key: 'behavioral', label: 'Behavioral' },
  { key: 'systemDesign', label: 'System' },
  { key: 'communication', label: 'Comm' },
];

export function PerformanceSnapshot({ scores }: { scores: InterviewScore }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-white/20">
      {LABELS.map(({ key, label }) => {
        const v = scores[key];
        const hasValue = v != null && Number.isFinite(Number(v));
        const pct = hasValue ? Math.max(0, Math.min(100, Number(v))) : 0;
        return (
          <div key={key} className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">{label}</p>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/90 transition-[width] duration-700 ease-out"
                style={{ width: hasValue ? `${pct}%` : '0%' }}
              />
            </div>
            <p className="mt-1 text-sm font-bold text-white tabular-nums">
              {hasValue ? `${pct}%` : '—'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
