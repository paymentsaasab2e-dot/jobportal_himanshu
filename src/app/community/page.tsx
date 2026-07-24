'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Flame,
  Heart,
  Info,
  Lock,
  MessageCircle,
  Mic,
  Plus,
  Search,
  Users,
  Globe2,
  Loader2,
  Briefcase,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { CompanyPageView } from '@/components/community/CompanyPageView';
import { ReferenceCheckPanel } from '@/components/community/ReferenceCheckPanel';
import { ReferenceMessagingPanel } from '@/components/community/ReferenceMessagingPanel';
import { UserProfileView } from '@/components/community/UserProfileView';
import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders, resolveCandidateIdForApi } from '@/lib/auth-storage';
import { heartbeatPresence } from '@/lib/presence';
import {
  addComment,
  canConnectToCompany,
  canViewCommunity,
  connectCompanyPage,
  createCommunity,
  createGossipAccount,
  createPost,
  emailDomain,
  fileToDataUrl,
  getCommentsForPost,
  getConnectedCompanies,
  getGossipDisplayName,
  getGossipIdentity,
  getHotCircles,
  getJoinedCommunities,
  getVisibleFeed,
  hasGossipAccount,
  joinCommunity,
  leaveCommunity,
  loadCommunityState,
  normalizeGossipUsername,
  searchCommunityEverything,
  suggestAnonymousUsername,
  toggleLike,
  updateGossipIdentity,
  upsertCompanyPage,
  type Community,
  type CommunityComment,
  type CommunityPost,
  type CommunityPostType,
  type CommunitySearchHit,
  type CommunityVisibility,
  type CompanyPage,
  type GossipIdentity,
  type HotCircleStat,
} from '@/lib/community-store';

type ComposeTarget =
  | { kind: 'community'; id: string }
  | { kind: 'company'; id: string }
  | null;

function displayName(user: { name?: string; email?: string; id: string } | null): string {
  if (!user) return 'Member';
  if (user.name?.trim()) return user.name.trim();
  if (user.email?.trim()) return user.email.split('@')[0];
  return `User ${user.id.slice(-4)}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ComposeAssetIcon({
  src,
  alt,
  size = 20,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export default function OfficeGossipsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [companyPages, setCompanyPages] = useState<CompanyPage[]>([]);
  const [hotCircles, setHotCircles] = useState<HotCircleStat[]>([]);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [cvCompanies, setCvCompanies] = useState<string[]>([]);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [gossipIdentity, setGossipIdentity] = useState<GossipIdentity | null>(null);
  const [connectPromptPage, setConnectPromptPage] = useState<CompanyPage | null>(null);
  const [connectShowInList, setConnectShowInList] = useState(true);
  const [companySlide, setCompanySlide] = useState(0);
  const [companySlideDir, setCompanySlideDir] = useState<'up' | 'down'>('up');
  const [showAllHot, setShowAllHot] = useState(false);
  const [composeTarget, setComposeTarget] = useState<ComposeTarget>(null);
  const [composeText, setComposeText] = useState('');
  const [composeType, setComposeType] = useState<CommunityPostType>('text');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaMime, setMediaMime] = useState<string | undefined>();
  const [posting, setPosting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentThread, setCommentThread] = useState<CommunityComment[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [referenceChatId, setReferenceChatId] = useState<string | null>(null);
  const [referenceChatKind, setReferenceChatKind] = useState<'reference' | 'dm' | null>(null);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);
  const composeInputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || null;
  const realName = displayName(user);
  const authorName = getGossipDisplayName(userId, realName);
  const workDomain = emailDomain(user?.email);
  const hasAccount = Boolean(gossipIdentity);

  const refresh = useCallback(() => {
    const state = loadCommunityState();
    setCommunities(state.communities);
    setCompanyPages(state.companyPages);
    setHotCircles(getHotCircles(6));
    setFeed(getVisibleFeed(userId));
    setGossipIdentity(getGossipIdentity(userId));
    if (commentPostId) {
      setCommentThread(getCommentsForPost(commentPostId));
    }
  }, [userId, commentPostId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) refresh();
  }, [authLoading, isAuthenticated, refresh]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && userId && !hasGossipAccount(userId)) {
      setShowCreateAccount(true);
    }
  }, [authLoading, isAuthenticated, userId]);

  // Vertical company page carousel — current exits up, next enters from below
  useEffect(() => {
    if (companyPages.length < 2) return;
    const id = window.setInterval(() => {
      setCompanySlideDir('up');
      setCompanySlide((i) => (i + 1) % companyPages.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [companyPages.length]);

  // Pull CV / work companies to auto-link company pages
  useEffect(() => {
    if (!userId) return;
    const candidateId = resolveCandidateIdForApi(userId);
    if (!candidateId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/profile/${candidateId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data || json;
        const names = new Set<string>();
        const we = data?.workExperiences || data?.workExperience || [];
        if (Array.isArray(we)) {
          for (const e of we) {
            if (e?.companyName) names.add(String(e.companyName));
          }
        }
        if (data?.currentCompany) names.add(String(data.currentCompany));
        if (data?.candidate?.currentCompany) names.add(String(data.candidate.currentCompany));
        if (!cancelled) setCvCompanies([...names]);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    heartbeatPresence(userId);
    const id = window.setInterval(() => heartbeatPresence(userId), 25_000);
    return () => window.clearInterval(id);
  }, [userId]);

  const joined = useMemo(
    () => (userId ? getJoinedCommunities(userId) : []),
    [userId, communities],
  );
  const connectedCompanies = useMemo(
    () => (userId ? getConnectedCompanies(userId) : []),
    [userId, companyPages],
  );

  const companySearchResults = useMemo(
    () => searchCommunityEverything(companySearch, 20),
    [companySearch, companyPages, communities, feed],
  );

  const selectedCompany = useMemo(
    () => companyPages.find((p) => p.id === selectedCompanyId) || null,
    [companyPages, selectedCompanyId],
  );

  const openCompanyPage = (pageId: string) => {
    setSelectedProfileUserId(null);
    setSelectedCompanyId(pageId);
    setSearchOpen(false);
    setCompanySearch('');
    const page = companyPages.find((p) => p.id === pageId);
    if (page && userId && page.memberIds.includes(userId)) {
      setComposeTarget({ kind: 'company', id: pageId });
    }
  };

  const openUserProfile = (profileUserId: string) => {
    setSelectedCompanyId(null);
    setSelectedProfileUserId(profileUserId);
    setSearchOpen(false);
    setCompanySearch('');
    setHighlightPostId(null);
  };

  const openChat = (kind: 'reference' | 'dm', id: string) => {
    setReferenceChatKind(kind);
    setReferenceChatId(id);
  };

  const closeChat = () => {
    setReferenceChatId(null);
    setReferenceChatKind(null);
  };

  const composeOptions = useMemo(() => {
    const opts: { value: string; label: string; target: ComposeTarget }[] = [];
    for (const c of joined) {
      opts.push({
        value: `community:${c.id}`,
        label: `👥 ${c.name}`,
        target: { kind: 'community', id: c.id },
      });
    }
    for (const co of connectedCompanies) {
      opts.push({
        value: `company:${co.id}`,
        label: `🏢 ${co.name}`,
        target: { kind: 'company', id: co.id },
      });
    }
    return opts;
  }, [joined, connectedCompanies]);

  useEffect(() => {
    if (!composeTarget && composeOptions.length > 0) {
      setComposeTarget(composeOptions[0].target);
    }
  }, [composeOptions, composeTarget]);

  const openComments = (postId: string) => {
    if (commentPostId === postId) {
      closeComments();
      return;
    }
    setCommentPostId(postId);
    setCommentThread(getCommentsForPost(postId));
    setCommentText('');
    window.requestAnimationFrame(() => {
      const el = document.getElementById(`og-post-${postId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const closeComments = () => {
    setCommentPostId(null);
    setCommentText('');
    setCommentThread([]);
  };

  const insertAtMention = () => {
    const el = composeInputRef.current;
    const mention = '@';
    if (!el) {
      setComposeText((t) => `${t}${mention}`);
      return;
    }
    const start = el.selectionStart ?? composeText.length;
    const end = el.selectionEnd ?? composeText.length;
    const next = `${composeText.slice(0, start)}${mention}${composeText.slice(end)}`;
    setComposeText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + mention.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleJoin = (id: string) => {
    if (!userId) return;
    if (!hasAccount) {
      setShowCreateAccount(true);
      return;
    }
    joinCommunity(id, userId);
    showSuccessToast('Joined', 'You can post in this circle now.');
    refresh();
  };

  const handleLeave = (id: string) => {
    if (!userId) return;
    leaveCommunity(id, userId);
    showSuccessToast('Left circle');
    refresh();
  };

  const handleConnectCompany = (page: CompanyPage) => {
    if (!userId) return;
    if (!hasAccount) {
      setShowCreateAccount(true);
      return;
    }
    const ok = canConnectToCompany(page, { email: user?.email, cvCompanies });
    if (!ok) {
      showErrorToast('Cannot connect', 'You are not eligible to connect to this page yet.');
      return;
    }
    setConnectShowInList(gossipIdentity?.showInCompanyConnections ?? true);
    setConnectPromptPage(page);
  };

  const confirmConnectCompany = () => {
    if (!userId || !connectPromptPage) return;
    updateGossipIdentity(userId, { showInCompanyConnections: connectShowInList });
    connectCompanyPage(connectPromptPage.id, userId);
    showSuccessToast('Connected', `${connectPromptPage.name} is linked to your account.`);
    setConnectPromptPage(null);
    refresh();
  };

  const handleCreateCommunity = (payload: {
    name: string;
    description: string;
    visibility: CommunityVisibility;
  }) => {
    if (!userId) return;
    createCommunity({ ...payload, ownerId: userId, ownerName: authorName });
    setShowCreateCommunity(false);
    showSuccessToast('Circle created');
    refresh();
  };

  const handleCreateCompany = (payload: { domainOrName: string; displayName: string }) => {
    if (!userId) return;
    const result = upsertCompanyPage({
      domainOrName: payload.domainOrName,
      displayName: payload.displayName,
      userId,
      email: user?.email,
    });
    if (result.error && !result.created) {
      showErrorToast('Company page', result.error);
      if (result.page) {
        handleConnectCompany(result.page);
      }
      return;
    }
    setShowCreateCompany(false);
    showSuccessToast('Company page created', 'Unique page for this company is ready.');
    refresh();
  };

  const pickMedia = async (file: File | null, type: CommunityPostType) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showErrorToast('File too large', 'Keep media under 4 MB for now.');
      return;
    }
    const url = await fileToDataUrl(file);
    setMediaPreview(url);
    setMediaMime(file.type);
    setComposeType(type);
  };

  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = await fileToDataUrl(new File([blob], 'voice.webm', { type: 'audio/webm' }));
        setMediaPreview(url);
        setMediaMime('audio/webm');
        setComposeType('voice');
        setRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      showErrorToast('Mic unavailable', 'Allow microphone access to record voice.');
    }
  };

  const handlePost = async () => {
    if (!userId || !composeTarget) return;
    if (!hasAccount) {
      setShowCreateAccount(true);
      return;
    }
    if (!composeText.trim() && !mediaPreview) {
      showErrorToast('Empty post', 'Add text or media.');
      return;
    }
    setPosting(true);
    try {
      const post = createPost({
        communityId: composeTarget.kind === 'community' ? composeTarget.id : undefined,
        companyPageId: composeTarget.kind === 'company' ? composeTarget.id : undefined,
        authorId: userId,
        authorName,
        text: composeText,
        type: mediaPreview ? composeType : 'text',
        mediaUrl: mediaPreview || undefined,
        mediaMime,
      });
      if (!post) {
        showErrorToast('Could not post', 'Join or connect first.');
        return;
      }
      setComposeText('');
      setMediaPreview(null);
      setMediaMime(undefined);
      setComposeType('text');
      showSuccessToast('Posted');
      refresh();
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPosting(false);
    }
  };

  const handleLike = (postId: string) => {
    if (!userId) return;
    toggleLike(postId, userId);
    refresh();
  };

  const handleSendComment = () => {
    if (!userId || !commentPostId) return;
    const c = addComment({
      postId: commentPostId,
      authorId: userId,
      authorName,
      text: commentText,
    });
    if (!c) {
      showErrorToast('Comment failed');
      return;
    }
    setCommentText('');
    setCommentThread(getCommentsForPost(commentPostId));
    refresh();
  };

  if (authLoading) return <GlobalLoader />;

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Office Gossips</h1>
        <p className="mt-3 text-slate-600">Sign in to join circles and company pages.</p>
      </main>
    );
  }

  const hideScroll =
    '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';
  const card =
    'rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]';
  const visibleHot = showAllHot ? hotCircles : hotCircles.slice(0, 4);
  const activeCompany = companyPages[companySlide % Math.max(companyPages.length, 1)];

  return (
    <div className="h-[calc(100dvh-var(--app-header-height,96px))] overflow-hidden bg-[#EEF3F8]">
      <div className="mx-auto flex h-full max-w-[1128px] flex-col px-3 pb-2 pt-3 sm:px-4">
        {/* LinkedIn-style 3 columns — each column scrolls independently */}
        <div className="grid min-h-0 flex-1 items-stretch gap-3 lg:grid-cols-[225px_minmax(0,1fr)] xl:grid-cols-[225px_minmax(0,1fr)_300px]">
          {/* LEFT — profile + circles (own scroll) */}
          <aside
            className={`hidden h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pb-4 lg:flex ${hideScroll}`}
          >            <div className={`${card} overflow-hidden`}>
              <div className="h-14 bg-gradient-to-r from-[#1B3A5F] via-[#1E5A8A] to-[#28A8E1]" />
              <div className="-mt-8 px-3 pb-3 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-gradient-to-br from-sky-100 to-sky-50 text-lg font-bold text-[#1B3A5F] shadow-md">
                  {user?.profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profilePhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    authorName.slice(0, 1).toUpperCase()
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-slate-900">{authorName}</p>
                <p className="truncate text-xs text-slate-500">
                  {workDomain ? `@${workDomain}` : 'Office Gossips'}
                </p>
                <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  {joined.length} circles · {connectedCompanies.length} companies
                </p>
              </div>
            </div>

            <div className={`${card} flex min-h-0 flex-1 flex-col overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <h2 className="text-xs font-bold text-slate-700">Circles</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(true)}
                  className="rounded-full p-1 text-[#28A8E1] hover:bg-sky-50"
                  title="Create circle"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <ul className={`space-y-0 overflow-y-auto ${hideScroll}`}>
                {communities.map((c) => {
                  const isMember = Boolean(userId && c.memberIds.includes(userId));
                  return (
                    <li
                      key={c.id}
                      className="border-b border-slate-50 px-3 py-2.5 last:border-0 hover:bg-slate-50/80"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1B3A5F] text-amber-300">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                            {c.visibility === 'private' ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Globe2 className="h-3 w-3" />
                            )}
                            {c.memberIds.length} members
                          </p>
                          <button
                            type="button"
                            onClick={() => (isMember ? handleLeave(c.id) : handleJoin(c.id))}
                            className={`mt-1.5 text-xs font-semibold ${
                              isMember ? 'text-slate-500 hover:text-rose-600' : 'text-[#28A8E1]'
                            }`}
                          >
                            {isMember ? 'Leave' : 'Join'}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* CENTER — search + feed / company page */}
          <section className="flex min-h-0 min-w-0 flex-col gap-2.5">
            <div className="relative shrink-0">
              <div className={`${card} flex items-center gap-2 px-3 py-2`}>
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setSearchOpen(false), 180);
                  }}
                  placeholder="Search people, companies, circles, posts…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                {companySearch || selectedCompany || selectedProfileUserId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanySearch('');
                      setSelectedCompanyId(null);
                      setSelectedProfileUserId(null);
                      setHighlightPostId(null);
                      setSearchOpen(false);
                    }}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Clear / back to feed"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              {searchOpen && companySearch.trim() ? (
                <ul
                  className={`${card} absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto py-1 shadow-lg`}
                >
                  {companySearchResults.map((hit) => (
                    <li key={`${hit.kind}-${hit.id}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (hit.kind === 'company') {
                            openCompanyPage(hit.id);
                          } else if (hit.kind === 'circle') {
                            setSelectedCompanyId(null);
                            setSelectedProfileUserId(null);
                            handleJoin(hit.id);
                            showSuccessToast('Circle', hit.title);
                          } else if (hit.kind === 'post') {
                            setSelectedProfileUserId(null);
                            setSelectedCompanyId(hit.companyPageId || null);
                            setHighlightPostId(hit.id);
                            window.setTimeout(() => {
                              document
                                .getElementById(`og-post-${hit.id}`)
                                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 80);
                          } else if (hit.kind === 'person') {
                            openUserProfile(hit.id);
                          }
                          setCompanySearch('');
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-sky-50"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            hit.kind === 'company'
                              ? 'bg-[#1B3A5F] text-white'
                              : hit.kind === 'circle'
                                ? 'bg-amber-100 text-amber-800'
                                : hit.kind === 'person'
                                  ? 'bg-sky-100 text-[#1B3A5F]'
                                  : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {hit.kind === 'company'
                            ? (hit as Extract<CommunitySearchHit, { kind: 'company' }>).letter
                            : hit.kind === 'circle'
                              ? '○'
                              : hit.kind === 'person'
                                ? hit.title.slice(0, 1).toUpperCase()
                                : '≡'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {hit.title}
                            </span>
                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                              {hit.kind}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {hit.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                  {companySearchResults.length === 0 ? (
                    <li className="px-3 py-4 text-center text-xs text-slate-400">
                      No matches for “{companySearch.trim()}”
                    </li>
                  ) : null}
                </ul>
              ) : searchOpen && !companySearch.trim() ? (
                <div
                  className={`${card} absolute left-0 right-0 top-full z-30 mt-1 px-3 py-3 text-xs text-slate-500 shadow-lg`}
                >
                  Try a name, company, circle, or words from a post.
                </div>
              ) : null}
            </div>

            {!selectedCompany && !selectedProfileUserId ? (
              <div className="flex shrink-0 items-center justify-between px-0.5">
                <p className="text-xs font-semibold text-slate-500">
                  Feed <span className="font-normal text-slate-400">· {feed.length}</span>
                </p>
              </div>
            ) : null}

            <div
              ref={feedRef}
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 ${hideScroll} ${
                selectedCompany || selectedProfileUserId ? '' : 'space-y-2.5'
              }`}
            >
              {selectedProfileUserId && userId ? (
                <UserProfileView
                  profileUserId={selectedProfileUserId}
                  viewerId={userId}
                  viewerName={authorName}
                  posts={feed}
                  companies={companyPages}
                  onBack={() => setSelectedProfileUserId(null)}
                  onOpenCompany={openCompanyPage}
                  onRefresh={refresh}
                  onOpenChat={openChat}
                  renderPost={(post) => {
                    const liked = Boolean(userId && post.likeIds.includes(userId));
                    const commentCount = getCommentsForPost(post.id).length;
                    return (
                      <article className={`${card} p-3.5 sm:p-4`}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#1B3A5F]">
                            {post.authorName.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {post.authorName}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {timeAgo(post.createdAt)}
                            </p>
                            {post.text ? (
                              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                                {post.text}
                              </p>
                            ) : null}
                            <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-1.5">
                              <button
                                type="button"
                                onClick={() => handleLike(post.id)}
                                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                                  liked
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                                {post.likeIds.length || 'Like'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openComments(post.id)}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                <MessageCircle className="h-4 w-4" />
                                {commentCount || 'Comment'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }}
                />
              ) : selectedCompany && userId ? (
                <CompanyPageView
                  company={selectedCompany}
                  userId={userId}
                  authorName={authorName}
                  posts={feed}
                  isConnected={selectedCompany.memberIds.includes(userId)}
                  canConnect={canConnectToCompany(selectedCompany, {
                    email: user?.email,
                    cvCompanies,
                  })}
                  onBack={() => setSelectedCompanyId(null)}
                  onConnect={() => handleConnectCompany(selectedCompany)}
                  onRefresh={refresh}
                  onOpenChat={openChat}
                  onOpenProfile={openUserProfile}
                  renderPost={(post) => {
                    const liked = Boolean(userId && post.likeIds.includes(userId));
                    const commentCount = getCommentsForPost(post.id).length;
                    return (
                      <article className={`${card} p-3.5 sm:p-4`}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#1B3A5F]">
                            {post.authorName.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {post.authorName}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {timeAgo(post.createdAt)}
                            </p>
                            {post.text ? (
                              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                                {post.text}
                              </p>
                            ) : null}
                            <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-1.5">
                              <button
                                type="button"
                                onClick={() => handleLike(post.id)}
                                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                                  liked
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                                {post.likeIds.length || 'Like'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openComments(post.id)}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                <MessageCircle className="h-4 w-4" />
                                {commentCount || 'Comment'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }}
                />
              ) : (
                <>
              {feed.map((post) => {
                const community = post.communityId
                  ? communities.find((c) => c.id === post.communityId)
                  : null;
                if (community && !canViewCommunity(community, userId)) return null;
                const liked = Boolean(userId && post.likeIds.includes(userId));
                const commentCount = getCommentsForPost(post.id).length;
                const place = post.companyName || post.communityName || 'Office Gossips';
                return (
                  <article
                    id={`og-post-${post.id}`}
                    key={post.id}
                    className={`${card} p-3.5 sm:p-4 ${
                      highlightPostId === post.id ? 'ring-2 ring-[#28A8E1]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#1B3A5F]">
                        {post.authorName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          <button
                            type="button"
                            onClick={() => openUserProfile(post.authorId)}
                            className="hover:text-[#0A66C2] hover:underline"
                          >
                            {post.authorName}
                          </button>
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                          <button
                            type="button"
                            onClick={() => {
                              if (post.companyPageId) openCompanyPage(post.companyPageId);
                            }}
                            className="inline-flex items-center gap-1 font-medium text-[#0A66C2] hover:underline"
                          >
                            {post.companyPageId ? (
                              <Briefcase className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            {place}
                          </button>
                          <span>·</span>
                          <span>{timeAgo(post.createdAt)}</span>
                        </p>
                        {post.text ? (
                          <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                            {post.text}
                          </p>
                        ) : null}
                        {post.mediaUrl && post.type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.mediaUrl}
                            alt=""
                            className="mt-3 max-h-96 w-full rounded-lg object-cover"
                          />
                        ) : null}
                        {post.mediaUrl && post.type === 'video' ? (
                          <video
                            src={post.mediaUrl}
                            controls
                            className="mt-3 max-h-96 w-full rounded-lg bg-black"
                          />
                        ) : null}
                        {post.mediaUrl && post.type === 'voice' ? (
                          <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                            <Mic className="h-4 w-4 text-slate-500" />
                            <audio src={post.mediaUrl} controls className="w-full" />
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-1.5">
                          <button
                            type="button"
                            onClick={() => handleLike(post.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                              liked
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                            {post.likeIds.length ? post.likeIds.length : 'Like'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openComments(post.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                              commentPostId === post.id
                                ? 'bg-sky-50 text-[#0A66C2]'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <MessageCircle className="h-4 w-4" />
                            {commentCount ? commentCount : 'Comment'}
                          </button>
                        </div>

                        {commentPostId === post.id ? (
                          <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                            <div className={`max-h-40 space-y-2 overflow-y-auto ${hideScroll}`}>
                              {commentThread.map((c) => (
                                <div key={c.id} className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                                  <p className="text-xs font-semibold text-slate-800">
                                    {c.authorName}{' '}
                                    <span className="font-normal text-slate-400">
                                      · {timeAgo(c.createdAt)}
                                    </span>
                                  </p>
                                  <p className="text-sm text-slate-700">{c.text}</p>
                                </div>
                              ))}
                              {commentThread.length === 0 ? (
                                <p className="px-1 text-xs text-slate-400">
                                  Be the first to comment.
                                </p>
                              ) : null}
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSendComment();
                                }}
                                placeholder="Write a comment…"
                                className="min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#28A8E1]"
                              />
                              <button
                                type="button"
                                onClick={handleSendComment}
                                title="Send"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 transition hover:bg-sky-100"
                              >
                                <ComposeAssetIcon src="/icons/send.png" alt="Send" size={18} />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
              {feed.length === 0 ? (
                <div className={`${card} px-5 py-14 text-center text-sm text-slate-500`}>
                  No posts yet — join a circle or connect your company page.
                </div>
              ) : null}
                </>
              )}
            </div>

            {/* Mobile create shortcuts */}
            <div className="flex gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setShowCreateCommunity(true)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Create circle
              </button>
              <button
                type="button"
                onClick={() => setShowCreateCompany(true)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                Company page
              </button>
            </div>

            {/* Add post — below feed */}
            <div className={`${card} shrink-0 p-3 sm:p-3.5`}>
              {composeOptions.length === 0 ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">Join a circle to post</p>
                  <p className="mt-1 text-xs text-slate-500">
                    You need to join or create a circle (or connect a company page) before you can
                    share gossip.
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const first = communities[0];
                        if (first) handleJoin(first.id);
                      }}
                      className="rounded-full bg-(--brand-primary) px-4 py-2 text-xs font-semibold text-white"
                    >
                      Join a circle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateCommunity(true)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Create circle
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <select
                      value={
                        composeTarget
                          ? `${composeTarget.kind}:${composeTarget.id}`
                          : composeOptions[0]?.value
                      }
                      onChange={(e) => {
                        const opt = composeOptions.find((o) => o.value === e.target.value);
                        if (opt) setComposeTarget(opt.target);
                      }}
                      className="max-w-[220px] truncate rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700"
                    >
                      {composeOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400">Posting to</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#1B3A5F]">
                      {authorName.slice(0, 1).toUpperCase()}
                    </div>
                    <textarea
                      ref={composeInputRef}
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      rows={2}
                      placeholder="Spill the gossip… use @ to tag someone"
                      className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#28A8E1] focus:bg-white"
                    />
                    <button
                      type="button"
                      disabled={posting}
                      onClick={() => void handlePost()}
                      title="Send"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 ring-1 ring-sky-100 transition hover:bg-sky-100 disabled:opacity-50"
                    >
                      {posting ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#28A8E1]" />
                      ) : (
                        <ComposeAssetIcon src="/icons/send.png" alt="Send" size={22} />
                      )}
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        void pickMedia(f, 'image');
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={insertAtMention}
                      title="Tag someone"
                      aria-label="Tag someone"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-50"
                    >
                      <ComposeAssetIcon src="/icons/email.png" alt="Tag" size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Add image"
                      aria-label="Add image"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-50"
                    >
                      <ComposeAssetIcon src="/icons/image-.png" alt="Image" size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        recording ? mediaRecorderRef.current?.stop() : void startVoice()
                      }
                      title={recording ? 'Stop recording' : 'Voice note'}
                      aria-label={recording ? 'Stop recording' : 'Voice note'}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-50 ${
                        recording ? 'ring-1 ring-rose-300 bg-rose-50' : ''
                      }`}
                    >
                      <ComposeAssetIcon
                        src="/icons/waveform-path.png"
                        alt="Voice"
                        size={20}
                      />
                    </button>
                    {mediaPreview ? (
                      <span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-500">
                        Image attached
                        <button
                          type="button"
                          className="font-semibold text-rose-600"
                          onClick={() => {
                            setMediaPreview(null);
                            setComposeType('text');
                          }}
                        >
                          Remove
                        </button>
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* RIGHT — hot + inbox + companies */}
          <aside
            className={`hidden h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pb-6 xl:flex ${hideScroll}`}
          >
            {/* Hot circles — LinkedIn News style */}
            <div className={`${card} shrink-0 overflow-hidden`}>
              <div className="flex items-start justify-between px-3.5 pt-3.5">
                <div>
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Hot circles
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Most active right now</p>
                </div>
                <span title="Ranked by posts, likes & comments">
                  <Info className="h-4 w-4 text-slate-400" />
                </span>
              </div>
              <ul className="mt-2 px-1.5 pb-1">
                {visibleHot.map(({ community, label, engagement }) => {
                  const isMember = Boolean(userId && community.memberIds.includes(userId));
                  return (
                    <li key={community.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isMember) handleJoin(community.id);
                        }}
                        className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-sky-50/80"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#28A8E1]" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-slate-900">
                              {community.name}
                            </span>
                            {community.visibility === 'private' ? (
                              <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                            ) : (
                              <Globe2 className="h-3 w-3 shrink-0 text-emerald-500" />
                            )}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {label}
                            {engagement > 0 ? ` · ${engagement} engagement` : ''}
                            {community.visibility === 'private' ? ' · Private' : ' · Public'}
                          </span>
                        </span>
                        {!isMember ? (
                          <span className="shrink-0 rounded-full border border-[#28A8E1] px-2.5 py-0.5 text-[11px] font-semibold text-[#28A8E1]">
                            Join
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                            In
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {hotCircles.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-slate-500">No circles yet.</li>
                ) : null}
              </ul>
              {hotCircles.length > 4 ? (
                <button
                  type="button"
                  onClick={() => setShowAllHot((v) => !v)}
                  className="flex w-full items-center gap-1 border-t border-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {showAllHot ? 'Show less' : 'Show more circles'}
                  <ChevronDown
                    className={`h-4 w-4 transition ${showAllHot ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : null}
            </div>

            {userId ? (
              <ReferenceCheckPanel
                userId={userId}
                activeChatId={referenceChatId}
                activeChatKind={referenceChatKind}
                onRefresh={refresh}
                onOpenCompany={openCompanyPage}
                onOpenChat={openChat}
              />
            ) : null}

            {/* Company pages — vertical slide carousel */}
            <div className={`${card} shrink-0 overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
                <h2 className="text-sm font-bold text-slate-900">Company pages</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateCompany(true)}
                  className="rounded-full p-1 text-[#28A8E1] hover:bg-sky-50"
                  title="Add company page"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {activeCompany ? (
                <div className="relative h-[168px] overflow-hidden">
                  <div
                    key={activeCompany.id}
                    className={`absolute inset-0 px-3.5 py-3 ${
                      companySlideDir === 'up'
                        ? 'animate-[ogSlideUp_0.55s_ease]'
                        : 'animate-[ogSlideDown_0.55s_ease]'
                    }`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openCompanyPage(activeCompany.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openCompanyPage(activeCompany.id);
                      }}
                      className="flex cursor-pointer items-start gap-3"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1B3A5F] text-base font-bold text-white">
                        {activeCompany.logoLetter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {activeCompany.name}
                          </p>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Suggested
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                          Get the latest on {activeCompany.name} — news, team chatter & more.
                        </p>
                        <p className="mt-1.5 text-[10px] text-slate-400">
                          {activeCompany.memberIds.length} connected
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (userId && activeCompany.memberIds.includes(userId)) {
                          openCompanyPage(activeCompany.id);
                        } else {
                          handleConnectCompany(activeCompany);
                        }
                      }}
                      className={`mt-3 w-full rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        userId && activeCompany.memberIds.includes(userId)
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'border border-[#28A8E1] text-[#28A8E1] hover:bg-sky-50'
                      }`}
                    >
                      {userId && activeCompany.memberIds.includes(userId)
                        ? 'View page'
                        : 'Connect'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="px-3 py-6 text-center text-xs text-slate-500">No company pages yet.</p>
              )}
              {companyPages.length > 1 ? (
                <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 py-2">
                  {companyPages.map((co, i) => (
                    <button
                      key={co.id}
                      type="button"
                      aria-label={`Show ${co.name}`}
                      onClick={() => {
                        setCompanySlideDir(i > companySlide ? 'up' : 'down');
                        setCompanySlide(i);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === companySlide % companyPages.length
                          ? 'w-4 bg-[#28A8E1]'
                          : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className={`${card} shrink-0 overflow-hidden bg-gradient-to-br from-white to-sky-50/60 p-3.5`}>
              <p className="text-sm font-bold text-slate-900">About Office Gossips</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Posts live in circles or company pages. Unlock reference chats with tokens like other
                premium services.
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(true)}
                  className="rounded-full bg-[#1B3A5F] px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
                >
                  Create circle
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCompany(true)}
                  className="rounded-full border border-[#28A8E1] bg-white px-3 py-2 text-xs font-semibold text-[#28A8E1] hover:bg-sky-50"
                >
                  Add company page
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {userId && referenceChatId && referenceChatKind ? (
        <ReferenceMessagingPanel
          kind={referenceChatKind}
          chatId={referenceChatId}
          userId={userId}
          onClose={closeChat}
          onRefresh={refresh}
        />
      ) : null}

      <style>{`
        @keyframes ogSlideUp {
          from { transform: translateY(32%); opacity: 0.25; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes ogSlideDown {
          from { transform: translateY(-32%); opacity: 0.25; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {showCreateCommunity ? (
        <CreateCommunityModal
          onClose={() => setShowCreateCommunity(false)}
          onCreate={handleCreateCommunity}
        />
      ) : null}
      {showCreateCompany ? (
        <CreateCompanyModal
          defaultDomain={workDomain || ''}
          onClose={() => setShowCreateCompany(false)}
          onCreate={handleCreateCompany}
        />
      ) : null}

      {showCreateAccount && userId ? (
        <CreateGossipAccountModal
          realName={realName}
          onCreated={() => {
            setShowCreateAccount(false);
            refresh();
            showSuccessToast('Account ready', 'Welcome to Office Gossips.');
          }}
          userId={userId}
        />
      ) : null}

      {connectPromptPage ? (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Connect to {connectPromptPage.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose whether teammates can see you in this company&apos;s connections.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <input
                type="checkbox"
                checked={connectShowInList}
                onChange={(e) => setConnectShowInList(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#28A8E1]"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Show in company connections
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Others on this company page can see you as a connected member.
                </span>
              </span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConnectPromptPage(null)}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmConnectCompany}
                className="rounded-full bg-(--brand-primary) px-4 py-2 text-sm font-semibold text-white"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreateCommunityModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (p: { name: string; description: string; visibility: CommunityVisibility }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<CommunityVisibility>('public');

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Create circle</h3>
        <p className="mt-1 text-sm text-slate-500">
          Public circles are visible without joining. Private ones need join to see posts.
        </p>
        <label className="mt-4 block text-sm font-semibold text-slate-800">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#28A8E1]"
            placeholder="e.g. Backend Banter"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-slate-800">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#28A8E1]"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
              visibility === 'public'
                ? 'border-[#28A8E1] bg-sky-50 text-[#1B3A5F]'
                : 'border-slate-300 text-slate-600'
            }`}
          >
            <Globe2 className="h-4 w-4" /> Public
          </button>
          <button
            type="button"
            onClick={() => setVisibility('private')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
              visibility === 'private'
                ? 'border-[#28A8E1] bg-sky-50 text-[#1B3A5F]'
                : 'border-slate-300 text-slate-600'
            }`}
          >
            <Lock className="h-4 w-4" /> Private
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={name.trim().length < 2}
            onClick={() =>
              onCreate({ name: name.trim(), description: description.trim(), visibility })
            }
            className="rounded-xl bg-(--brand-primary) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateCompanyModal({
  defaultDomain,
  onClose,
  onCreate,
}: {
  defaultDomain: string;
  onClose: () => void;
  onCreate: (p: { domainOrName: string; displayName: string }) => void;
}) {
  const [domainOrName, setDomainOrName] = useState(defaultDomain);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setDomainOrName(defaultDomain);
  }, [defaultDomain]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Add company page</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create requires your verified work email matching the domain (e.g. you@aitikit.com →
          aitikit.com). One unique page per domain. Anyone with that company on their CV can
          connect later — creating is domain-email only.
        </p>
        <label className="mt-4 block text-sm font-semibold text-slate-800">
          Work domain
          <input
            value={domainOrName}
            onChange={(e) => setDomainOrName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#28A8E1]"
            placeholder="aitikit.com"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-slate-800">
          Display name (optional)
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#28A8E1]"
            placeholder="AiTikit"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={domainOrName.trim().length < 2}
            onClick={() =>
              onCreate({
                domainOrName: domainOrName.trim(),
                displayName: displayName.trim(),
              })
            }
            className="rounded-xl bg-(--brand-primary) px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Create page
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateGossipAccountModal({
  userId,
  realName,
  onCreated,
}: {
  userId: string;
  realName: string;
  onCreated: () => void;
}) {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [username, setUsername] = useState('');
  const [showInCompanyConnections, setShowInCompanyConnections] = useState(true);
  const [availableForReferenceCheck, setAvailableForReferenceCheck] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAnonymous && !username) {
      setUsername(suggestAnonymousUsername());
    }
  }, [isAnonymous, username]);

  const submit = () => {
    setSaving(true);
    const result = createGossipAccount({
      userId,
      isAnonymous,
      username: isAnonymous ? username : username || undefined,
      showInCompanyConnections,
      availableForReferenceCheck,
    });
    setSaving(false);
    if (!result.ok) {
      showErrorToast('Could not create account', result.error);
      return;
    }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <h3 className="text-xl font-bold text-slate-900">Create your Office Gossips account</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          One-time setup before you join circles, post, or connect to company pages.
          You can change these anytime in Settings.
        </p>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          Signed in as <span className="font-semibold text-slate-900">{realName}</span>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => {
              const next = e.target.checked;
              setIsAnonymous(next);
              if (next) setUsername(suggestAnonymousUsername());
              else setUsername('');
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#28A8E1]"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">Be anonymous</span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Others see your username instead of your real name.
            </span>
          </span>
        </label>

        {isAnonymous ? (
          <label className="mt-3 block text-sm font-semibold text-slate-800">
            Unique username
            <div className="mt-1.5 flex gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(normalizeGossipUsername(e.target.value))}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#28A8E1]"
                placeholder="quiet_fox42"
              />
              <button
                type="button"
                onClick={() => setUsername(suggestAnonymousUsername())}
                className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Change name
              </button>
            </div>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Preview: {username || 'username'}
            </span>
          </label>
        ) : null}

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={showInCompanyConnections}
            onChange={(e) => setShowInCompanyConnections(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#28A8E1]"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Show in company connections
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Appear as a connected member on company pages you join.
            </span>
          </span>
        </label>

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 px-3 py-3 hover:bg-slate-50">
          <input
            type="checkbox"
            checked={availableForReferenceCheck}
            onChange={(e) => setAvailableForReferenceCheck(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#28A8E1]"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Available for reference check
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Let others request you as a reference on company pages. Default fee is 5 tokens
              (set 1–20 in Settings).
            </span>
          </span>
        </label>

        <button
          type="button"
          disabled={saving || (isAnonymous && !username)}
          onClick={submit}
          className="mt-5 w-full rounded-full bg-(--brand-primary) px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create account & continue'}
        </button>
      </div>
    </div>
  );
}
