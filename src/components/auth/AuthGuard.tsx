'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { GlobalLoader } from './GlobalLoader';
import { usePathname } from 'next/navigation';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuth();
  const pathname = usePathname();

  if (isLoading) {
    if (pathname === '/extract' || pathname?.startsWith('/extract/')) {
      return null;
    }
    return <GlobalLoader />;
  }

  return <>{children}</>;
};
