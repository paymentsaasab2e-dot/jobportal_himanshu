import type { ReactNode } from 'react';

export function ProfileMainPanel({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      {children}
    </div>
  );
}
