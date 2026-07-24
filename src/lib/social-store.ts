/**
 * Company follows, people follow-requests, and free direct messaging.
 * Separate from reference-check (which spends tokens).
 */

import { getGossipDisplayName, getGossipIdentity } from '@/lib/community-store';

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
  toUserId: string;
  toName: string;
  anonymous: boolean;
  status: FollowStatus;
  createdAt: string;
  updatedAt: string;
};

export type DmStatus = 'pending' | 'active' | 'rejected' | 'closed';

export type DmMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type DirectMessageThread = {
  id: string;
  companyPageId?: string;
  companyName?: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  status: DmStatus;
  messages: DmMessage[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'saasa:office-social-v1';

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

function load(): SocialState {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<SocialState>;
    return {
      companyFollows: Array.isArray(parsed.companyFollows) ? parsed.companyFollows : [],
      peopleFollows: Array.isArray(parsed.peopleFollows) ? parsed.peopleFollows : [],
      dms: Array.isArray(parsed.dms) ? parsed.dms : [],
    };
  } catch {
    return empty();
  }
}

function save(state: SocialState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ─── Company follow (news / updates) ─── */

export function isFollowingCompany(companyPageId: string, userId: string): boolean {
  return load().companyFollows.some(
    (f) => f.companyPageId === companyPageId && f.followerId === userId,
  );
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
  const follow: PeopleFollow = {
    id: uid('pf'),
    fromUserId: input.fromUserId,
    fromName: input.anonymous
      ? getGossipDisplayName(input.fromUserId, input.fromName)
      : input.fromName,
    toUserId: input.toUserId,
    toName: getGossipDisplayName(input.toUserId, `Member ${input.toUserId.slice(-4)}`),
    anonymous: Boolean(input.anonymous),
    status: isDemoTarget ? 'accepted' : 'pending',
    createdAt: now,
    updatedAt: now,
  };
  const state = load();
  state.peopleFollows.push(follow);
  save(state);
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
  const updated: PeopleFollow = {
    ...row,
    status: accept ? 'accepted' : 'rejected',
    updatedAt: new Date().toISOString(),
  };
  state.peopleFollows[idx] = updated;
  save(state);
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
  const toName = getGossipDisplayName(input.toUserId, `Member ${input.toUserId.slice(-4)}`);
  const isDemoTarget = input.toUserId.startsWith('demo_ref_');
  const thread: DirectMessageThread = {
    id: uid('dm'),
    companyPageId: input.companyPageId,
    companyName: input.companyName,
    fromUserId: input.fromUserId,
    fromName: input.fromName,
    toUserId: input.toUserId,
    toName,
    status: isDemoTarget ? 'active' : 'pending',
    messages: [
      {
        id: uid('dmm'),
        senderId: input.fromUserId,
        text: `Hi ${toName} — I'd like to connect via message.`,
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
  return { ok: true, thread };
}

export function respondDirectMessage(
  threadId: string,
  userId: string,
  accept: boolean,
): { ok: true; thread: DirectMessageThread } | { ok: false; error: string } {
  const state = load();
  const idx = state.dms.findIndex((d) => d.id === threadId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = state.dms[idx];
  if (row.toUserId !== userId) return { ok: false, error: 'Not your request.' };
  if (row.status !== 'pending') return { ok: false, error: 'Already handled.' };

  const now = new Date().toISOString();
  if (!accept) {
    state.dms[idx] = { ...row, status: 'rejected', updatedAt: now };
    save(state);
    return { ok: true, thread: state.dms[idx] };
  }

  const reply: DmMessage = {
    id: uid('dmm'),
    senderId: userId,
    text: 'Accepted — we can chat now.',
    createdAt: now,
  };
  state.dms[idx] = {
    ...row,
    status: 'active',
    messages: [...row.messages, reply],
    updatedAt: now,
  };
  save(state);
  return { ok: true, thread: state.dms[idx] };
}

export function sendDirectMessage(
  threadId: string,
  senderId: string,
  text: string,
): { ok: true; thread: DirectMessageThread } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };
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
    text: trimmed.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  state.dms[idx] = {
    ...row,
    messages: [...row.messages, msg],
    updatedAt: msg.createdAt,
  };
  save(state);
  return { ok: true, thread: state.dms[idx] };
}

export function pendingDmIncomingCount(userId: string): number {
  return load().dms.filter((d) => d.toUserId === userId && d.status === 'pending').length;
}

export function pendingFollowIncomingCount(userId: string): number {
  return listIncomingPeopleFollows(userId).length;
}
