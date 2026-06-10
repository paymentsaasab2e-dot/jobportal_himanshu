'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { GlobalLoader } from './GlobalLoader';
import { usePathname } from 'next/navigation';
import { stripLocaleFromPathname } from '@/lib/i18n';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuth();
  const pathname = usePathname();
  const normalizedPathname = stripLocaleFromPathname(pathname || '/');
  const isPublicRoute =
    normalizedPathname === '/' ||
    normalizedPathname === '/whatsapp' ||
    normalizedPathname.startsWith('/whatsapp/') ||
    normalizedPathname === '/login' ||
    normalizedPathname === '/signup' ||
    normalizedPathname === '/privacypolicy' ||
    normalizedPathname.startsWith('/privacypolicy/') ||
    normalizedPathname === '/terms' ||
    normalizedPathname.startsWith('/terms/') ||
    normalizedPathname === '/trust-safety' ||
    normalizedPathname.startsWith('/trust-safety/') ||
    normalizedPathname === '/help' ||
    normalizedPathname.startsWith('/help/') ||
    normalizedPathname === '/services' ||
    normalizedPathname.startsWith('/services/') ||
    normalizedPathname === '/employers' ||
    normalizedPathname.startsWith('/employers/') ||
    normalizedPathname === '/aicveditor' ||
    normalizedPathname.startsWith('/aicveditor/') ||
    normalizedPathname === '/apply' ||
    normalizedPathname.startsWith('/apply/') ||
    normalizedPathname === '/searchjobs' ||
    normalizedPathname.startsWith('/searchjobs/') ||
    normalizedPathname === '/ats-check' ||
    normalizedPathname.startsWith('/ats-check/') ||
    normalizedPathname === '/courses' ||
    normalizedPathname.startsWith('/courses/') ||
    normalizedPathname === '/explore-jobs' ||
    normalizedPathname.startsWith('/explore-jobs/') ||
    normalizedPathname === '/aboutus' ||
    normalizedPathname.startsWith('/aboutus/') ||
    normalizedPathname === '/contact' ||
    normalizedPathname.startsWith('/contact/') ||
    normalizedPathname === '/sa' ||
    normalizedPathname.startsWith('/sa/');

  if (isLoading) {
    if (pathname === '/extract' || pathname?.startsWith('/extract/')) {
      return null;
    }
    // Keep public pages usable even when auth/session refresh is still pending.
    if (isPublicRoute) {
      return <>{children}</>;
    }
    return <GlobalLoader />;
  }

  return <>{children}</>;
};
