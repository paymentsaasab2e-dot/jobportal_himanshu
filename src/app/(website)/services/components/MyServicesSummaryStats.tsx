'use client';

import { 
  Briefcase, 
  CalendarClock, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import type { MyServiceItem } from '../data/my-services-mock';

interface MyServicesSummaryStatsProps {
  services: MyServiceItem[];
}

export default function MyServicesSummaryStats({ services }: MyServicesSummaryStatsProps) {
  const activeCount = services.filter(s => ['Requested', 'In Review', 'Scheduled', 'In Progress'].includes(s.status)).length;
  const completedCount = services.filter(s => s.status === 'Completed').length;
  const draftCount = services.filter(s => s.status === 'Not Started').length;

  const STATS = [
    {
      label: 'Active Requests',
      value: activeCount,
      icon: Briefcase,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Drafts to Finish',
      value: draftCount,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Total Services',
      value: services.length,
      icon: CalendarClock,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => (
        <div key={stat.label} className="flex items-center gap-3.5 rounded-2xl bg-white border border-gray-200/80 p-4 shadow-sm">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.border} border`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 leading-snug">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
