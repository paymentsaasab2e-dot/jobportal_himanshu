'use client';

import { useEffect, useState } from 'react';
import { Flame, Check } from 'lucide-react';

type TodayFocusCardProps = {
  items: string[];
  onStartNow?: () => void;
};

export function TodayFocusCard({ items, onStartNow }: TodayFocusCardProps) {
  const [done, setDone] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ip:todayfocus');
      if (stored) setDone(JSON.parse(stored));
    } catch {}
  }, []);

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = { ...prev, [i]: !prev[i] };
      try { localStorage.setItem('ip:todayfocus', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/50 to-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
            <Flame className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Today&apos;s focus</h2>
            <ul className="mt-3 space-y-2">
              {items.map((text, i) => (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="flex w-full items-start gap-3 rounded-xl border border-transparent px-2 py-1.5 text-left transition-all duration-200 ease-in-out hover:border-gray-100 hover:bg-white/80 hover:shadow-sm"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ease-in-out ${
                        done[i]
                          ? 'border-emerald-500 bg-emerald-500 text-white scale-100'
                          : 'border-gray-300 bg-white text-transparent hover:border-orange-300'
                      }`}
                      aria-hidden
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span
                      className={`text-sm font-medium transition-colors duration-200 ${
                        done[i] ? 'text-gray-400 line-through' : 'text-gray-800'
                      }`}
                    >
                      {text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={onStartNow}
          className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center rounded-2xl bg-[#28A8E1] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          Start now
        </button>
      </div>
    </div>
  );
}
