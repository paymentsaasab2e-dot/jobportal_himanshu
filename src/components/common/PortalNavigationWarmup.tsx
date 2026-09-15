'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { getStoredCandidateId } from '@/lib/auth-storage';
import { warmPortalSessionCaches } from '@/lib/portal-route-prefetch';
import { stripLocaleFromPathname } from '@/lib/i18n';

/**
 * Preloads commonly used portal APIs once per session so page switches feel instant.
 */
export function PortalNavigationWarmup() {
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) return;
    const bare = stripLocaleFromPathname(pathname || '/');
    if (
      bare === '/uploadcv' ||
      bare.startsWith('/uploadcv/') ||
      bare === '/extract' ||
      bare.startsWith('/extract/')
    ) {
      return;
    }
    const candidateId = user?.id || getStoredCandidateId();
    if (!candidateId) return;
    warmPortalSessionCaches(candidateId);
  }, [isAuthenticated, user?.id, pathname]);

  return null;
}
