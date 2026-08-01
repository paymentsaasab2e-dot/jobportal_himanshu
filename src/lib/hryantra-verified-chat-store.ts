/**
 * HRYantra Verified Chat — official system channel in the user's Chat inbox.
 *
 * Always present (no accept request). HQ can push welcome / suggestions /
 * notifications via `pushHryantraVerifiedMessage`, browser event
 * `saasa:hryantra-hq-chat`, or backend `POST /api/hq-chat/users/:userId/messages`.
 */

import { recordCandidateNotification, notifyBellRefresh } from '@/lib/notifications';

export const HRYANTRA_SYSTEM_SENDER_ID = 'hryantra_verified';
export const HRYANTRA_CHAT_ID_PREFIX = 'hry_verified_';

export type HryantraChatMediaType = 'image' | 'voice';

export type HryantraVerifiedMessage = {
  id: string;
  /** Always system for HQ pushes; user replies use their userId. */
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: HryantraChatMediaType;
  /** Optional deep-link / action for HQ payloads. */
  actionUrl?: string;
  /** HQ metadata reserved for future integration. */
  hqMeta?: Record<string, unknown>;
};

export type HryantraVerifiedThread = {
  id: string;
  userId: string;
  title: string;
  verified: true;
  unreadCount: number;
  messages: HryantraVerifiedMessage[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'saasa:hryantra-verified-chat-v1';

/** Custom event HQ / other modules can dispatch to push into this chat. */
export const HRYANTRA_HQ_CHAT_EVENT = 'saasa:hryantra-hq-chat';

export type HryantraHqChatDetail = {
  userId: string;
  text: string;
  actionUrl?: string;
  hqMeta?: Record<string, unknown>;
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function threadIdForUser(userId: string) {
  return `${HRYANTRA_CHAT_ID_PREFIX}${userId}`;
}

function loadMap(): Record<string, HryantraVerifiedThread> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, HryantraVerifiedThread>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, HryantraVerifiedThread>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function welcomeMessage(): HryantraVerifiedMessage {
  return {
    id: uid('hrym'),
    senderId: HRYANTRA_SYSTEM_SENDER_ID,
    text:
      'Welcome to HRYantra Verified Chat. Official tips, suggestions, and updates from HQ will show up here — no request needed.',
    createdAt: new Date().toISOString(),
  };
}

/** Ensure the verified thread exists for this user (idempotent). */
export function ensureHryantraVerifiedChat(userId: string): HryantraVerifiedThread | null {
  if (!userId) return null;
  const map = loadMap();
  const id = threadIdForUser(userId);
  const existing = map[id];
  if (existing) return existing;

  const now = new Date().toISOString();
  const thread: HryantraVerifiedThread = {
    id,
    userId,
    title: 'HRYantra',
    verified: true,
    unreadCount: 1,
    messages: [welcomeMessage()],
    createdAt: now,
    updatedAt: now,
  };
  map[id] = thread;
  saveMap(map);
  return thread;
}

export function getHryantraVerifiedChat(userId: string): HryantraVerifiedThread | null {
  if (!userId) return null;
  const map = loadMap();
  return map[threadIdForUser(userId)] || ensureHryantraVerifiedChat(userId);
}

export function getHryantraVerifiedChatById(chatId: string): HryantraVerifiedThread | null {
  if (!chatId?.startsWith(HRYANTRA_CHAT_ID_PREFIX)) return null;
  const map = loadMap();
  return map[chatId] || null;
}

export function isHryantraVerifiedChatId(chatId: string | null | undefined): boolean {
  return Boolean(chatId?.startsWith(HRYANTRA_CHAT_ID_PREFIX));
}

/**
 * HQ / platform push into a user's verified chat.
 * Keep this as the integration point for HQ later.
 */
export function pushHryantraVerifiedMessage(input: {
  userId: string;
  text: string;
  actionUrl?: string;
  hqMeta?: Record<string, unknown>;
  markUnread?: boolean;
  /** Override bell notification copy (defaults to HRYantra chat). */
  notificationTitle?: string;
  notificationDescription?: string;
  notificationActionButton?: string;
  notificationActionPath?: string;
}): { ok: true; thread: HryantraVerifiedThread } | { ok: false; error: string } {
  const text = input.text?.trim();
  if (!input.userId) return { ok: false, error: 'userId required.' };
  if (!text) return { ok: false, error: 'Message cannot be empty.' };

  const thread = ensureHryantraVerifiedChat(input.userId);
  if (!thread) return { ok: false, error: 'Could not open verified chat.' };

  const msg: HryantraVerifiedMessage = {
    id: uid('hrym'),
    senderId: HRYANTRA_SYSTEM_SENDER_ID,
    text: text.slice(0, 4000),
    createdAt: new Date().toISOString(),
    actionUrl: input.actionUrl,
    hqMeta: input.hqMeta,
  };

  const map = loadMap();
  const next: HryantraVerifiedThread = {
    ...thread,
    messages: [...thread.messages, msg],
    updatedAt: msg.createdAt,
    unreadCount: (thread.unreadCount || 0) + (input.markUnread === false ? 0 : 1),
  };
  map[thread.id] = next;
  saveMap(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('saasa:hryantra-chat-updated', {
        detail: {
          chatId: next.id,
          userId: input.userId,
          unreadCount: next.unreadCount,
          messageId: msg.id,
          lastMessagePreview: msg.text.slice(0, 120),
          fromSystem: true,
          notificationTitle: input.notificationTitle || 'New message from HRYantra',
          notificationActionButton: input.notificationActionButton || 'Open chat',
          notificationActionPath: input.notificationActionPath || '/community',
        },
      }),
    );

    if (input.markUnread !== false) {
      void recordCandidateNotification(input.userId, {
        type: 'system',
        title: input.notificationTitle || 'New message from HRYantra',
        description: (input.notificationDescription || msg.text).slice(0, 180),
        actionButton: input.notificationActionButton || 'Open chat',
        actionPath: input.notificationActionPath || '/community',
        metadata: {
          kind: input.hqMeta?.kind || 'hryantra_chat',
          channel: 'alert',
          chatId: next.id,
          messageId: msg.id,
          actionUrl: input.actionUrl || null,
          ...(input.hqMeta || {}),
        },
      });
    }
  }

  return { ok: true, thread: next };
}

/** User reply inside verified chat (optional — keeps thread conversational). */
export function sendHryantraVerifiedUserMessage(
  userId: string,
  text: string,
  options?: { mediaUrl?: string; mediaType?: HryantraChatMediaType },
): { ok: true; thread: HryantraVerifiedThread } | { ok: false; error: string } {
  const trimmed = text.trim();
  const mediaUrl = options?.mediaUrl?.trim() || undefined;
  const mediaType = mediaUrl ? options?.mediaType : undefined;
  if (!userId) return { ok: false, error: 'Sign in required.' };
  if (!trimmed && !mediaUrl) return { ok: false, error: 'Message cannot be empty.' };

  const thread = ensureHryantraVerifiedChat(userId);
  if (!thread) return { ok: false, error: 'Chat not found.' };

  const msg: HryantraVerifiedMessage = {
    id: uid('hrym'),
    senderId: userId,
    text: (trimmed || (mediaType === 'voice' ? 'Voice note' : mediaType === 'image' ? 'Image' : '')).slice(
      0,
      2000,
    ),
    createdAt: new Date().toISOString(),
    mediaUrl,
    mediaType,
  };

  const map = loadMap();
  const next: HryantraVerifiedThread = {
    ...thread,
    messages: [...thread.messages, msg],
    updatedAt: msg.createdAt,
  };
  map[thread.id] = next;
  saveMap(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('saasa:hryantra-chat-updated', {
        detail: {
          chatId: next.id,
          userId,
          unreadCount: next.unreadCount || 0,
          lastMessagePreview: msg.text.slice(0, 120),
          fromSystem: false,
        },
      }),
    );
  }

  void syncUserReplyToHq(userId, msg);

  return { ok: true, thread: next };
}

async function syncUserReplyToHq(
  userId: string,
  msg: HryantraVerifiedMessage,
): Promise<void> {
  try {
    const { API_BASE_URL } = await import('@/lib/api-base');
    await fetch(`${API_BASE_URL}/hq-chat/users/${encodeURIComponent(userId)}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: msg.text,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        clientMessageId: msg.id,
      }),
    });
  } catch {
    /* HQ sync is best-effort */
  }
}

/** Merge a server/HQ message into local thread without double-counting unread when id exists. */
export function ingestRemoteHryantraMessage(input: {
  userId: string;
  id?: string;
  text: string;
  createdAt?: string;
  actionUrl?: string;
  hqMeta?: Record<string, unknown>;
  markUnread?: boolean;
}): { ok: true; added: boolean; thread: HryantraVerifiedThread } | { ok: false; error: string } {
  if (!input.userId || !input.text?.trim()) {
    return { ok: false, error: 'userId and text required' };
  }
  const thread = ensureHryantraVerifiedChat(input.userId);
  if (!thread) return { ok: false, error: 'Could not open chat' };

  if (input.id && thread.messages.some((m) => m.id === input.id)) {
    return { ok: true, added: false, thread };
  }

  const msg: HryantraVerifiedMessage = {
    id: input.id || uid('hrym'),
    senderId: HRYANTRA_SYSTEM_SENDER_ID,
    text: input.text.trim().slice(0, 4000),
    createdAt: input.createdAt || new Date().toISOString(),
    actionUrl: input.actionUrl,
    hqMeta: input.hqMeta,
  };

  const map = loadMap();
  const markUnread = input.markUnread !== false;
  const next: HryantraVerifiedThread = {
    ...thread,
    messages: [...thread.messages, msg],
    updatedAt: msg.createdAt,
    unreadCount: markUnread ? (thread.unreadCount || 0) + 1 : thread.unreadCount || 0,
  };
  map[thread.id] = next;
  saveMap(map);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('saasa:hryantra-chat-updated', {
        detail: {
          chatId: next.id,
          userId: input.userId,
          unreadCount: next.unreadCount,
          messageId: msg.id,
          lastMessagePreview: msg.text.slice(0, 120),
          fromSystem: true,
          notificationTitle: 'New message from HRYantra',
          notificationActionButton: 'Open chat',
          notificationActionPath: '/community',
        },
      }),
    );
    if (markUnread) {
      notifyBellRefresh();
    }
  }

  return { ok: true, added: true, thread: next };
}

export function markHryantraVerifiedChatRead(userId: string): void {
  const thread = getHryantraVerifiedChat(userId);
  if (!thread || thread.unreadCount === 0) return;
  const map = loadMap();
  map[thread.id] = { ...thread, unreadCount: 0 };
  saveMap(map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('saasa:hryantra-chat-updated', {
        detail: {
          chatId: thread.id,
          userId,
          unreadCount: 0,
          fromSystem: false,
        },
      }),
    );
  }
}

/**
 * Browser event bridge for HQ later:
 *   window.dispatchEvent(new CustomEvent('saasa:hryantra-hq-chat', { detail: { userId, text } }))
 */
export function installHryantraHqChatListener(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onHq = (event: Event) => {
    const detail = (event as CustomEvent<HryantraHqChatDetail>).detail;
    if (!detail?.userId || !detail?.text) return;
    pushHryantraVerifiedMessage({
      userId: detail.userId,
      text: detail.text,
      actionUrl: detail.actionUrl,
      hqMeta: detail.hqMeta,
    });
  };
  window.addEventListener(HRYANTRA_HQ_CHAT_EVENT, onHq);
  return () => window.removeEventListener(HRYANTRA_HQ_CHAT_EVENT, onHq);
}

/** Helper for other UI (notifications / suggestions) to open Chat → verified thread. */
export function openHryantraVerifiedChatInApp(userId: string): string | null {
  const thread = ensureHryantraVerifiedChat(userId);
  if (!thread) return null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('saasa:open-hryantra-chat', thread.id);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(
      new CustomEvent('saasa:open-hryantra-chat', {
        detail: { chatId: thread.id, userId },
      }),
    );
  }
  return thread.id;
}
