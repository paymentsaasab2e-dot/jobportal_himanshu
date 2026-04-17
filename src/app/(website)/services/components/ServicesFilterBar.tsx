'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { SERVICE_CATEGORIES, type ServiceCategory } from '../data/services';

interface ServicesFilterBarProps {
  activeTab: ServiceCategory | 'all';
  onTabChange: (tab: ServiceCategory | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'az', label: 'A–Z' },
];

export default function ServicesFilterBar({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}: ServicesFilterBarProps) {
  return (
    <div id="services-grid" className="space-y-4">
      {/* Tabs row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {SERVICE_CATEGORIES.map((cat) => {
          const active = activeTab === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onTabChange(cat.key)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                active
                  ? 'bg-[#28A8E1] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search + Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search services..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#28A8E1]/30 focus:border-[#28A8E1]/50 transition-all"
          />
        </div>
        <div className="relative shrink-0">
          <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-8 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#28A8E1]/30 focus:border-[#28A8E1]/50 transition-all cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
