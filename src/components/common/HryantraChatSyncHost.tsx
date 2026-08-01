'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { API_BASE_URL } from '@/lib/api-base';
import {
  ensureHryantraVerifiedChat,
  ingestRemoteHryantraMessage,
  installHryantraHqChatListener,
} from '@/lib/hryantra-verified-chat-store';
import { notifyBellRefresh } from '@/lib/notifications';

const SYNC_KEY = (userId: string) => `saasa:hry-hq-sync-since:${userId}`;

/**
 * Global host: installs HQ browser listener + polls backend HQ chat for
 * new HRYantra messages so FAB badge and bell stay in sync.
 */
export function HryantraChatSyncHost() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || null;

  useEffect(() => {
    return installHryantraHqChatListener();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    ensureHryantraVerifiedChat(userId);

    let cancelled = false;

    const sync = async () => {
      try {
        let since = '';
        try {
          since = localStorage.getItem(SYNC_KEY(userId)) || '';
        } catch {
          since = '';
        }
        // First run: set baseline so we don't replay historical HQ messages as "new"
        if (!since) {
          const baseline = new Date().toISOString();
          try {
            localStorage.setItem(SYNC_KEY(userId), baseline);
          } catch {
            /* ignore */
          }
          return;
        }
        const qs = `?since=${encodeURIComponent(since)}`;
        const res = await fetch(
          `${API_BASE_URL}/hq-chat/users/${encodeURIComponent(userId)}/pending${qs}`,
          { cache: 'no-store' },
        );
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success || cancelled) return;

        const messages = Array.isArray(json.data?.messages) ? json.data.messages : [];
        let newest = since;
        let addedAny = false;
        for (const m of messages) {
          const text = String(m?.text || '').trim();
          if (!text) continue;
          const result = ingestRemoteHryantraMessage({
            userId,
            id: m.id,
            text,
            createdAt: m.createdAt,
            actionUrl: m.actionUrl || undefined,
            hqMeta: m.hqMeta || { source: 'hq-chat-api' },
            markUnread: true,
          });
          if (result.ok && result.added) {
            addedAny = true;
            // FloatingAlertsHost shows the stacked alert with “Open chat” —
            // skip info toast so cards don’t overlap the same message.
          }
          if (m.createdAt && (!newest || String(m.createdAt) > newest)) {
            newest = m.createdAt;
          }
        }
        if (newest) {
          try {
            localStorage.setItem(SYNC_KEY(userId), newest);
          } catch {
            /* ignore */
          }
        }
        if (addedAny) notifyBellRefresh();
      } catch {
        /* sync is best-effort */
      }
    };

    void sync();
    const id = window.setInterval(() => void sync(), 20_000);
    const onFocus = () => void sync();
    window.addEventListener('focus', onFocus);

    const onRead = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: string; unreadCount?: number }>).detail;
      if (detail?.userId && detail.userId !== userId) return;
      if (detail?.unreadCount === 0) {
        void fetch(
          `${API_BASE_URL}/hq-chat/users/${encodeURIComponent(userId)}/mark-read`,
          { method: 'POST' },
        ).catch(() => {});
      }
    };
    window.addEventListener('saasa:hryantra-chat-updated', onRead as EventListener);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('saasa:hryantra-chat-updated', onRead as EventListener);
    };
  }, [isAuthenticated, userId]);

  return null;
}
