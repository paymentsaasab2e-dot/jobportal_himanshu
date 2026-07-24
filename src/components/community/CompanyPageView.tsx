'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Globe2,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';
import {
  DEMO_REFERENCE_PEOPLE,
  getCommentsForPost,
  getGossipDisplayName,
  getGossipIdentity,
  getVisibleCompanyMemberIds,
  listOpenForReferenceOnCompany,
  type CommunityPost,
  type CompanyPage,
} from '@/lib/community-store';
import {
  listReferenceChecksForUser,
  requestReferenceCheck,
} from '@/lib/reference-check-store';
import { isUserOnline } from '@/lib/presence';
import {
  companyFollowerCount,
  followCompany,
  getPeopleFollowStatus,
  isFollowingCompany,
  requestDirectMessage,
  requestPeopleFollow,
  unfollowCompany,
} from '@/lib/social-store';

type Tab = 'posts' | 'people' | 'references';

type Props = {
  company: CompanyPage;
  userId: string;
  authorName: string;
  posts: CommunityPost[];
  isConnected: boolean;
  canConnect: boolean;
  onBack: () => void;
  onConnect: () => void;
  onRefresh?: () => void;
  onOpenChat?: (kind: ChatKind, id: string) => void;
  onOpenProfile?: (userId: string) => void;
  renderPost?: (post: CommunityPost) => ReactNode;
};

export function CompanyPageView({
  company,
  userId,
  authorName,
  posts,
  isConnected,
  canConnect,
  onBack,
  onConnect,
  onRefresh,
  onOpenChat,
  onOpenProfile,
  renderPost,
}: Props) {
  const [tab, setTab] = useState<Tab>('posts');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const openCount = listOpenForReferenceOnCompany(company.id).length;
    setTab(openCount > 0 ? 'references' : 'posts');
  }, [company.id]);

  const refreshLocal = () => {
    setTick((n) => n + 1);
    onRefresh?.();
  };

  const identity = getGossipIdentity(userId);
  const followAnon = Boolean(identity?.followAnonymously);

  const followingCompany = useMemo(
    () => isFollowingCompany(company.id, userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company.id, userId, tick],
  );
  const followerCount = useMemo(
    () => companyFollowerCount(company.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company.id, tick],
  );

  const connections = useMemo(
    () => getVisibleCompanyMemberIds(company.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company.id, company.memberIds, tick],
  );
  const openForRef = useMemo(
    () => listOpenForReferenceOnCompany(company.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company.id, tick],
  );
  const companyPosts = useMemo(
    () => posts.filter((p) => p.companyPageId === company.id),
    [posts, company.id],
  );

  const myChecks = useMemo(
    () =>
      listReferenceChecksForUser(userId).filter((r) => r.companyPageId === company.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, company.id, tick],
  );

  const roleFor = (userIdKey: string) =>
    DEMO_REFERENCE_PEOPLE.find((d) => d.userId === userIdKey)?.role;

  const handleFollowCompany = () => {
    if (followingCompany) {
      unfollowCompany(company.id, userId);
      showSuccessToast('Unfollowed', company.name);
      refreshLocal();
      return;
    }
    const result = followCompany({
      companyPageId: company.id,
      companyName: company.name,
      followerId: userId,
      followerName: authorName,
      anonymous: followAnon,
    });
    if (!result.ok) {
      showErrorToast('Follow', result.error);
      return;
    }
    showSuccessToast('Following', `You'll see updates from ${company.name}.`);
    refreshLocal();
  };

  const handleFollowPerson = (toUserId: string) => {
    const result = requestPeopleFollow({
      fromUserId: userId,
      fromName: authorName,
      toUserId,
      anonymous: followAnon,
    });
    if (!result.ok) {
      showErrorToast('Follow', result.error);
      return;
    }
    showSuccessToast(
      result.follow.status === 'accepted' ? 'Following' : 'Request sent',
      result.follow.status === 'accepted'
        ? 'You are now following them.'
        : 'They’ll need to accept your follow request.',
    );
    refreshLocal();
  };

  const handleMessage = (toUserId: string) => {
    const result = requestDirectMessage({
      fromUserId: userId,
      fromName: authorName,
      toUserId,
      companyPageId: company.id,
      companyName: company.name,
    });
    if (!result.ok) {
      showErrorToast('Message', result.error);
      return;
    }
    showSuccessToast(
      result.thread.status === 'active' ? 'Chat open' : 'Request sent',
      result.thread.status === 'active'
        ? 'Direct messaging unlocked.'
        : 'Waiting for them to accept.',
    );
    onOpenChat?.('dm', result.thread.id);
    refreshLocal();
  };

  const handleReference = async (refereeId: string) => {
    setBusy(true);
    try {
      const result = await requestReferenceCheck({
        companyPageId: company.id,
        companyName: company.name,
        requesterId: userId,
        requesterName: authorName,
        refereeId,
      });
      if (!result.ok) {
        showErrorToast('Reference check', result.error);
        return;
      }
      showSuccessToast(
        'Unlocked',
        `Spent ${result.request.feeTokens} tokens · messaging opened.`,
      );
      onOpenChat?.('reference', result.request.id);
      setTab('references');
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'posts', label: 'Posts', count: companyPosts.length },
    { id: 'people', label: 'People', count: connections.length },
    { id: 'references', label: 'Reference', count: openForRef.length },
  ];

  return (
    <div className="space-y-3 pb-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#0A66C2]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to feed
      </button>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.07)]">
        <div className="h-16 bg-[linear-gradient(115deg,#16324f_0%,#1e5a8a_55%,#28a8e1_100%)] sm:h-20" />

        <div className="px-4 sm:px-5">
          <div className="-mt-8 flex items-end justify-between gap-3 sm:-mt-9">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-[3px] border-white bg-[#1B3A5F] text-2xl font-bold text-white shadow-md sm:h-[72px] sm:w-[72px] sm:text-[28px]">
              {company.logoLetter}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pb-1">
              {isConnected ? (
                <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3.5 text-xs font-semibold text-slate-600">
                  Connected
                </span>
              ) : canConnect ? (
                <button
                  type="button"
                  onClick={onConnect}
                  className="h-8 rounded-full bg-[#0A66C2] px-4 text-xs font-semibold text-white hover:bg-[#004182]"
                >
                  Connect
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleFollowCompany}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ${
                  followingCompany
                    ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border border-[#0A66C2] text-[#0A66C2] hover:bg-sky-50'
                }`}
              >
                {followingCompany ? (
                  <BellOff className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                {followingCompany ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>

          <div className="mt-2.5 pb-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-[22px]">
              {company.name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                <Globe2 className="h-3 w-3" />
                {company.domainKey}
              </span>
              <span className="text-slate-300">·</span>
              <span>{connections.length} people</span>
              <span className="text-slate-300">·</span>
              <span>{followerCount} followers</span>
              <span className="text-slate-300">·</span>
              <span>{openForRef.length} open for reference</span>
            </p>
          </div>
        </div>

        <div className="flex gap-0.5 border-t border-slate-100 px-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex-1 px-2 py-2.5 text-center text-sm font-semibold transition sm:flex-none sm:px-4 ${
                tab === t.id
                  ? 'text-[#0A66C2] after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#0A66C2]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {t.label}
              {typeof t.count === 'number' ? (
                <span className="ml-1 text-xs font-normal text-slate-400">{t.count}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {tab === 'posts' ? (
        <div className="space-y-2.5">
          {companyPosts.length === 0 ? (
            <EmptyCard text="No posts on this page yet." />
          ) : (
            companyPosts.map((post) =>
              renderPost ? (
                <div key={post.id}>{renderPost(post)}</div>
              ) : (
                <article
                  key={post.id}
                  className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">{post.authorName}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{post.text}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {getCommentsForPost(post.id).length} comments
                  </p>
                </article>
              ),
            )
          )}
        </div>
      ) : null}

      {tab === 'people' ? (
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#0A66C2]" />
            <h2 className="text-sm font-bold text-slate-900">People at {company.name}</h2>
          </div>
          {connections.length === 0 ? (
            <EmptyCard text="No visible connections yet." compact />
          ) : (
            <ul className="space-y-2">
              {connections.map((id) => {
                const name = getGossipDisplayName(id, `Member ${id.slice(-4)}`);
                const open = openForRef.some((p) => p.userId === id);
                const role = roleFor(id);
                const follow = getPeopleFollowStatus(userId, id);
                const isSelf = id === userId;
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                  >
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1B3A5F] text-sm font-bold text-white">
                      {name.slice(0, 1).toUpperCase()}
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-slate-50 ${
                          isUserOnline(id) ? 'bg-emerald-500' : 'bg-rose-400'
                        }`}
                        title={isUserOnline(id) ? 'Online' : 'Offline'}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {onOpenProfile && !isSelf ? (
                          <button
                            type="button"
                            onClick={() => onOpenProfile(id)}
                            className="hover:text-[#0A66C2] hover:underline"
                          >
                            {name}
                          </button>
                        ) : (
                          <>
                            {name}
                            {isSelf ? ' (you)' : ''}
                          </>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {isUserOnline(id) ? 'Active now' : 'Offline'}
                        {' · '}
                        {role || (open ? 'Open for reference' : 'Connected')}
                      </p>
                    </div>
                    {!isSelf ? (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          disabled={busy || follow?.status === 'pending' || follow?.status === 'accepted'}
                          onClick={() => handleFollowPerson(id)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <UserPlus className="h-3 w-3" />
                          {follow?.status === 'accepted'
                            ? 'Following'
                            : follow?.status === 'pending'
                              ? 'Requested'
                              : 'Follow'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleMessage(id)}
                          className="inline-flex items-center gap-1 rounded-full border border-[#0A66C2] px-2.5 py-1 text-[11px] font-semibold text-[#0A66C2] hover:bg-sky-50 disabled:opacity-50"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Message
                        </button>
                        {open ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleReference(id)}
                            className="rounded-full bg-[#0A66C2] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#004182] disabled:opacity-50"
                          >
                            Reference
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'references' ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Open for reference check</h2>
            </div>
            <p className="mb-3 text-[12px] text-slate-500">
              Unlock with tokens (paid). Direct Message is free and separate.
            </p>
            {openForRef.length === 0 ? (
              <EmptyCard text="Nobody on this page has opted in yet." compact />
            ) : (
              <ul className="space-y-2">
                {openForRef.map((person) => {
                  const isSelf = person.userId === userId;
                  const role = roleFor(person.userId);
                  return (
                    <li
                      key={person.userId}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#1B3A5F]">
                        {person.displayName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {person.displayName}
                          {isSelf ? ' (you)' : ''}
                        </p>
                        <p className="text-xs text-slate-500">
                          {role ? `${role} · ` : ''}
                          {person.feeTokens} tokens
                        </p>
                      </div>
                      {!isSelf ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleReference(person.userId)}
                          className="shrink-0 rounded-full bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] disabled:opacity-50"
                        >
                          Unlock · {person.feeTokens}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {myChecks.length > 0 ? (
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MessageSquare className="h-3.5 w-3.5" />
                Your reference chats
              </p>
              <ul className="space-y-1">
                {myChecks.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onOpenChat?.('reference', r.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-sky-50"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                        {r.requesterId === userId ? r.refereeName : r.requesterName}
                      </span>
                      <span className="text-[10px] uppercase text-slate-400">{r.status}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EmptyCard({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-dashed border-slate-200 bg-white text-center text-sm text-slate-400 ${
        compact ? 'px-4 py-8' : 'px-5 py-12'
      }`}
    >
      {text}
    </div>
  );
}
