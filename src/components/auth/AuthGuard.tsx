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
    normalizedPathname === '/faq' ||
    normalizedPathname.startsWith('/faq/') ||
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
    normalizedPathname.startsWith('/sa/') ||
    normalizedPathname === '/candmain' ||
    normalizedPathname.startsWith('/candmain/');

  // CV upload / extract: never block with GlobalLoader (felt like a hung page).
  // Also never return null — that left /extract blank while Earn/Profile floats still showed.
  const isCvOnboardingRoute =
    normalizedPathname === '/uploadcv' ||
    normalizedPathname.startsWith('/uploadcv/') ||
    normalizedPathname === '/extract' ||
    normalizedPathname.startsWith('/extract/');

  if (isLoading) {
    if (isCvOnboardingRoute || isPublicRoute) {
      return <>{children}</>;
    }
    return <GlobalLoader />;
  }

  return <>{children}</>;
};
