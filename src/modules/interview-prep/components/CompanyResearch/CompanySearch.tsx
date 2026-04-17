'use client';

import { Search } from 'lucide-react';
import { CompanyTag } from './CompanyTag';
import { useMemo, useState } from 'react';

type CompanySearchProps = {
  suggested: string[];
  onTag?: (company: string) => void;
};

export function CompanySearch({ suggested, onTag }: CompanySearchProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suggested;
    return suggested.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [query, suggested]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Company research</h2>
        <p className="mt-1 text-sm font-normal text-gray-500">Search UI only — hook to enrichment API later.</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md space-y-4">
        <label className="block">
          <span className="sr-only">Search companies</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
            <input
              type="search"
              placeholder="Search companies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-sm font-semibold text-gray-900 outline-none transition-all duration-200 ease-in-out focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-gray-400"
            />
          </div>
        </label>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Suggested</p>
          <ul className="flex flex-wrap gap-2">
            {filtered.map((name) => (
              <li key={name}>
                <CompanyTag name={name} onSelect={onTag} />
              </li>
            ))}
          </ul>
          {query.trim() && filtered.length === 0 ? (
            <p className="mt-3 text-sm font-medium text-gray-500">No matches. Try a different keyword.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
