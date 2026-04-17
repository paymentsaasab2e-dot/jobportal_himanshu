'use client';

import { Building2 } from 'lucide-react';

type CompanyTagProps = {
  name: string;
  onSelect?: (name: string) => void;
};

export function CompanyTag({ name, onSelect }: CompanyTagProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(name)}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50/50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
    >
      <Building2 className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} aria-hidden />
      {name}
    </button>
  );
}
