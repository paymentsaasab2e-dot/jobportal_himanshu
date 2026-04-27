'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { GlobalLoader } from './GlobalLoader';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <GlobalLoader />;
  }

  return <>{children}</>;
};
