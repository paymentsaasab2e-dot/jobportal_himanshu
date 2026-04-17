'use client';

import { useEffect, useState } from 'react';

type ConfidenceGaugeProps = {
  value: number;
  label?: string;
};

export function ConfidenceGauge({ value, label = 'Confidence' }: ConfidenceGaugeProps) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 40;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(c * (1 - pct / 100)));
    return () => cancelAnimationFrame(id);
  }, [c, pct]);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md">
      <p className="text-sm font-bold text-gray-900 mb-4">{label}</p>
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#28A8E1"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900 tabular-nums">
          {pct}%
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-gray-500 text-center">Last mock aggregate (mock)</p>
    </div>
  );
}
