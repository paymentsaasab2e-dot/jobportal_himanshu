'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getStoredCandidateId } from '@/lib/auth-storage';
import { warmPortalSessionCaches } from '@/lib/portal-route-prefetch';

/**
 * Preloads commonly used portal APIs once per session so page switches feel instant.
 */
export function PortalNavigationWarmup() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    const candidateId = user?.id || getStoredCandidateId();
    if (!candidateId) return;
    warmPortalSessionCaches(candidateId);
  }, [isAuthenticated, user?.id]);

  return null;
}
