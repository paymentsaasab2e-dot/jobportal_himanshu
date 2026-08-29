'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  MessageSquare,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';
import {
  DEMO_REFERENCE_PEOPLE,
  getGossipDisplayName,
  getGossipIdentity,
  type CommunityPost,
  type CompanyPage,
} from '@/lib/community-store';
import { isUserOnline } from '@/lib/presence';
import { recordProfileView } from '@/lib/profile-view-store';
import { requestReferenceCheck } from '@/lib/reference-check-store';
import {
  getPeopleFollowStatus,
  requestDirectMessage,
  requestPeopleFollow,
} from '@/lib/social-store';

type Props = {
  profileUserId: string;
  viewerId: string;
  viewerName: string;
  posts: CommunityPost[];
  companies: CompanyPage[];
  onBack: () => void;
  onOpenCompany?: (companyPageId: string) => void;
  onRefresh?: () => void;
  onOpenChat?: (kind: ChatKind, id: string) => void;
  renderPost?: (post: CommunityPost) => ReactNode;
};

export function UserProfileView({
  profileUserId,
  viewerId,
  viewerName,
  posts,
  companies,
  onBack,
  onOpenCompany,
  onRefresh,
  onOpenChat,
  renderPost,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [msgAnon, setMsgAnon] = useState(false);

  const refreshLocal = () => {
    setTick((n) => n + 1);
    onRefresh?.();
  };

  const name = getGossipDisplayName(profileUserId, `Member ${profileUserId.slice(-4)}`);
  const identity = getGossipIdentity(profileUserId);
  const viewerIdentity = getGossipIdentity(viewerId);
  const followAnon = Boolean(viewerIdentity?.followAnonymously);
  const profileForcedAnon = Boolean(viewerIdentity?.isAnonymous);

  useEffect(() => {
    setMsgAnon(profileForcedAnon || Boolean(viewerIdentity?.followAnonymously));
  }, [profileForcedAnon, viewerIdentity?.followAnonymously, viewerId]);
  const demo = DEMO_REFERENCE_PEOPLE.find((d) => d.userId === profileUserId);
  const online = isUserOnline(profileUserId);
  const isSelf = profileUserId === viewerId;

  useEffect(() => {
    if (!viewerId || isSelf) return;
    void recordProfileView({
      profileUserId,
      viewerId,
      viewerName,
    });
  }, [profileUserId, viewerId, viewerName, isSelf]);

  const follow = useMemo(
    () => getPeopleFollowStatus(viewerId, profileUserId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewerId, profileUserId, tick],
  );

  const memberCompanies = useMemo(
    () => companies.filter((c) => c.memberIds.includes(profileUserId)),
    [companies, profileUserId],
  );

  const userPosts = useMemo(
    () => posts.filter((p) => p.authorId === profileUserId),
    [posts, profileUserId],
  );

  const primaryCompany = memberCompanies[0] || null;
  const openForRef = Boolean(identity?.availableForReferenceCheck);

  const handleFollow = () => {
    const result = requestPeopleFollow({
      fromUserId: viewerId,
      fromName: viewerName,
      toUserId: profileUserId,
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

  const handleMessage = () => {
    const result = requestDirectMessage({
      fromUserId: viewerId,
      fromName: viewerName,
      toUserId: profileUserId,
      companyPageId: primaryCompany?.id,
      companyName: primaryCompany?.name,
      anonymous: msgAnon || profileForcedAnon,
    });
    if (!result.ok) {
      showErrorToast('Message', result.error);
      return;
    }
    showSuccessToast(
      result.thread.status === 'active' ? 'Chat open' : 'Request sent',
      result.thread.status === 'active'
        ? 'Direct messaging unlocked.'
        : msgAnon || profileForcedAnon
          ? 'Request sent anonymously — real name hidden until they accept.'
          : 'Request sent — real name stays hidden until they accept.',
    );
    onOpenChat?.('dm', result.thread.id);
    refreshLocal();
  };

  const handleReference = async () => {
    if (!primaryCompany) {
      showErrorToast('Reference', 'They need a company page connection first.');
      return;
    }
    setBusy(true);
    try {
      const result = await requestReferenceCheck({
        companyPageId: primaryCompany.id,
        companyName: primaryCompany.name,
        requesterId: viewerId,
        requesterName: viewerName,
        refereeId: profileUserId,
      });
      if (!result.ok) {
        showErrorToast('Reference check', result.error);
        return;
      }
      showSuccessToast(
        'Unlocked',
        `Spent ${result.request.feeTokens} · messaging opened.`,
      );
      onOpenChat?.('reference', result.request.id);
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const subtitleBits = [
    online ? 'Active now' : 'Offline',
    demo?.role || null,
    openForRef ? 'Open for reference' : null,
    identity?.username ? `@${identity.username}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-3 pb-1">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#176F96]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to feed
      </button>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.07)]">
        <div className="h-16 bg-[linear-gradient(115deg,#16324f_0%,#1e5a8a_55%,#2098C8_100%)] sm:h-20" />

        <div className="px-4 sm:px-5">
          <div className="-mt-8 flex items-end justify-between gap-3 sm:-mt-9">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[#176F96] text-2xl font-bold text-white shadow-md sm:h-[72px] sm:w-[72px] sm:text-[28px]">
              {name.slice(0, 1).toUpperCase()}
              <span
                className={`absolute bottom-1 right-1 h-3 w-3 rounded-full ring-2 ring-white ${
                  online ? 'bg-emerald-500' : 'bg-rose-400'
                }`}
                title={online ? 'Online' : 'Offline'}
              />
            </div>
            {!isSelf ? (
              <div className="flex flex-col items-end gap-1.5 pb-1">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={busy || follow?.status === 'pending' || follow?.status === 'accepted'}
                    onClick={handleFollow}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#176F96] px-3.5 text-xs font-semibold text-[#176F96] hover:bg-sky-50 disabled:opacity-50"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {follow?.status === 'accepted'
                      ? 'Following'
                      : follow?.status === 'pending'
                        ? 'Requested'
                        : 'Follow'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleMessage}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#176F96] px-3.5 text-xs font-semibold text-white hover:bg-[#0F5A7A] disabled:opacity-50"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message
                  </button>
                  {openForRef && primaryCompany ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleReference()}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Reference
                    </button>
                  ) : null}
                </div>
                <label
                  className={`inline-flex items-center gap-1.5 text-[10px] text-slate-500 ${
                    profileForcedAnon ? 'opacity-80' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={msgAnon || profileForcedAnon}
                    disabled={profileForcedAnon}
                    onChange={(e) => setMsgAnon(e.target.checked)}
                    className="rounded border-slate-300 text-[#176F96]"
                  />
                  Message anonymously
                  {profileForcedAnon ? ' (locked)' : ''}
                </label>
              </div>
            ) : (
              <span className="mb-1 inline-flex h-8 items-center rounded-full bg-slate-100 px-3.5 text-xs font-semibold text-slate-600">
                This is you
              </span>
            )}
          </div>

          <div className="mt-2.5 pb-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-[22px]">
              {name}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
              {subtitleBits.map((bit, i) => (
                <span key={`${bit}-${i}`} className="inline-flex items-center gap-2">
                  {i > 0 ? <span className="text-slate-300">·</span> : null}
                  <span
                    className={
                      bit === 'Active now'
                        ? 'font-medium text-emerald-600'
                        : bit === 'Offline'
                          ? 'font-medium text-rose-500'
                          : ''
                    }
                  >
                    {bit}
                  </span>
                </span>
              ))}
            </p>
            {memberCompanies.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {memberCompanies.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenCompany?.(c.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#176F96] hover:text-[#176F96]"
                  >
                    <Briefcase className="h-3 w-3" />
                    {c.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-2.5 sm:px-5">
          <p className="text-xs font-semibold text-slate-500">
            Posts <span className="font-normal text-slate-400">· {userPosts.length}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {userPosts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
            No posts from {isSelf ? 'you' : 'them'} yet.
          </div>
        ) : (
          userPosts.map((post) =>
            renderPost ? (
              <div key={post.id}>{renderPost(post)}</div>
            ) : (
              <article
                key={post.id}
                className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm"
              >
                <p className="text-xs text-slate-500">
                  {post.companyName || post.communityName || 'Office Gossips'}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-800">{post.text}</p>
              </article>
            ),
          )
        )}
      </div>
    </div>
  );
}
