'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  getGossipIdentity,
  hydrateCommunityStateFromServer,
  loadCommunityState,
  pushCommunityStateNow,
} from '@/lib/community-store';
import { hydrateReferenceChecksFromServer } from '@/lib/reference-check-store';
import { flushOfficeGossipsPush } from '@/lib/office-gossips-sync';

/**
 * Pulls Office Gossips + Reference Check catalog from backend on login
 * so company pages / checks created on another device appear here.
 * Then pushes this device’s cache so creates from here reach the server.
 */
export function OfficeGossipsSyncHost() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const lastUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) return;
    if (lastUserRef.current === user.id) return;
    lastUserRef.current = user.id;

    let cancelled = false;
    (async () => {
      await hydrateCommunityStateFromServer();
      if (cancelled) return;
      await hydrateReferenceChecksFromServer();
      if (cancelled) return;

      // Upload this device’s data (incl. companies created before sync existed)
      await pushCommunityStateNow();
      if (cancelled) return;

      const identity = getGossipIdentity(user.id);
      let referenceChecks: unknown[] = [];
      try {
        const raw = localStorage.getItem('saasa:reference-checks-v2');
        if (raw) referenceChecks = JSON.parse(raw);
      } catch {
        /* ignore */
      }

      const state = loadCommunityState();
      await flushOfficeGossipsPush(() => ({
        ...(identity ? { identity } : {}),
        referenceChecks: Array.isArray(referenceChecks) ? referenceChecks : [],
        communities: state.communities,
        companyPages: state.companyPages.map((c) => ({
          ...c,
          documents: undefined,
        })),
        posts: state.posts,
        comments: state.comments,
      }));

      if (cancelled) return;
      window.dispatchEvent(new Event('saasa:office-gossips-hydrated'));
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, user?.id]);

  return null;
}
