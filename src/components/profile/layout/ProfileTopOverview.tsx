import type { ReactNode } from 'react';

export function ProfileTopOverview({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
      {children}
    </div>
  );
}
