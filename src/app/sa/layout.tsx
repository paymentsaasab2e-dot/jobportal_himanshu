'use client';

import { useEffect } from 'react';
import './sa-landing.css';

export default function SaLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return children;
}
