/**
 * Company follows, people follow-requests, and free direct messaging.
 * Separate from reference-check (which spends tokens).
 *
 * Privacy rule: until a request is accepted, real names are never shown to the
 * other party — only username / "Anonymous". After accept, each side’s
 * anonymous choice (or global isAnonymous) controls whether their real name
 * is revealed in that chat / follow relationship.
 */

import { getGossipDisplayName, getGossipIdentity } from '@/lib/community-store';
import { recordCandidateNotification, notifyBellRefresh } from '@/lib/notifications';
import {
  mergeRowsById,
  pullOfficeGossipsBundle,
  scheduleOfficeGossipsPush,
} from '@/lib/office-gossips-sync';

export type FollowStatus = 'pending' | 'accepted' | 'rejected';

export type CompanyFollow = {
  id: string;
  companyPageId: string;
  companyName: string;
  followerId: string;
  followerName: string;
  anonymous: boolean;
  createdAt: string;
};

export type PeopleFollow = {
  id: string;
  fromUserId: string;
  fromName: string;
  fromRealName?: string;
  toUserId: string;
  toName: string;
  /** Sender chose (or was forced) to stay anonymous for this follow. */
  anonymous: boolean;
  status: FollowStatus;
  createdAt: string;
  updatedAt: string;
};

export type DmStatus = 'pending' | 'active' | 'rejected' | 'closed';

export type DmMediaType = 'image' | 'voice';

export type DmMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: DmMediaType;
};

export type DirectMessageThread = {
  id: string;
  companyPageId?: string;
  companyName?: string;
  fromUserId: string;
  /** Public label for sender (masked until accept / when anonymous). */
  fromName: string;
  fromRealName?: string;
  fromAnonymous: boolean;
  toUserId: string;
  toName: string;
  toRealName?: string;
  /** Receiver’s choice; defaults true until they accept. */
  toAnonymous: boolean;
  status: DmStatus;
  messages: DmMessage[];
  createdAt: string;
  updatedAt: string;
};

/** Masked public label — never a real name (for pending requests). */
export function privacyMaskedLabel(userId: string): string {
  const identity = getGossipIdentity(userId);
  if (identity?.username?.trim()) {
    const u = identity.username.trim();
    return u.startsWith('@') ? u : `@${u}`;
  }
  return 'Anonymous';
}

/**
 * Name shown after accept, based on stay-anonymous + global identity.
 * If already anonymous profile → always masked.
 */
export function resolveRevealedLabel(
  userId: string,
  realName: string,
  stayAnonymous: boolean,
): string {
  const identity = getGossipIdentity(userId);
  if (identity?.isAnonymous || stayAnonymous) {
    return privacyMaskedLabel(userId);
  }
  return realName.trim() || getGossipDisplayName(userId, privacyMaskedLabel(userId));
}

/** Peer label for a DM thread from the viewer’s perspective. */
export function getDmPeerLabel(thread: DirectMessageThread, viewerId: string): string {
  const iAmFrom = thread.fromUserId === viewerId;
  const peerId = iAmFrom ? thread.toUserId : thread.fromUserId;
  const peerAnon = iAmFrom ? thread.toAnonymous : thread.fromAnonymous;
  const peerReal = iAmFrom ? thread.toRealName : thread.fromRealName;
  const stored = iAmFrom ? thread.toName : thread.fromName;

  if (thread.status === 'pending') {
    return privacyMaskedLabel(peerId);
  }
  if (peerAnon) return privacyMaskedLabel(peerId);
  return peerReal || stored || privacyMaskedLabel(peerId);
}

/** Requester label for a follow request (masked while pending). */
export function getFollowRequesterLabel(follow: PeopleFollow): string {
  if (follow.status === 'pending') {
    return privacyMaskedLabel(follow.fromUserId);
  }
  if (follow.anonymous) return privacyMaskedLabel(follow.fromUserId);
  return follow.fromRealName || follow.fromName;
}

function effectiveAnonymousChoice(userId: string, wantAnonymous?: boolean): boolean {
  const identity = getGossipIdentity(userId);
  if (identity?.isAnonymous) return true;
  if (wantAnonymous === undefined) {
    return Boolean(identity?.followAnonymously);
  }
  return Boolean(wantAnonymous);
}

function normalizeDm(raw: DirectMessageThread): DirectMessageThread {
  return {
    ...raw,
    fromAnonymous: Boolean(raw.fromAnonymous),
    toAnonymous: raw.toAnonymous !== false,
    fromRealName: raw.fromRealName || raw.fromName,
    toRealName: raw.toRealName || raw.toName,
  };
}

function normalizeFollow(raw: PeopleFollow): PeopleFollow {
  return {
    ...raw,
    fromRealName: raw.fromRealName || raw.fromName,
    anonymous: Boolean(raw.anonymous),
  };
}

const STORAGE_KEY = 'saasa:office-social-v1';
export const SOCIAL_UPDATED_EVENT = 'saasa:social-updated';

type SocialState = {
  companyFollows: CompanyFollow[];
  peopleFollows: PeopleFollow[];
  dms: DirectMessageThread[];
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function empty(): SocialState {
  return { companyFollows: [], peopleFollows: [], dms: [] };
}

function emitSocialUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SOCIAL_UPDATED_EVENT));
}

function load(): SocialState {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<SocialState>;
    return {
      companyFollows: Array.isArray(parsed.companyFollows) ? parsed.companyFollows : [],
      peopleFollows: Array.isArray(parsed.peopleFollows)
        ? parsed.peopleFollows.map((f) => normalizeFollow(f as PeopleFollow))
        : [],
      dms: Array.isArray(parsed.dms)
        ? parsed.dms.map((d) => normalizeDm(d as DirectMessageThread))
        : [],
    };
  } catch {
    return empty();
  }
}

function save(state: SocialState, opts?: { skipSync?: boolean }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  emitSocialUpdated();
  if (!opts?.skipSync) {
    scheduleOfficeGossipsPush(() => ({ social: state }));
  }
}

export function getSocialState(): SocialState {
  return load();
}

export async function hydrateSocialFromServer(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const remote = await pullOfficeGossipsBundle();
  if (!remote?.social || typeof remote.social !== 'object') return false;
  const social = remote.social as Partial<SocialState>;
  const local = load();
  const mergedDms = mergeRowsById(
    local.dms,
    Array.isArray(social.dms)
      ? (social.dms as DirectMessageThread[]).map(normalizeDm)
      : [],
  ).map((row) => {
    const localRow = local.dms.find((d) => d.id === row.id);
    const remoteRow = Array.isArray(social.dms)
      ? (social.dms as DirectMessageThread[]).find((d) => d.id === row.id)
      : null;
    if (!localRow || !remoteRow) return normalizeDm(row);
    const msgMap = new Map<string, DmMessage>();
    for (const m of localRow.messages || []) msgMap.set(m.id, m);
    for (const m of remoteRow.messages || []) msgMap.set(m.id, m);
    return normalizeDm({
      ...row,
      messages: [...msgMap.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    });
  });
  const merged: SocialState = {
    companyFollows: mergeRowsById(
      local.companyFollows,
      Array.isArray(social.companyFollows) ? (social.companyFollows as CompanyFollow[]) : [],
    ),
    peopleFollows: mergeRowsById(
      local.peopleFollows,
      Array.isArray(social.peopleFollows)
        ? (social.peopleFollows as PeopleFollow[]).map(normalizeFollow)
        : [],
    ),
    dms: mergedDms,
  };
  save(merged, { skipSync: true });
  return true;
}

/** Soft pull while browsing Chat / Feed (Events-style live update). */
export async function softPullSocialFromServer(): Promise<boolean> {
  return hydrateSocialFromServer();
}

/* ─── Company follow (news / updates) ─── */

export function isFollowingCompany(companyPageId: string, userId: string): boolean {
  return load().companyFollows.some(
    (f) => f.companyPageId === companyPageId && f.followerId === userId,
  );
}

export function listFollowedCompanyIds(userId: string): string[] {
  return load()
    .companyFollows.filter((f) => f.followerId === userId)
    .map((f) => f.companyPageId);
}

export function followCompany(input: {
  companyPageId: string;
  companyName: string;
  followerId: string;
  followerName: string;
  anonymous?: boolean;
}): { ok: true; follow: CompanyFollow } | { ok: false; error: string } {
  if (!input.followerId) return { ok: false, error: 'Sign in required.' };
  const state = load();
  if (
    state.companyFollows.some(
      (f) => f.companyPageId === input.companyPageId && f.followerId === input.followerId,
    )
  ) {
    return { ok: false, error: 'Already following this company.' };
  }
  const follow: CompanyFollow = {
    id: uid('cf'),
    companyPageId: input.companyPageId,
    companyName: input.companyName,
    followerId: input.followerId,
    followerName: input.anonymous
      ? getGossipDisplayName(input.followerId, input.followerName)
      : input.followerName,
    anonymous: Boolean(input.anonymous),
    createdAt: new Date().toISOString(),
  };
  state.companyFollows.push(follow);
  save(state);
  return { ok: true, follow };
}

export function unfollowCompany(companyPageId: string, userId: string): boolean {
  const state = load();
  const next = state.companyFollows.filter(
    (f) => !(f.companyPageId === companyPageId && f.followerId === userId),
  );
  if (next.length === state.companyFollows.length) return false;
  state.companyFollows = next;
  save(state);
  return true;
}

export function companyFollowerCount(companyPageId: string): number {
  return load().companyFollows.filter((f) => f.companyPageId === companyPageId).length;
}

export function listCompanyFollowerIds(companyPageId: string): string[] {
  return load()
    .companyFollows.filter((f) => f.companyPageId === companyPageId)
    .map((f) => f.followerId);
}

/* ─── People follow (request → accept) ─── */

export function getPeopleFollowStatus(
  fromUserId: string,
  toUserId: string,
): PeopleFollow | null {
  return (
    load().peopleFollows.find(
      (f) =>
        f.fromUserId === fromUserId &&
        f.toUserId === toUserId &&
        (f.status === 'pending' || f.status === 'accepted'),
    ) || null
  );
}

export function requestPeopleFollow(input: {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  anonymous?: boolean;
}): { ok: true; follow: PeopleFollow } | { ok: false; error: string } {
  if (!input.fromUserId || !input.toUserId) return { ok: false, error: 'Sign in required.' };
  if (input.fromUserId === input.toUserId) {
    return { ok: false, error: 'You cannot follow yourself.' };
  }
  const target = getGossipIdentity(input.toUserId);
  // Demo users / legacy: allow follow if no identity or allowPeopleToFollow !== false
  if (target && target.allowPeopleToFollow === false) {
    return { ok: false, error: 'This person is not accepting follow requests.' };
  }
  const existing = getPeopleFollowStatus(input.fromUserId, input.toUserId);
  if (existing) {
    return {
      ok: false,
      error: existing.status === 'accepted' ? 'Already following.' : 'Follow request already sent.',
    };
  }

  const now = new Date().toISOString();
  const isDemoTarget = input.toUserId.startsWith('demo_ref_');
  const anon = effectiveAnonymousChoice(input.fromUserId, input.anonymous);
  const fromReal = input.fromName.trim() || `Member ${input.fromUserId.slice(-4)}`;
  const toReal =
    getGossipDisplayName(input.toUserId, `Member ${input.toUserId.slice(-4)}`) ||
    privacyMaskedLabel(input.toUserId);
  const follow: PeopleFollow = {
    id: uid('pf'),
    fromUserId: input.fromUserId,
    fromRealName: fromReal,
    // Pending: always masked. After accept (demo auto-accept): apply anonymity.
    fromName: isDemoTarget
      ? resolveRevealedLabel(input.fromUserId, fromReal, anon)
      : privacyMaskedLabel(input.fromUserId),
    toUserId: input.toUserId,
    toName: isDemoTarget
      ? resolveRevealedLabel(input.toUserId, toReal, false)
      : privacyMaskedLabel(input.toUserId),
    anonymous: anon,
    status: isDemoTarget ? 'accepted' : 'pending',
    createdAt: now,
    updatedAt: now,
  };
  const state = load();
  state.peopleFollows.push(follow);
  save(state);

  if (!isDemoTarget && follow.status === 'pending') {
    void recordCandidateNotification(input.toUserId, {
      type: 'system',
      title: 'New follow request',
      description: 'Someone wants to follow you on Office Gossips. Open Chat to accept or decline.',
      actionButton: 'Open chat',
      actionPath: '/community?tab=chat',
      metadata: {
        kind: 'people_follow_request',
        channel: 'alert',
        followId: follow.id,
        fromUserId: input.fromUserId,
      },
    });
    notifyBellRefresh();
  }

  return { ok: true, follow };
}

export function respondPeopleFollow(
  followId: string,
  toUserId: string,
  accept: boolean,
): { ok: true; follow: PeopleFollow } | { ok: false; error: string } {
  const state = load();
  const idx = state.peopleFollows.findIndex((f) => f.id === followId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = state.peopleFollows[idx];
  if (row.toUserId !== toUserId) return { ok: false, error: 'Not your request.' };
  if (row.status !== 'pending') return { ok: false, error: 'Already handled.' };

  if (!accept) {
    const updated: PeopleFollow = {
      ...row,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    };
    state.peopleFollows[idx] = updated;
    save(state);
    return { ok: true, follow: updated };
  }

  const fromReal = row.fromRealName || row.fromName;
  const updated: PeopleFollow = {
    ...row,
    fromName: resolveRevealedLabel(row.fromUserId, fromReal, row.anonymous),
    status: 'accepted',
    updatedAt: new Date().toISOString(),
  };
  state.peopleFollows[idx] = updated;
  save(state);

  void recordCandidateNotification(row.fromUserId, {
    type: 'system',
    title: 'Follow request accepted',
    description: 'Your follow request was accepted. You can stay connected on Office Gossips.',
    actionButton: 'Open chat',
    actionPath: '/community?tab=chat',
    metadata: {
      kind: 'people_follow_accepted',
      channel: 'alert',
      followId: updated.id,
      toUserId,
    },
  });

  return { ok: true, follow: updated };
}

export function listIncomingPeopleFollows(userId: string): PeopleFollow[] {
  return load()
    .peopleFollows.filter((f) => f.toUserId === userId && f.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAcceptedFollowsForUser(userId: string): PeopleFollow[] {
  return load().peopleFollows.filter(
    (f) =>
      f.status === 'accepted' && (f.fromUserId === userId || f.toUserId === userId),
  );
}

/* ─── Direct messaging (no tokens) ─── */

export function listDmThreadsForUser(userId: string): DirectMessageThread[] {
  return load()
    .dms.filter((d) => d.fromUserId === userId || d.toUserId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDmThread(id: string): DirectMessageThread | null {
  return load().dms.find((d) => d.id === id) || null;
}

export function requestDirectMessage(input: {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  companyPageId?: string;
  companyName?: string;
  /** Stay anonymous in this chat (forced if profile is already anonymous). */
  anonymous?: boolean;
}): { ok: true; thread: DirectMessageThread } | { ok: false; error: string } {
  if (!input.fromUserId || !input.toUserId) return { ok: false, error: 'Sign in required.' };
  if (input.fromUserId === input.toUserId) {
    return { ok: false, error: 'You cannot message yourself.' };
  }

  const state = load();
  const open = state.dms.find(
    (d) =>
      ((d.fromUserId === input.fromUserId && d.toUserId === input.toUserId) ||
        (d.fromUserId === input.toUserId && d.toUserId === input.fromUserId)) &&
      (d.status === 'pending' || d.status === 'active'),
  );
  if (open) {
    return { ok: true, thread: open };
  }

  const now = new Date().toISOString();
  const fromAnon = effectiveAnonymousChoice(input.fromUserId, input.anonymous);
  const fromReal = input.fromName.trim() || `Member ${input.fromUserId.slice(-4)}`;
  const toReal =
    getGossipDisplayName(input.toUserId, `Member ${input.toUserId.slice(-4)}`) ||
    privacyMaskedLabel(input.toUserId);
  const isDemoTarget = input.toUserId.startsWith('demo_ref_');
  const fromPublic = isDemoTarget
    ? resolveRevealedLabel(input.fromUserId, fromReal, fromAnon)
    : privacyMaskedLabel(input.fromUserId);
  const toPublic = isDemoTarget
    ? resolveRevealedLabel(input.toUserId, toReal, false)
    : privacyMaskedLabel(input.toUserId);

  const thread: DirectMessageThread = {
    id: uid('dm'),
    companyPageId: input.companyPageId,
    companyName: input.companyName,
    fromUserId: input.fromUserId,
    fromName: fromPublic,
    fromRealName: fromReal,
    fromAnonymous: fromAnon,
    toUserId: input.toUserId,
    toName: toPublic,
    toRealName: toReal,
    toAnonymous: true,
    status: isDemoTarget ? 'active' : 'pending',
    messages: [
      {
        id: uid('dmm'),
        senderId: input.fromUserId,
        text: fromAnon
          ? "Hi — I'd like to connect via message (anonymous request)."
          : "Hi — I'd like to connect via message.",
        createdAt: now,
      },
      ...(isDemoTarget
        ? [
            {
              id: uid('dmm'),
              senderId: input.toUserId,
              text: 'Sure — happy to chat.',
              createdAt: new Date(Date.now() + 1).toISOString(),
            },
          ]
        : []),
    ],
    createdAt: now,
    updatedAt: now,
  };
  state.dms.push(thread);
  save(state);

  if (!isDemoTarget && thread.status === 'pending') {
    void recordCandidateNotification(input.toUserId, {
      type: 'system',
      title: 'New message request',
      description: 'Someone wants to message you on Office Gossips. Open Chat to accept or decline.',
      actionButton: 'Open chat',
      actionPath: '/community?tab=chat',
      metadata: {
        kind: 'dm_request',
        channel: 'alert',
        threadId: thread.id,
        fromUserId: input.fromUserId,
      },
    });
    notifyBellRefresh();
  }

  return { ok: true, thread };
}

export function respondDirectMessage(
  threadId: string,
  userId: string,
  accept: boolean,
  options?: { anonymous?: boolean; realName?: string },
): { ok: true; thread: DirectMessageThread } | { ok: false; error: string } {
  const state = load();
  const idx = state.dms.findIndex((d) => d.id === threadId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = normalizeDm(state.dms[idx]);
  if (row.toUserId !== userId) return { ok: false, error: 'Not your request.' };
  if (row.status !== 'pending') return { ok: false, error: 'Already handled.' };

  const now = new Date().toISOString();
  if (!accept) {
    state.dms[idx] = { ...row, status: 'rejected', updatedAt: now };
    save(state);
    return { ok: true, thread: state.dms[idx] };
  }

  const toAnon = effectiveAnonymousChoice(userId, options?.anonymous);
  const toReal =
    options?.realName?.trim() ||
    row.toRealName ||
    getGossipDisplayName(userId, `Member ${userId.slice(-4)}`);
  const fromReal = row.fromRealName || row.fromName;

  const reply: DmMessage = {
    id: uid('dmm'),
    senderId: userId,
    text: toAnon
      ? 'Accepted — we can chat now (I’ll stay anonymous).'
      : 'Accepted — we can chat now.',
    createdAt: now,
  };
  state.dms[idx] = {
    ...row,
    fromName: resolveRevealedLabel(row.fromUserId, fromReal, row.fromAnonymous),
    toName: resolveRevealedLabel(userId, toReal, toAnon),
    toRealName: toReal,
    toAnonymous: toAnon,
    status: 'active',
    messages: [...row.messages, reply],
    updatedAt: now,
  };
  save(state);

  void recordCandidateNotification(row.fromUserId, {
    type: 'system',
    title: 'Message request accepted',
    description: 'Your message request was accepted. Chat is open now.',
    actionButton: 'Open chat',
    actionPath: '/community?tab=chat',
    metadata: {
      kind: 'dm_accepted',
      channel: 'alert',
      threadId: state.dms[idx].id,
      toUserId: userId,
    },
  });

  return { ok: true, thread: state.dms[idx] };
}

export function sendDirectMessage(
  threadId: string,
  senderId: string,
  text: string,
  options?: { mediaUrl?: string; mediaType?: DmMediaType },
): { ok: true; thread: DirectMessageThread } | { ok: false; error: string } {
  const trimmed = text.trim();
  const mediaUrl = options?.mediaUrl?.trim() || undefined;
  const mediaType = mediaUrl ? options?.mediaType : undefined;
  if (!trimmed && !mediaUrl) return { ok: false, error: 'Message cannot be empty.' };
  const state = load();
  const idx = state.dms.findIndex((d) => d.id === threadId);
  if (idx < 0) return { ok: false, error: 'Chat not found.' };
  const row = state.dms[idx];
  if (row.status !== 'active') return { ok: false, error: 'Chat is not active yet.' };
  if (senderId !== row.fromUserId && senderId !== row.toUserId) {
    return { ok: false, error: 'Not a participant.' };
  }
  const msg: DmMessage = {
    id: uid('dmm'),
    senderId,
    text: (trimmed || (mediaType === 'voice' ? 'Voice note' : mediaType === 'image' ? 'Image' : '')).slice(
      0,
      2000,
    ),
    createdAt: new Date().toISOString(),
    mediaUrl,
    mediaType,
  };
  state.dms[idx] = {
    ...row,
    messages: [...row.messages, msg],
    updatedAt: msg.createdAt,
  };
  save(state);

  const peerId = senderId === row.fromUserId ? row.toUserId : row.fromUserId;
  if (peerId && !peerId.startsWith('demo_ref_')) {
    const preview = (msg.text || '').slice(0, 120) || 'New message';
    void recordCandidateNotification(peerId, {
      type: 'system',
      title: 'New message',
      description: preview,
      actionButton: 'Open chat',
      actionPath: '/community?tab=chat',
      metadata: {
        kind: 'dm_message',
        channel: 'alert',
        threadId: row.id,
        fromUserId: senderId,
      },
    });
  }

  return { ok: true, thread: state.dms[idx] };
}

export function pendingDmIncomingCount(userId: string): number {
  return load().dms.filter((d) => d.toUserId === userId && d.status === 'pending').length;
}

export function pendingFollowIncomingCount(userId: string): number {
  return listIncomingPeopleFollows(userId).length;
}
