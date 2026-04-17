'use client';

import { Calendar, ChevronRight } from 'lucide-react';
import type { MyServiceItem, MyServiceStatus } from '../data/my-services-mock';

const STATUS_COLORS: Record<MyServiceStatus, string> = {
  'Not Started': 'bg-gray-100 text-gray-700 border-gray-200',
  'Requested': 'bg-amber-50 text-amber-700 border-amber-200',
  'In Review': 'bg-blue-50 text-blue-700 border-blue-200',
  'Scheduled': 'bg-violet-50 text-violet-700 border-violet-200',
  'In Progress': 'bg-sky-50 text-sky-700 border-sky-200',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Cancelled': 'bg-rose-50 text-rose-700 border-rose-200',
};

interface MyServiceCardProps {
  item: MyServiceItem;
  onClickAction?: () => void;
}

export default function MyServiceCard({ item, onClickAction }: MyServiceCardProps) {
  const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS['Not Started'];

  return (
    <div 
      onClick={onClickAction}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white border border-gray-200/80 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer"
    >
      
      {/* Left side: Info */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-base font-bold text-gray-900 truncate">
            {item.serviceName}
          </h3>
          <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusColor}`}>
            {item.status}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 font-normal">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
            Requested: {new Date(item.requestDate).toLocaleDateString()}
          </span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="text-gray-600 font-medium">
            Next: {item.nextStep}
          </span>
        </div>
      </div>

      {/* Right side: Action */}
      <div className="shrink-0 flex items-center justify-end">
        <button 
          type="button"
          onClick={onClickAction}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
        >
          {item.action}
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
      
    </div>
  );
}
