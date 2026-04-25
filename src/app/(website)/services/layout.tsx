'use client';

import type { ReactNode } from 'react';
import Header from '@/components/common/Header';
import { SVC_PAGE_BG, SVC_CONTENT_CLASS } from './constants';

import { ServicesProvider } from './context/ServicesContext';

import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${outfit.variable} flex-1 antialiased`} style={{ background: SVC_PAGE_BG }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <ServicesProvider>
        {children}
      </ServicesProvider>
    </div>
  );
}
