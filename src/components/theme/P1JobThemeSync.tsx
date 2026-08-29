'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { stripLocaleFromPathname } from '@/lib/i18n';

const THEME_CLASS = 'p1-job-theme';

function isLoginRoute(pathname: string): boolean {
  return (
    pathname === '/whatsapp' ||
    pathname.startsWith('/whatsapp/') ||
    pathname === '/login' ||
    pathname === '/signup'
  );
}

/**
 * After sign-in, apply the Create Job popup cyan/white palette across Phase 1.
 * Login and signup screens keep the original navy/sky/orange treatment.
 */
export function P1JobThemeSync() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const normalizedPath = stripLocaleFromPathname(pathname || '/');
  const applyTheme = isAuthenticated && !isLoginRoute(normalizedPath);

  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;
    root.classList.toggle(THEME_CLASS, applyTheme);
    body.classList.toggle(THEME_CLASS, applyTheme);
    return () => {
      root.classList.remove(THEME_CLASS);
      body.classList.remove(THEME_CLASS);
    };
  }, [applyTheme]);

  return null;
}
