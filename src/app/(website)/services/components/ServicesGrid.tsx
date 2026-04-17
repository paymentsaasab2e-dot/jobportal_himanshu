'use client';

import { SearchX, RotateCcw } from 'lucide-react';
import type { ServiceDefinition } from '../data/services';
import ServiceCard from './ServiceCard';

interface ServicesGridProps {
  services: ServiceDefinition[];
  onRequestService?: (service: ServiceDefinition) => void;
  onResetFilters?: () => void;
}

export default function ServicesGrid({ services, onRequestService, onResetFilters }: ServicesGridProps) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mb-4">
          <SearchX className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">No services found</h3>
        <p className="text-sm text-gray-500 font-normal mb-5 max-w-sm">
          Try another keyword or switch to a different category.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} onRequestService={onRequestService} />
      ))}
    </div>
  );
}
