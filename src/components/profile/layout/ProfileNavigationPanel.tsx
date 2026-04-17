import type { ReactNode } from 'react';

export function ProfileNavigationPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-4">{children}</div>
    </div>
  );
}
