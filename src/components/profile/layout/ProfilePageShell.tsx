import type { ReactNode } from 'react';

/** Single soft neutral surface — aligned with dashboard SaaS chrome */
export function ProfilePageShell({ children }: { children: ReactNode }) {
  const PAGE_BG =
    "radial-gradient(circle at top left, rgba(40,168,225,0.13), transparent 28%), radial-gradient(circle at 85% 12%, rgba(40,168,223,0.1), transparent 16%), radial-gradient(circle at 18% 82%, rgba(252,150,32,0.08), transparent 18%), linear-gradient(180deg, #f5fafd 0%, #f8fcff 44%, #fcfdff 100%)";

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      {children}
    </div>
  );
}
