'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe2,
  ImagePlus,
  MessageSquare,
  Pencil,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';
import { ReferenceCheckDetailModal } from '@/components/community/ReferenceCheckDetailModal';
import { ContainedPostMedia, ExpandableCaption } from '@/components/community/PostBody';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import {
  DEMO_REFERENCE_PEOPLE,
  createPost,
  fileToDataUrl,
  getCommentsForPost,
  getGossipIdentity,
  getVisibleCompanyMemberIds,
  getCompanyMemberDisplayName,
  listOpenForReferenceOnCompany,
  loadCommunityState,
  updateCompanyPageDetails,
  updateGossipIdentity,
  type CommunityPost,
  type CompanyPage,
} from '@/lib/community-store';
import { notifyCompanyFollowersOfPost } from '@/lib/company-follow-notify';
import {
  listReferenceChecksForUser,
  requestReferenceCheck,
  respondReferenceCheck,
} from '@/lib/reference-check-store';
import { isUserOnline } from '@/lib/presence';
import {
  companyFollowerCount,
  followCompany,
  getDmPeerLabel,
  getPeopleFollowStatus,
  isFollowingCompany,
  listDmThreadsForUser,
  requestDirectMessage,
  requestPeopleFollow,
  respondDirectMessage,
  unfollowCompany,
} from '@/lib/social-store';
import { trackCustomActivity } from '@/lib/user-activity-tracker';

type Tab = 'posts' | 'people' | 'references' | 'inbox';

type Props = {
  company: CompanyPage;
  userId: string;
  authorName: string;
  /** Signed-in profile name — used for company People list (not gossip handle). */
  viewerRealName?: string;
  posts: CommunityPost[];
  isConnected: boolean;
  canConnect: boolean;
  onBack: () => void;
  onConnect: () => void;
  onRefresh?: () => void;
  onOpenChat?: (kind: ChatKind, id: string) => void;
  onOpenProfile?: (userId: string) => void;
  renderPost?: (post: CommunityPost) => ReactNode;
  /** Hide back control when viewing as the company account owner */
  hideBack?: boolean;
  /**
   * True only when Switch account is set to this company.
   * Creator browsing as personal user must see the visitor page (no New post / Requests).
   */
  manageAsCompany?: boolean;
  /**
   * `feed` — posts + people; Reference opens Reference Check module.
   * `reference` — people + reference only (no posts); wizard stays here.
   */
  variant?: 'feed' | 'reference';
  /** Open a specific tab on mount / when this value changes */
  initialTab?: Tab;
  /** Opens the employee/employer reference-check wizard (reference module) */
  onStartReferenceCheck?: () => void;
  /** Feed → jump to Reference Check module for this company */
  onOpenReferenceModule?: () => void;
  /** Override back button label */
  backLabel?: string;
};

export function CompanyPageView({
  company,
  userId,
  authorName,
  viewerRealName,
  posts,
  isConnected,
  canConnect,
  onBack,
  onConnect,
  onRefresh,
  onOpenChat,
  onOpenProfile,
  renderPost,
  hideBack = false,
  manageAsCompany = false,
  variant = 'feed',
  initialTab,
  onStartReferenceCheck,
  onOpenReferenceModule,
  backLabel = 'Back to feed',
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab || 'posts');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [msgAnon, setMsgAnon] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [composeImages, setComposeImages] = useState<string[]>([]);
  const [composeVideo, setComposeVideo] = useState<{
    url: string;
    durationSec: number;
  } | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [posting, setPosting] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [composeStep, setComposeStep] = useState<'media' | 'caption'>('media');
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [showEditPage, setShowEditPage] = useState(false);
  const [editName, setEditName] = useState(company.name);
  const [editDescription, setEditDescription] = useState(company.description || '');
  const [editLogoUrl, setEditLogoUrl] = useState<string | undefined>(company.logoUrl);
  const [savingEdit, setSavingEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;
  const MAX_IMAGE_MB = 4;
  const MAX_VIDEO_MB = 15;
  const MAX_VIDEO_SEC = 30;

  const resetCompose = () => {
    setComposeText('');
    setComposeImages([]);
    setComposeVideo(null);
    setCarouselIndex(0);
    setComposeStep('media');
    setPosting(false);
  };

  const closeCreatePost = () => {
    setShowCreatePost(false);
    resetCompose();
  };

  const identity = getGossipIdentity(userId);
  const followAnon = Boolean(identity?.followAnonymously);
  const profileForcedAnon = Boolean(identity?.isAnonymous);
  /** Admin tools only while switched into this company account */
  const isSelfOwner = Boolean(manageAsCompany);
  const isFeedVariant = variant === 'feed';
  const isReferenceVariant = variant === 'reference';
  const canCreatePost = isSelfOwner && isFeedVariant;

  const goToReferenceCheck = () => {
    if (onOpenReferenceModule) {
      onOpenReferenceModule();
      return;
    }
    onStartReferenceCheck?.();
  };

  const openCreatePost = () => {
    if (!canCreatePost) {
      showErrorToast('Company only', 'Only the company page can publish posts.');
      return;
    }
    resetCompose();
    setShowCreatePost(true);
    setTab('posts');
  };

  useEffect(() => {
    if (!initialTab) return;
    if (isFeedVariant && initialTab === 'inbox') {
      setTab('posts');
      return;
    }
    if (isReferenceVariant && initialTab === 'posts') {
      setTab('people');
      return;
    }
    if (!isSelfOwner && initialTab === 'inbox') {
      setTab(isReferenceVariant ? 'people' : 'posts');
      return;
    }
    setTab(initialTab);
  }, [initialTab, company.id, isSelfOwner, isReferenceVariant, isFeedVariant]);

  useEffect(() => {
    if (initialTab) return;
    if (isReferenceVariant) {
      setTab('people');
      return;
    }
    setTab('posts');
  }, [company.id, userId, isSelfOwner, initialTab, isReferenceVariant]);

  // Keep real name on identity for company People lists (even if feed is anonymous)
  useEffect(() => {
    const name = viewerRealName?.trim();
    if (!name || !userId) return;
    const current = getGossipIdentity(userId);
    if (!current || current.realName?.trim()) return;
    updateGossipIdentity(userId, { realName: name });
  }, [userId, viewerRealName]);

  const refreshLocal = () => {
    setTick((n) => n + 1);
    onRefresh?.();
  };

  useEffect(() => {
    setMsgAnon(profileForcedAnon || Boolean(identity?.followAnonymously));
  }, [profileForcedAnon, identity?.followAnonymously, userId]);

  useEffect(() => {
    trackCustomActivity({
      userId,
      type: 'page_visit',
      category: 'community',
      path: `/community/company/${company.id}`,
      meta: {
        companyId: company.id,
        companyName: company.name,
        roleKey: company.domainKey || undefined,
        sourceSurface: 'company_page',
      },
    });
  }, [userId, company.id, company.name, company.domainKey]);

  useEffect(() => {
    if (tab !== 'references') return;
    trackCustomActivity({
      userId,
      type: 'page_visit',
      category: 'community',
      path: `/community/company/${company.id}/references`,
      meta: {
        companyId: company.id,
        companyName: company.name,
        sourceSurface: 'reference_check',
      },
    });
  }, [tab, userId, company.id, company.name]);

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
  const companyPosts = useMemo(() => {
    // Personalized community feed omits company posts — read live store so posts never “vanish”
    const fromStore = loadCommunityState().posts.filter((p) => p.companyPageId === company.id);
    if (fromStore.length > 0) {
      return [...fromStore].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      );
    }
    return posts
      .filter((p) => p.companyPageId === company.id)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [posts, company.id, tick]);

  const myChecks = useMemo(
    () =>
      listReferenceChecksForUser(userId).filter((r) => r.companyPageId === company.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, company.id, tick],
  );

  const incomingRefs = useMemo(
    () =>
      myChecks.filter(
        (r) =>
          r.refereeId === userId &&
          (r.status === 'pending' ||
            r.status === 'awaiting_answers' ||
            r.status === 'answered' ||
            r.status === 'active'),
      ),
    [myChecks, userId],
  );

  const outgoingRefs = useMemo(
    () => myChecks.filter((r) => r.requesterId === userId),
    [myChecks, userId],
  );

  const companyDms = useMemo(
    () =>
      listDmThreadsForUser(userId).filter((d) => d.companyPageId === company.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, company.id, tick],
  );

  const pendingDmIncoming = useMemo(
    () => companyDms.filter((d) => d.toUserId === userId && d.status === 'pending'),
    [companyDms, userId],
  );

  const inboxCount =
    incomingRefs.filter((r) => r.status === 'pending' || r.status === 'awaiting_answers')
      .length +
    outgoingRefs.filter((r) => r.status === 'answered').length +
    pendingDmIncoming.length;

  const roleFor = (userIdKey: string) =>
    DEMO_REFERENCE_PEOPLE.find((d) => d.userId === userIdKey)?.role;

  const handleCreatePost = async () => {
    if (!composeText.trim() && composeImages.length === 0 && !composeVideo) {
      showErrorToast('Empty post', 'Add text, images, or a short video.');
      return;
    }
    setPosting(true);
    try {
      const hasVideo = Boolean(composeVideo);
      const hasImages = composeImages.length > 0;
      const post = createPost({
        companyPageId: company.id,
        authorId: userId,
        authorName: isSelfOwner ? company.name : authorName,
        text:
          composeText.trim() ||
          (hasVideo ? 'Video' : hasImages ? 'Photos' : ''),
        type: hasVideo ? 'video' : hasImages ? 'image' : 'text',
        mediaUrl: hasVideo ? composeVideo!.url : composeImages[0],
        mediaUrls: hasVideo ? [composeVideo!.url] : hasImages ? composeImages : undefined,
        mediaMime: hasVideo ? 'video/*' : hasImages ? 'image/*' : undefined,
        videoDurationSec: hasVideo ? composeVideo!.durationSec : undefined,
      });
      if (!post) {
        showErrorToast(
          'Could not post',
          'Connect to this company page first, then try again.',
        );
        return;
      }
      const notified = notifyCompanyFollowersOfPost({
        companyPageId: company.id,
        companyName: company.name,
        postId: post.id,
        postText: post.text,
        postType: post.type,
        excludeUserId: userId,
      });
      closeCreatePost();
      showSuccessToast(
        'Posted',
        notified > 0
          ? `Shared on ${company.name}. ${notified} follower${notified === 1 ? '' : 's'} notified.`
          : `Shared on ${company.name}.`,
      );
      refreshLocal();
      setTab('posts');
    } finally {
      setPosting(false);
    }
  };

  const readVideoDuration = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const duration = Number(video.duration) || 0;
        URL.revokeObjectURL(url);
        resolve(duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read video'));
      };
      video.src = url;
    });

  const pickComposeImages = async (files: FileList | null) => {
    if (!files?.length) return;
    if (composeVideo) {
      showErrorToast('Media', 'Remove the video before adding images.');
      return;
    }
    const remaining = MAX_IMAGES - composeImages.length;
    if (remaining <= 0) {
      showErrorToast('Image limit', `You can add up to ${MAX_IMAGES} images.`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    const next: string[] = [];
    for (const file of selected) {
      if (!file.type.startsWith('image/')) {
        showErrorToast('Invalid file', 'Only image files are allowed here.');
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        showErrorToast('File too large', `Keep each image under ${MAX_IMAGE_MB} MB.`);
        continue;
      }
      try {
        next.push(await fileToDataUrl(file));
      } catch {
        showErrorToast('Upload', 'Could not attach image.');
      }
    }
    if (next.length) {
      setComposeImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
      setCarouselIndex(0);
    }
  };

  const pickComposeVideo = async (file: File | null) => {
    if (!file) return;
    if (composeImages.length > 0) {
      showErrorToast('Media', 'Remove images before adding a video.');
      return;
    }
    if (!file.type.startsWith('video/')) {
      showErrorToast('Invalid file', 'Only video files are allowed here.');
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      showErrorToast('File too large', `Keep video under ${MAX_VIDEO_MB} MB.`);
      return;
    }
    try {
      const duration = await readVideoDuration(file);
      if (duration > MAX_VIDEO_SEC + 0.4) {
        showErrorToast('Video too long', `Max ${MAX_VIDEO_SEC} seconds.`);
        return;
      }
      const url = await fileToDataUrl(file);
      setComposeVideo({ url, durationSec: Math.round(duration) });
    } catch {
      showErrorToast('Upload', 'Could not attach video.');
    }
  };

  const handleAcceptRef = async (requestId: string, accept: boolean) => {
    setBusy(true);
    try {
      const result = await respondReferenceCheck(requestId, userId, accept, {
        anonymous: profileForcedAnon || followAnon,
      });
      if (!result.ok) {
        showErrorToast('Reference', result.error);
        return;
      }
      showSuccessToast(accept ? 'Accepted' : 'Rejected');
      if (accept) {
        setDetailRequestId(requestId);
      }
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const handleAcceptDm = (threadId: string, accept: boolean) => {
    setBusy(true);
    try {
      const result = respondDirectMessage(threadId, userId, accept, {
        anonymous: msgAnon || profileForcedAnon,
      });
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
      showSuccessToast(accept ? 'Accepted' : 'Rejected');
      if (accept) onOpenChat?.('dm', threadId);
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const handleFollowCompany = () => {
    if (followingCompany) {
      unfollowCompany(company.id, userId);
      showSuccessToast('Unfollowed', `You won't get updates from ${company.name}.`);
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
    showSuccessToast(
      'Following',
      `You're following ${company.name} — new posts will show in your feed.`,
    );
    refreshLocal();
  };

  const openEditPage = () => {
    setEditName(company.name);
    setEditDescription(company.description || '');
    setEditLogoUrl(company.logoUrl);
    setShowEditPage(true);
  };

  const pickLogo = async (file: File | null, saveImmediately = false) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showErrorToast('Invalid file', 'Choose an image for the company logo.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showErrorToast('File too large', 'Keep the logo under 4 MB.');
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setEditLogoUrl(url);
      if (saveImmediately) {
        const result = updateCompanyPageDetails(company.id, userId, { logoUrl: url });
        if (!result.ok) {
          showErrorToast('Logo', result.error);
          return;
        }
        showSuccessToast('Logo updated');
        refreshLocal();
      }
    } catch {
      showErrorToast('Upload', 'Could not read that image.');
    }
  };

  const saveCompanyDetails = () => {
    setSavingEdit(true);
    try {
      const result = updateCompanyPageDetails(company.id, userId, {
        name: editName,
        description: editDescription,
        logoUrl: editLogoUrl === undefined ? undefined : editLogoUrl || null,
      });
      if (!result.ok) {
        showErrorToast('Could not save', result.error);
        return;
      }
      showSuccessToast('Page updated', 'Company details saved.');
      setShowEditPage(false);
      refreshLocal();
    } finally {
      setSavingEdit(false);
    }
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
          ? 'Anonymous request sent — real name hidden until they accept.'
          : 'Request sent — real name stays hidden until they accept.',
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
        `Spent ${result.request.feeTokens} · messaging opened.`,
      );
      onOpenChat?.('reference', result.request.id);
      setTab('references');
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = isReferenceVariant
    ? [
        { id: 'people', label: 'Connections', count: connections.length },
        { id: 'references', label: 'Reference', count: openForRef.length },
        ...(isSelfOwner
          ? [
              {
                id: 'inbox' as const,
                label: 'Requests',
                count: inboxCount > 0 ? inboxCount : undefined,
              },
            ]
          : []),
      ]
    : [
    { id: 'posts', label: 'Posts', count: companyPosts.length },
    { id: 'people', label: 'People', count: connections.length },
        {
          id: 'references',
          label: 'Reference',
          count: openForRef.length,
        },
  ];

  return (
    <div className="space-y-3 pb-1">
      {!hideBack ? (
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-[#176F96]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
      </button>
      ) : null}

      <div className="overflow-hidden rounded-[24px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#2098C8] p-[1.5px] shadow-[0_14px_36px_rgba(32,152,200,0.14),0_6px_18px_rgba(32,152,200,0.1)]">
        <div className="overflow-hidden rounded-[22.5px] bg-white">
          <div className="relative h-28 overflow-hidden sm:h-32">
            <div className="absolute inset-0 bg-linear-to-br from-[#0F5A7A] via-[#176F96] to-[#2098C8]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.35),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_40%)]" />
            <div className="pointer-events-none absolute -right-6 top-2 h-24 w-24 rounded-full bg-[#2098C8]/25 blur-2xl" />
            {isSelfOwner ? (
              <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur-sm">
                Your page
              </span>
            ) : null}
          </div>

          <div className="relative px-4 sm:px-5">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-3 sm:-mt-12">
              <div className="relative">
                <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-[20px] border-[3px] border-white bg-linear-to-br from-[#176F96] to-[#2098C8] text-2xl font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.25)] sm:h-20 sm:w-20 sm:text-[30px]">
                  {company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    company.logoLetter
                  )}
                </div>
                {isSelfOwner ? (
                  <>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void pickLogo(e.target.files?.[0] || null, !showEditPage);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#176F96] shadow ring-1 ring-slate-200"
                      title="Change profile picture"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pb-1">
              {isConnected ? (
                  <span className="inline-flex h-8 items-center rounded-full bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
                  Connected
                </span>
              ) : canConnect ? (
                <button
                  type="button"
                  onClick={onConnect}
                    className="h-8 rounded-full bg-[#2098C8] px-4 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(32,152,200,0.28)] hover:bg-[#2098C8]"
                >
                  Connect
                </button>
              ) : null}
              {!isSelfOwner ? (
                <button
                  type="button"
                  onClick={handleFollowCompany}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ${
                    followingCompany
                      ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        : 'bg-[#2098C8] text-white shadow-[0_8px_16px_rgba(32,152,200,0.28)] hover:brightness-105'
                  }`}
                  title={
                    followingCompany
                      ? 'Unfollow — stop page updates'
                        : 'Follow — see posts in your feed'
                  }
                >
                  {followingCompany ? (
                    <BellOff className="h-3.5 w-3.5" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                  {followingCompany ? 'Following' : 'Follow'}
                </button>
                ) : null}
                {isSelfOwner ? (
                  <button
                    type="button"
                    onClick={openEditPage}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                ) : null}
                {canCreatePost ? (
                  <button
                    type="button"
                    onClick={openCreatePost}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#2098C8] px-3.5 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(32,152,200,0.28)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New post
                  </button>
                ) : null}
                {!isSelfOwner &&
                isReferenceVariant &&
                (onOpenReferenceModule || onStartReferenceCheck) ? (
                  <button
                    type="button"
                    onClick={goToReferenceCheck}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#176F96] px-3.5 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(23,111,150,0.28)]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Reference check
                  </button>
                ) : null}
            </div>
          </div>

            <div className="mt-3 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-[24px]">
                  {company.name}
                </h1>
                {company.source === 'phase2' ? (
                  <span className="inline-flex items-center rounded-full bg-[#E8F6FC] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#176F96] ring-1 ring-[#2098C8]/25">
                    Employer page
                  </span>
                ) : null}
              </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-semibold text-[#2098C8]">
                  <Globe2 className="h-3.5 w-3.5" />
                {company.domainKey}
              </span>
                {company.description ? (
                  <span className="text-slate-400">·</span>
                ) : null}
              </p>
              {company.description ? (
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-slate-600">
                  {company.description}
                </p>
              ) : null}
              <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(isReferenceVariant
                  ? [
                      { label: 'Connections', value: connections.length },
                      { label: 'Followers', value: followerCount },
                      { label: 'Open for ref', value: openForRef.length },
                      { label: 'Requests', value: isSelfOwner ? inboxCount : openForRef.length },
                    ]
                  : [
                      { label: 'Connections', value: connections.length },
                      { label: 'Followers', value: followerCount },
                      { label: 'Posts', value: companyPosts.length },
                      { label: 'Open for ref', value: openForRef.length },
                    ]
                ).map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-100 bg-linear-to-b from-[#F7FBFE] to-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                  >
                    <p className="text-lg font-bold tabular-nums tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
              </div>
                ))}
              </div>
              {isSelfOwner && isReferenceVariant && inboxCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setTab('inbox')}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[rgba(32,152,200,0.35)] bg-[#FFF8F1] px-3 py-1.5 text-[11px] font-semibold text-[#C2410C]"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  {inboxCount} request{inboxCount === 1 ? '' : 's'} need attention
                </button>
              ) : null}
          </div>
        </div>

        <div className="flex gap-0.5 border-t border-slate-100 px-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
                onClick={() => {
                  if (isFeedVariant && t.id === 'references') {
                    goToReferenceCheck();
                    return;
                  }
                  setTab(t.id);
                }}
              className={`relative flex-1 px-2 py-2.5 text-center text-sm font-semibold transition sm:flex-none sm:px-4 ${
                tab === t.id
                  ? 'text-[#176F96] after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-full after:bg-[#176F96]'
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
      </div>

      {tab === 'posts' && isFeedVariant ? (
        <div className="space-y-2.5">
          {companyPosts.length === 0 ? (
            <EmptyCard
              text={
                canCreatePost
                  ? 'No posts yet. Use New post above to share an update.'
                  : 'No posts on this page yet.'
              }
            />
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
                  <p className="mt-0.5 text-xs text-slate-400">
                    {/* timestamp omitted in fallback */}
                  </p>
                  <ContainedPostMedia post={post} className="mt-3" />
                  <ExpandableCaption text={post.text} className="mt-3" />
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#176F96]" />
            <h2 className="text-sm font-bold text-slate-900">People at {company.name}</h2>
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
          {connections.length === 0 ? (
            <EmptyCard text="No visible connections yet." compact />
          ) : (
            <ul className="space-y-2">
              {connections.map((id) => {
                const name = getCompanyMemberDisplayName(
                  id,
                  id === userId ? viewerRealName : undefined,
                );
                const open = openForRef.some((p) => p.userId === id);
                const role = roleFor(id);
                const follow = getPeopleFollowStatus(userId, id);
                const isSelf = id === userId;
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                  >
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#176F96] text-sm font-bold text-white">
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
                            className="hover:text-[#176F96] hover:underline"
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
                          className="inline-flex items-center gap-1 rounded-full border border-[#176F96] px-2.5 py-1 text-[11px] font-semibold text-[#176F96] hover:bg-sky-50 disabled:opacity-50"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Message
                        </button>
                        {open ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (isFeedVariant) {
                                goToReferenceCheck();
                                return;
                              }
                              if (onStartReferenceCheck) onStartReferenceCheck();
                              else void handleReference(id);
                            }}
                            className="rounded-full bg-[#176F96] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#0F5A7A] disabled:opacity-50"
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

      {tab === 'references' && isFeedVariant ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-[#176F96]" />
          <p className="mt-3 text-sm font-semibold text-slate-900">
            Reference Check is a separate module
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Open Reference Check to view connections open for reference and start a check.
          </p>
          <button
            type="button"
            onClick={goToReferenceCheck}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#176F96] px-4 py-2 text-xs font-semibold text-white"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Go to Reference Check
          </button>
        </div>
      ) : null}

      {tab === 'references' && !isFeedVariant ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Open for reference check</h2>
              </div>
              {onStartReferenceCheck && !isSelfOwner ? (
                <button
                  type="button"
                  onClick={onStartReferenceCheck}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#176F96] px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Start reference check
                </button>
              ) : null}
            </div>
            <p className="mb-3 text-[12px] text-slate-500">
              View people open for reference, then start a check as employee or employer.
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
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#176F96]">
                        {person.displayName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {person.displayName}
                          {isSelf ? ' (you)' : ''}
                        </p>
                        <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                          {role ? <span>{role} · </span> : null}
                          <TokenCoinIcon className="h-3.5 w-3.5" />
                          {person.feeTokens}
                        </p>
                      </div>
                      {!isSelf ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            onStartReferenceCheck
                              ? onStartReferenceCheck()
                              : void handleReference(person.userId)
                          }
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#176F96] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F5A7A] disabled:opacity-50"
                        >
                          {onStartReferenceCheck ? (
                            'Reference check'
                          ) : (
                            <>
                              Unlock · <TokenCoinIcon className="h-3.5 w-3.5" />
                              {person.feeTokens}
                            </>
                          )}
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
                    <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-sky-50">
                    <button
                      type="button"
                        onClick={() => setDetailRequestId(r.id)}
                        className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-800"
                    >
                        {r.requesterId === userId ? r.refereeName : r.requesterName}
                        <span className="ml-2 text-[10px] uppercase text-slate-400">
                          {r.status}
                      </span>
                    </button>
                      <button
                        type="button"
                        onClick={() => onOpenChat?.('reference', r.id)}
                        className="shrink-0 rounded-full bg-[#176F96] px-2.5 py-1 text-[10px] font-semibold text-white"
                      >
                        Open
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'inbox' && isSelfOwner && isReferenceVariant ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
            <p className="text-sm font-bold text-amber-900">Requests & actions</p>
            <p className="mt-0.5 text-[12px] text-amber-800/80">
              Accept message or reference requests, answer questions, and rate responses to finish
              the process.
            </p>
    </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#176F96]" />
              <h2 className="text-sm font-bold text-slate-900">Message requests</h2>
            </div>
            {pendingDmIncoming.length === 0 ? (
              <EmptyCard text="No pending message requests for this company." compact />
            ) : (
              <ul className="space-y-2">
                {pendingDmIncoming.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {getDmPeerLabel(d, userId)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Direct message · Waiting for your reply
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAcceptDm(d.id, true)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleAcceptDm(d.id, false)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {companyDms.filter((d) => d.status === 'active').length > 0 ? (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Active chats
                </p>
                <ul className="space-y-1">
                  {companyDms
                    .filter((d) => d.status === 'active')
                    .map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => onOpenChat?.('dm', d.id)}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-sky-50"
                        >
                          <span className="font-medium text-slate-800">
                            {getDmPeerLabel(d, userId)}
                          </span>
                          <span className="text-[10px] font-semibold text-[#176F96]">Open</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Reference check requests</h2>
            </div>
            {incomingRefs.length === 0 && outgoingRefs.length === 0 ? (
              <EmptyCard text="No reference requests for this company yet." compact />
            ) : (
              <ul className="space-y-2">
                {[...incomingRefs, ...outgoingRefs.filter((r) => r.refereeId !== userId)].map(
                  (r) => {
                    const iAmReferee = r.refereeId === userId;
                    const peer =
                      r.requesterId === userId ? r.refereeName : r.requesterName;
                    const needsAccept = iAmReferee && r.status === 'pending';
                    const needsAnswers = iAmReferee && r.status === 'awaiting_answers';
                    const needsRate = r.requesterId === userId && r.status === 'answered';
                    return (
                      <li
                        key={r.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{peer}</p>
                            <p className="text-[11px] text-slate-500">
                              {needsAccept
                                ? 'Needs your accept / reject'
                                : needsAnswers
                                  ? 'Accepted — answer questions to complete'
                                  : needsRate
                                    ? 'Response ready — rate to complete payout'
                                    : `Status · ${r.status}`}
                            </p>
                          </div>
                          {needsAccept ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleAcceptRef(r.id, true)}
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                              >
                                <Check className="h-3 w-3" />
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleAcceptRef(r.id, false)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 disabled:opacity-50"
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setDetailRequestId(r.id)}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                {needsAnswers || needsRate ? 'Complete' : 'View'}
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenChat?.('reference', r.id)}
                                className="rounded-full bg-[#176F96] px-3 py-1.5 text-[11px] font-semibold text-white"
                              >
                                Chat
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  },
                )}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {showCreatePost ? (
        <div
          className="fixed inset-0 z-80 flex items-end justify-center bg-[#0F5A7A]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create post"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreatePost();
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-t-[26px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#2098C8] p-[1.5px] shadow-[0_24px_60px_rgba(15,42,68,0.35)] sm:rounded-[26px]">
            <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-t-[24.5px] bg-white sm:rounded-[24.5px]">
              <div className="relative overflow-hidden bg-linear-to-r from-[#0F5A7A] via-[#176F96] to-[#2098C8] px-3 py-3">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.35),transparent_45%)]" />
                <div className="relative flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (composeStep === 'caption') setComposeStep('media');
                      else closeCreatePost();
                    }}
                    className="rounded-full bg-white/10 p-1.5 text-white ring-1 ring-white/20 hover:bg-white/20"
                    aria-label={composeStep === 'caption' ? 'Back' : 'Close'}
                  >
                    {composeStep === 'caption' ? (
                      <ChevronLeft className="h-5 w-5" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </button>
                  <div className="min-w-0 text-center">
                    <p className="text-[14px] font-bold tracking-tight text-white">
                      {composeStep === 'media' ? 'New post' : 'Add caption'}
                    </p>
                    <p className="truncate text-[10px] font-medium text-white/70">
                      {isSelfOwner ? company.name : 'Share an update'}
                    </p>
                  </div>
                  {composeStep === 'media' ? (
                    <button
                      type="button"
                      onClick={() => setComposeStep('caption')}
                      className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#176F96] shadow-sm"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        posting ||
                        (!composeText.trim() &&
                          composeImages.length === 0 &&
                          !composeVideo)
                      }
                      onClick={() => void handleCreatePost()}
                      className="rounded-full bg-[#2098C8] px-3 py-1.5 text-[12px] font-bold text-white shadow-sm disabled:opacity-40"
                    >
                      {posting ? 'Sharing…' : 'Share'}
                    </button>
                  )}
                </div>
                <div className="relative mt-3 flex items-center gap-1.5 px-1">
                  <span
                    className={`h-1 flex-1 rounded-full ${
                      composeStep === 'media' || composeStep === 'caption'
                        ? 'bg-white'
                        : 'bg-white/30'
                    }`}
                  />
                  <span
                    className={`h-1 flex-1 rounded-full ${
                      composeStep === 'caption' ? 'bg-[#2098C8]' : 'bg-white/30'
                    }`}
                  />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void pickComposeImages(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  void pickComposeVideo(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
              />

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#F4F8FB]">
                {composeStep === 'media' ? (
                  <div className="flex flex-col">
                    {composeImages.length > 0 ? (
                      <div className="relative bg-[#0F5A7A]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={composeImages[carouselIndex] || composeImages[0]}
                          alt=""
                          className="max-h-[48vh] w-full object-contain"
                        />
                        {composeImages.length > 1 ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setCarouselIndex((i) =>
                                  i === 0 ? composeImages.length - 1 : i - 1,
                                )
                              }
                              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCarouselIndex((i) => (i + 1) % composeImages.length)
                              }
                              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                              {composeImages.map((_, i) => (
                                <span
                                  key={i}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    i === carouselIndex ? 'bg-white' : 'bg-white/45'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-1.5 border-t border-white/10 bg-[#0F5A7A] px-3 py-2.5">
                          {composeImages.map((src, i) => (
                            <button
                              key={`${src.slice(0, 24)}-${i}`}
                              type="button"
                              onClick={() => setCarouselIndex(i)}
                              className={`h-11 w-11 overflow-hidden rounded-lg ring-2 ${
                                i === carouselIndex ? 'ring-[#2098C8]' : 'ring-transparent'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                          {composeImages.length < MAX_IMAGES ? (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-white/35 text-white/80"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              setComposeImages([]);
                              setCarouselIndex(0);
                            }}
                            className="ml-auto text-[11px] font-semibold text-rose-300"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : composeVideo ? (
                      <div className="bg-[#0F5A7A]">
                        <video
                          src={composeVideo.url}
                          controls
                          className="max-h-[48vh] w-full"
                        />
                        <div className="flex items-center justify-between px-3 py-2.5 text-[12px] text-white/75">
                          <span>
                            {composeVideo.durationSec}s · max {MAX_VIDEO_SEC}s
                          </span>
                          <button
                            type="button"
                            onClick={() => setComposeVideo(null)}
                            className="font-semibold text-rose-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-h-70 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                        <div className="relative">
                          <div className="absolute -inset-3 rounded-full bg-linear-to-br from-[#2098C8]/25 to-[#2098C8]/25 blur-md" />
                          <div className="relative flex h-20 w-20 items-center justify-center rounded-[22px] border border-white bg-white shadow-[0_12px_28px_rgba(32,152,200,0.18)]">
                            <ImagePlus className="h-8 w-8 text-[#2098C8]" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[16px] font-bold tracking-tight text-slate-900">
                            Add photos or a video
                          </p>
                          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
                            Optional — text-only posts work too. Up to {MAX_IMAGES} images (
                            {MAX_IMAGE_MB} MB) or 1 video ({MAX_VIDEO_SEC}s · {MAX_VIDEO_MB} MB).
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-linear-to-r from-[#2098C8] to-[#176F96] px-5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(32,152,200,0.28)]"
                          >
                            <ImagePlus className="h-4 w-4" />
                            Photos
                          </button>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-700 shadow-sm"
                          >
                            <Video className="h-4 w-4" />
                            Video
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setComposeStep('caption')}
                          className="text-[13px] font-semibold text-[#2098C8] hover:underline"
                        >
                          Skip — text only
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {(composeImages.length > 0 || composeVideo) && (
                      <div className="overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-sm">
                        {composeVideo ? (
                          <video
                            src={composeVideo.url}
                            className="max-h-40 w-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={composeImages[carouselIndex] || composeImages[0]}
                            alt=""
                            className="max-h-40 w-full object-cover"
                          />
                        )}
                      </div>
                    )}
                    <div className="rounded-[20px] border border-slate-200/80 bg-white p-3.5 shadow-sm">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-linear-to-br from-[#176F96] to-[#2098C8] text-sm font-bold text-white shadow-sm">
                          {isSelfOwner
                            ? company.logoLetter
                            : authorName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-slate-900">
                            {isSelfOwner ? company.name : authorName}
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                            Caption
                          </p>
                          <WritingAssistField
                            value={composeText}
                            onChange={setComposeText}
                            rows={5}
                            placeholder="Write a caption or update…"
                            className="mt-1.5 max-h-44 min-h-25 w-full resize-none bg-transparent text-[14px] leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                      {!composeImages.length && !composeVideo ? (
                        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-[#F4F8FB] px-3 text-[12px] font-semibold text-slate-600"
                          >
                            <ImagePlus className="h-3.5 w-3.5" />
                            Add photos
                          </button>
                          <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-[#F4F8FB] px-3 text-[12px] font-semibold text-slate-600"
                          >
                            <Video className="h-3.5 w-3.5" />
                            Add video
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showEditPage ? (
        <div
          className="fixed inset-0 z-80 flex items-end justify-center bg-[#0F5A7A]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit company page"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditPage(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-t-[26px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#2098C8] p-[1.5px] shadow-[0_24px_60px_rgba(15,42,68,0.35)] sm:rounded-[26px]">
            <div className="overflow-hidden rounded-t-[24.5px] bg-white sm:rounded-[24.5px]">
              <div className="relative overflow-hidden bg-linear-to-r from-[#0F5A7A] via-[#176F96] to-[#2098C8] px-4 py-3.5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.35),transparent_45%)]" />
                <div className="relative flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-bold text-white">Edit page</p>
                    <p className="text-[11px] font-medium text-white/70">
                      Name, about, and profile photo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditPage(false)}
                    className="rounded-full bg-white/10 p-1.5 text-white ring-1 ring-white/20 hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 bg-[#F4F8FB] p-4">
                <div className="rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-[18px] bg-linear-to-br from-[#176F96] to-[#2098C8] text-2xl font-bold text-white shadow-sm">
                      {editLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={editLogoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (editName || company.logoLetter).slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-slate-800">Profile photo</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Square image works best · max 4 MB
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#2098C8] px-3 text-[12px] font-semibold text-white"
                        >
                          <ImagePlus className="h-3.5 w-3.5" />
                          Change photo
                        </button>
                        {editLogoUrl ? (
                          <button
                            type="button"
                            onClick={() => setEditLogoUrl(undefined)}
                            className="h-8 rounded-full px-3 text-[12px] font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
                  <label className="block text-[12px] font-semibold text-slate-700">
                    Company name
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FBFD] px-3 text-sm outline-none focus:border-[#2098C8] focus:bg-white"
                    />
                  </label>
                  <label className="block text-[12px] font-semibold text-slate-700">
                    About
                    <WritingAssistField
                      value={editDescription}
                      onChange={setEditDescription}
                      rows={4}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F8FBFD] px-3 py-2.5 text-sm outline-none focus:border-[#2098C8] focus:bg-white"
                    />
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPage(false)}
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingEdit || editName.trim().length < 2}
                    onClick={saveCompanyDetails}
                    className="rounded-full bg-[#2098C8] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(32,152,200,0.28)] disabled:opacity-40"
                  >
                    {savingEdit ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailRequestId ? (
        <ReferenceCheckDetailModal
          requestId={detailRequestId}
          userId={userId}
          onClose={() => setDetailRequestId(null)}
          onChanged={refreshLocal}
        />
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
