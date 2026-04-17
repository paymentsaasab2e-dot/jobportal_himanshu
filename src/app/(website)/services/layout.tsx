'use client';

import type { ReactNode } from 'react';
import Header from '@/components/common/Header';
import { SVC_PAGE_BG, SVC_CONTENT_CLASS } from './constants';

import { ServicesProvider } from './context/ServicesContext';

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1" style={{ background: SVC_PAGE_BG }}>
      <ServicesProvider>
        <div className={SVC_CONTENT_CLASS}>{children}</div>
      </ServicesProvider>
    </div>
  );
}
