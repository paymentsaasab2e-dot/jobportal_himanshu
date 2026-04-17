'use client';

import { FileText, Mic2, ClipboardCheck, Route } from 'lucide-react';

const STATS = [
  { icon: FileText, label: 'Resume Reviews Completed', value: '2,847', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { icon: Mic2, label: 'Mock Interviews Conducted', value: '1,523', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: ClipboardCheck, label: 'Skills Assessed', value: '4,216', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
  { icon: Route, label: 'Learning Paths Recommended', value: '981', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
];

export default function ServicesStatsStrip() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3.5 rounded-2xl bg-white border border-gray-200/80 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.border} border`}
          >
            <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 leading-snug">{stat.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
