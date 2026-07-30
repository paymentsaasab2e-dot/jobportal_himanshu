'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Eye,
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
  Building2,
  ArrowLeftRight,
  ArrowLeft,
  X,
  Home,
  Calendar,
  MapPin,
  Bookmark,
  Share2,
  Video,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  companyFollowerCount,
  pendingDmIncomingCount,
  pendingFollowIncomingCount,
} from '@/lib/social-store';
import {
  ensureHryantraVerifiedChat,
  installHryantraHqChatListener,
} from '@/lib/hryantra-verified-chat-store';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';
import {
  eventTypeLabel,
  filterJobsForProfile,
  listEventsForProfile,
  mapJobsToOgEvents,
  mergeEventsWithJobs,
  type OgEventPost,
  type OgEventType,
} from '@/lib/og-events-store';
import {
  fetchPortalJobsList,
  fetchPortalPersonalizedJobs,
} from '@/lib/query/portal-api';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { CompanyPageView } from '@/components/community/CompanyPageView';
import { ProfileViewsPanel } from '@/components/community/ProfileViewsPanel';
import { ReferenceCheckPanel } from '@/components/community/ReferenceCheckPanel';
import { ReferenceMessagingPanel } from '@/components/community/ReferenceMessagingPanel';
import { UserProfileView } from '@/components/community/UserProfileView';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders, resolveCandidateIdForApi } from '@/lib/auth-storage';
import { heartbeatPresence } from '@/lib/presence';
import {
  PROFILE_VIEWS_UPDATED_EVENT,
  countLockedProfileViews,
  countRecentProfileViews,
  ensureDemoProfileViews,
} from '@/lib/profile-view-store';
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
  getOwnedCompanyPages,
  getJoinedCommunities,
  getVisibleFeed,
  hasGossipAccount,
  isGossipSetupDone,
  markGossipSetupDone,
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
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  type OgTab = 'feed' | 'communities' | 'chat' | 'events';
  const [ogTab, setOgTab] = useState<OgTab>('feed');
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | OgEventType>('all');
  const [eventInterested, setEventInterested] = useState<Record<string, boolean>>({});
  const [jobsFromPersonalized, setJobsFromPersonalized] = useState(false);
  const [jobEvents, setJobEvents] = useState<OgEventPost[]>([]);
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
  const [showProfileViews, setShowProfileViews] = useState(false);
  const [profileViewTick, setProfileViewTick] = useState(0);
  const [referenceChatId, setReferenceChatId] = useState<string | null>(null);
  const [referenceChatKind, setReferenceChatKind] = useState<ChatKind | null>(null);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);
  const [actingCompanyId, setActingCompanyId] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
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
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('views') === '1') {
      setShowProfileViews(true);
      params.delete('views');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, []);

  useEffect(() => {
    const onUp = () => setProfileViewTick((n) => n + 1);
    window.addEventListener(PROFILE_VIEWS_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(PROFILE_VIEWS_UPDATED_EVENT, onUp);
  }, []);

  useEffect(() => {
    // First-login only: never re-prompt after account exists or setup was completed
    if (!authLoading && isAuthenticated && userId && !isGossipSetupDone(userId)) {
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
  const ownedCompanies = useMemo(
    () => (userId ? getOwnedCompanyPages(userId) : []),
    [userId, companyPages],
  );
  const actingCompany = useMemo(
    () => ownedCompanies.find((c) => c.id === actingCompanyId) || null,
    [ownedCompanies, actingCompanyId],
  );
  const isCompanyAccount = Boolean(actingCompany);

  useEffect(() => {
    if (!userId || isCompanyAccount) return;
    ensureDemoProfileViews(userId);
  }, [userId, isCompanyAccount]);

  const lockedProfileViews = useMemo(
    () => (userId ? countLockedProfileViews(userId) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, profileViewTick, showProfileViews],
  );
  const recentProfileViews = useMemo(
    () => (userId ? countRecentProfileViews(userId) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, profileViewTick, showProfileViews],
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
    // Company pages + reference live on the Reference Check platform
    router.push(`/reference-check?company=${encodeURIComponent(pageId)}`);
  };

  const openUserProfile = (profileUserId: string) => {
    if (isCompanyAccount) return;
    setSelectedCompanyId(null);
    setSelectedProfileUserId(profileUserId);
    setSearchOpen(false);
    setCompanySearch('');
    setHighlightPostId(null);
  };

  const switchToPersonalAccount = () => {
    setActingCompanyId(null);
    setAccountMenuOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('saasa:og-acting-company');
    }
    showSuccessToast('Personal account', 'Viewing as yourself.');
  };

  const switchToCompanyAccount = (companyId: string) => {
    const page = ownedCompanies.find((c) => c.id === companyId);
    if (!page) return;
    setActingCompanyId(companyId);
    setAccountMenuOpen(false);
    setSelectedProfileUserId(null);
    setSelectedCompanyId(companyId);
    setComposeTarget({ kind: 'company', id: companyId });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('saasa:og-acting-company', companyId);
    }
    showSuccessToast('Company account', `Now viewing as ${page.name}.`);
  };

  useEffect(() => {
    if (!userId || ownedCompanies.length === 0) return;
    const saved =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('saasa:og-acting-company')
        : null;
    if (saved && ownedCompanies.some((c) => c.id === saved)) {
      setActingCompanyId(saved);
      setSelectedCompanyId(saved);
      setComposeTarget({ kind: 'company', id: saved });
    }
  }, [userId, ownedCompanies]);

  useEffect(() => {
    if (!actingCompany) return;
    if (selectedCompanyId !== actingCompany.id) {
      setSelectedCompanyId(actingCompany.id);
    }
    setSelectedProfileUserId(null);
  }, [actingCompany, selectedCompanyId]);

  const openChat = (kind: ChatKind, id: string) => {
    if (kind === 'reference') {
      router.push('/reference-check');
      return;
    }
    setOgTab('chat');
    setReferenceChatKind(kind);
    setReferenceChatId(id);
  };

  const closeChat = () => {
    setReferenceChatId(null);
    setReferenceChatKind(null);
  };

  useEffect(() => {
    if (!userId) return;
    ensureHryantraVerifiedChat(userId);
    return installHryantraHqChatListener();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const openVerified = (chatId?: string) => {
      const id = chatId || ensureHryantraVerifiedChat(userId)?.id;
      if (!id) return;
      setOgTab('chat');
      setReferenceChatKind('hryantra');
      setReferenceChatId(id);
    };

    try {
      const pending = sessionStorage.getItem('saasa:open-hryantra-chat');
      if (pending) {
        sessionStorage.removeItem('saasa:open-hryantra-chat');
        openVerified(pending);
      }
    } catch {
      /* ignore */
    }

    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ chatId?: string }>).detail;
      openVerified(detail?.chatId);
    };
    window.addEventListener('saasa:open-hryantra-chat', onOpen);
    return () => window.removeEventListener('saasa:open-hryantra-chat', onOpen);
  }, [userId]);

  const composeOptions = useMemo(() => {
    const opts: { value: string; label: string; target: ComposeTarget }[] = [];
    if (isCompanyAccount && actingCompany) {
      opts.push({
        value: `company:${actingCompany.id}`,
        label: `🏢 ${actingCompany.name}`,
        target: { kind: 'company', id: actingCompany.id },
      });
      return opts;
    }
    for (const c of joined) {
      opts.push({
        value: `community:${c.id}`,
        label: `👥 ${c.name}`,
        target: { kind: 'community', id: c.id },
      });
    }
    // Company posting lives on Reference Check — keep OG to communities only
    return opts;
  }, [joined, isCompanyAccount, actingCompany]);

  useEffect(() => {
    if (!composeTarget && composeOptions.length > 0) {
      setComposeTarget(composeOptions[0].target);
    }
  }, [composeOptions, composeTarget]);

  const activeCommunity = useMemo(
    () => communities.find((c) => c.id === activeCommunityId) || null,
    [communities, activeCommunityId],
  );

  const displayFeed = useMemo(() => {
    // Office Gossips = community posts only (company pages moved to Reference Check)
    let posts = feed.filter((p) => Boolean(p.communityId));
    if (ogTab === 'communities' && activeCommunityId) {
      posts = posts.filter((p) => p.communityId === activeCommunityId);
    }
    return posts;
  }, [feed, ogTab, activeCommunityId]);

  const openCommunityRoom = (communityId: string) => {
    setActiveCommunityId(communityId);
    setOgTab('communities');
    setSelectedCompanyId(null);
    setSelectedProfileUserId(null);
    setComposeTarget({ kind: 'community', id: communityId });
    setSearchOpen(false);
  };

  const profileEventText = useMemo(() => {
    const bits = [
      realName,
      authorName,
      user?.email,
      workDomain,
      ...(joined.map((c) => c.name) || []),
    ];
    return bits.filter(Boolean).join(' ').toLowerCase();
  }, [realName, authorName, user?.email, workDomain, joined]);

  const profileEvents = useMemo(() => {
    const matched = listEventsForProfile(profileEventText);
    const relevantJobs = filterJobsForProfile(jobEvents, profileEventText, {
      preferAll: jobsFromPersonalized,
      limit: 6,
    });
    return mergeEventsWithJobs(matched, relevantJobs);
  }, [profileEventText, jobEvents, jobsFromPersonalized]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return profileEvents;
    return profileEvents.filter((e) => e.type === eventFilter);
  }, [profileEvents, eventFilter]);

  useEffect(() => {
    if (ogTab !== 'events') return;
    let cancelled = false;
    (async () => {
      try {
        const candidateId = resolveCandidateIdForApi(userId);
        let jobs: unknown[] = [];
        let personalized = false;
        if (candidateId) {
          jobs = await fetchPortalPersonalizedJobs(candidateId, DEFAULT_LOCALE);
          personalized = jobs.length > 0;
        }
        if (!jobs.length) {
          jobs = await fetchPortalJobsList(DEFAULT_LOCALE, 12);
        }
        if (!cancelled) {
          setJobsFromPersonalized(personalized);
          setJobEvents(mapJobsToOgEvents(jobs, personalized ? 8 : 12));
        }
      } catch {
        if (!cancelled) {
          setJobsFromPersonalized(false);
          setJobEvents([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ogTab, userId]);

  const openJobEvent = (ev: OgEventPost) => {
    if (ev.type !== 'job') return;
    void import('@/lib/user-activity-tracker').then((m) => {
      m.trackCustomActivityForCurrentUser({
        type: 'page_visit',
        category: 'community',
        path: `/community/events/job/${ev.jobId || ev.id}`,
        meta: {
          companyId: ev.hostName,
          companyName: ev.hostName,
          jobTitle: ev.title,
          roleKey: ev.title.toLowerCase().split(/[^a-z0-9+.#]+/).slice(0, 3).join('-'),
          sourceSurface: 'office_gossips_event',
        },
      });
    });
    const href =
      ev.actionHref ||
      (ev.jobId ? `/explore-jobs?job=${encodeURIComponent(ev.jobId)}` : '/explore-jobs');
    router.push(href);
  };

  const followPendingCount = useMemo(
    () => (userId ? pendingFollowIncomingCount(userId) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, feed, referenceChatId],
  );

  const dmPendingCount = useMemo(
    () => (userId ? pendingDmIncomingCount(userId) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, feed, referenceChatId],
  );

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
      <div className="mx-auto flex h-full w-full max-w-[1520px] flex-col px-3 pb-[4.25rem] pt-3 sm:px-5 lg:px-6">
        {/* Top bar — profile views + account switcher */}
        {!isCompanyAccount || ownedCompanies.length > 0 ? (
          <div className="relative mb-2 flex shrink-0 items-center justify-between gap-2">
            {!isCompanyAccount ? (
              <button
                type="button"
                onClick={() => setShowProfileViews(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#28A8E1] hover:text-[#0A66C2] lg:hidden"
              >
                <Eye className="h-3.5 w-3.5" />
                Who viewed you
                {lockedProfileViews > 0 ? (
                  <span className="rounded-full bg-[#0A66C2] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {lockedProfileViews}
                  </span>
                ) : null}
              </button>
            ) : (
              <span />
            )}
            {ownedCompanies.length > 0 ? (
          <div className="relative ml-auto flex shrink-0 items-center justify-end">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition ${
                isCompanyAccount
                  ? 'border-[#1B3A5F]/20 bg-[#1B3A5F] text-white hover:bg-[#16324f]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-[#28A8E1] hover:text-[#0A66C2]'
              }`}
            >
              {isCompanyAccount ? (
                <Building2 className="h-3.5 w-3.5" />
              ) : (
                <ArrowLeftRight className="h-3.5 w-3.5" />
              )}
              {isCompanyAccount
                ? `Company · ${actingCompany?.name}`
                : 'Switch account'}
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${accountMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {accountMenuOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 cursor-default"
                  aria-label="Close account menu"
                  onClick={() => setAccountMenuOpen(false)}
                />
                <div
                  className={`${card} absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden py-1 shadow-lg`}
                >
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    View as
                  </p>
                  <button
                    type="button"
                    onClick={switchToPersonalAccount}
                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-sky-50 ${
                      !isCompanyAccount ? 'bg-sky-50/80 font-semibold text-[#0A66C2]' : 'text-slate-800'
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#1B3A5F]">
                      {authorName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{authorName}</span>
                      <span className="block text-[11px] text-slate-500">Personal account</span>
                    </span>
                  </button>
                  {ownedCompanies.map((co) => (
                    <button
                      key={co.id}
                      type="button"
                      onClick={() => switchToCompanyAccount(co.id)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-sky-50 ${
                        actingCompanyId === co.id
                          ? 'bg-sky-50/80 font-semibold text-[#0A66C2]'
                          : 'text-slate-800'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1B3A5F] text-xs font-bold text-white">
                        {co.logoLetter}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{co.name}</span>
                        <span className="block text-[11px] text-slate-500">
                          Company page · {companyFollowerCount(co.id)} followers
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
            ) : null}
          </div>
        ) : null}

        {/* Feed / open community room */}
        <div
          className={`grid min-h-0 flex-1 items-stretch gap-4 ${
            ogTab === 'feed'
              ? 'lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]'
              : 'grid-cols-1'
          } ${
            ogTab === 'feed' || (ogTab === 'communities' && activeCommunityId)
              ? ''
              : 'hidden'
          }`}
        >
          {/* LEFT — profile + circles (own scroll) */}
          <aside
            className={`h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pb-4 ${hideScroll} ${
              ogTab === 'feed' ? 'hidden lg:flex' : 'hidden'
            }`}
          >
            <div className={`${card} overflow-hidden`}>
              <div className="h-14 bg-gradient-to-r from-[#1B3A5F] via-[#1E5A8A] to-[#28A8E1]" />
              <div className="-mt-8 px-3 pb-3 text-center">
                {isCompanyAccount && actingCompany ? (
                  <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-[3px] border-white bg-[#1B3A5F] text-xl font-bold text-white shadow-md">
                      {actingCompany.logoLetter}
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                      {actingCompany.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">@{actingCompany.domainKey}</p>
                    <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                      {actingCompany.memberIds.length} connections ·{' '}
                      {companyFollowerCount(actingCompany.id)} followers
                    </p>
                    <p className="mt-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                      Company account
                    </p>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {!isCompanyAccount ? (
              <button
                type="button"
                onClick={() => setShowProfileViews(true)}
                className={`${card} flex w-full items-center gap-3 px-3 py-3 text-left transition hover:border-[#28A8E1]/40 hover:bg-sky-50/50`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[#0A66C2]">
                  <Eye className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-slate-800">Who viewed you</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">
                    {recentProfileViews === 0
                      ? 'No views yet'
                      : `${recentProfileViews} view${recentProfileViews === 1 ? '' : 's'} this week`}
                    {lockedProfileViews > 0
                      ? ` · ${lockedProfileViews} locked`
                      : ''}
                  </span>
                </span>
                {lockedProfileViews > 0 ? (
                  <span className="rounded-full bg-[#0A66C2] px-2 py-0.5 text-[10px] font-bold text-white">
                    {lockedProfileViews}
                  </span>
                ) : null}
              </button>
            ) : null}

            {!isCompanyAccount ? (
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
                          <button
                            type="button"
                            onClick={() => {
                              if (!isMember) handleJoin(c.id);
                              openCommunityRoom(c.id);
                            }}
                            className="truncate text-left text-sm font-semibold text-slate-900 hover:text-[#0A66C2]"
                          >
                            {c.name}
                          </button>
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
            ) : (
              <div className={`${card} p-3.5`}>
                <p className="text-xs font-bold text-slate-700">Page tools</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Circles are personal-only. As a company account you manage posts, people, and
                  followers on this page.
                </p>
                <button
                  type="button"
                  onClick={() => actingCompany && openCompanyPage(actingCompany.id)}
                  className="mt-3 w-full rounded-full bg-[#0A66C2] px-3 py-2 text-xs font-semibold text-white hover:bg-[#004182]"
                >
                  Open company page
                </button>
              </div>
            )}
          </aside>

          {/* CENTER — search + feed / company page */}
          <section className="flex min-h-0 min-w-0 flex-col gap-2.5">
            {ogTab === 'communities' && activeCommunity ? (
              <div className={`${card} flex shrink-0 items-center gap-2 px-3 py-2.5`}>
                <button
                  type="button"
                  onClick={() => setActiveCommunityId(null)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Back to communities"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#1B3A5F]">
                  {activeCommunity.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{activeCommunity.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {activeCommunity.memberIds.length} members ·{' '}
                    {activeCommunity.visibility === 'private' ? 'Private' : 'Public'}
                  </p>
                </div>
              </div>
            ) : null}
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
                  placeholder="Search people, circles, posts…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
                {companySearch ||
                selectedProfileUserId ||
                (selectedCompany && !isCompanyAccount) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanySearch('');
                      setSelectedProfileUserId(null);
                      setHighlightPostId(null);
                      setSearchOpen(false);
                      if (!isCompanyAccount) {
                        setSelectedCompanyId(null);
                      } else if (actingCompany) {
                        setSelectedCompanyId(actingCompany.id);
                      }
                    }}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title={isCompanyAccount ? 'Clear search' : 'Clear / back to feed'}
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
              {displayFeed.map((post) => {
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
              {displayFeed.length === 0 ? (
                <div className={`${card} px-5 py-14 text-center text-sm text-slate-500`}>
                  No posts yet — open Communities to join a circle and start the conversation.
                </div>
              ) : null}
                </>
              )}
            </div>

            {/* Compose only inside a community room — Feed stays read-focused */}
            {ogTab === 'communities' && activeCommunityId ? (
            <div className={`${card} shrink-0 p-3 sm:p-3.5`}>
              {composeOptions.length === 0 ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">Join this circle to post</p>
                  <p className="mt-1 text-xs text-slate-500">
                    You need membership before you can share here.
                  </p>
                  <button
                    type="button"
                    onClick={() => activeCommunityId && handleJoin(activeCommunityId)}
                    className="mt-3 rounded-full bg-[#1B3A5F] px-4 py-2 text-xs font-semibold text-white"
                  >
                    Join circle
                  </button>
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
                    <WritingAssistField
                      inputRef={composeInputRef}
                      value={composeText}
                      onChange={setComposeText}
                      rows={2}
                      wrapperClassName="min-w-0 flex-1"
                      placeholder="Spill the gossip… use @ to tag someone"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#28A8E1] focus:bg-white"
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
            ) : null}
          </section>

          {/* RIGHT — discover circles only (feed sidebar) */}
          <aside
            className={`hidden h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pb-6 xl:flex ${hideScroll} ${
              ogTab === 'feed' ? '' : '!hidden'
            }`}
          >
            {/* Hot circles — LinkedIn News style (personal account only) */}
            {!isCompanyAccount ? (
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
                          openCommunityRoom(community.id);
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
                            Open
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                            Open
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
            ) : (
              <div className={`${card} p-3.5`}>
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Building2 className="h-4 w-4 text-[#0A66C2]" />
                  Company inbox
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Circles are hidden in company mode. Messaging & page updates stay available below.
                </p>
              </div>
            )}

            <div className={`${card} shrink-0 p-3.5`}>
              <p className="text-sm font-bold text-slate-900">Tip</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Feed is for reading. To post, open a circle under Communities.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOgTab('communities');
                  setActiveCommunityId(null);
                }}
                className="mt-3 w-full rounded-full bg-[#1B3A5F] px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
              >
                Go to Communities
              </button>
            </div>
          </aside>
        </div>

        {/* Communities list — main joined list + Discover side panel */}
        {ogTab === 'communities' && !activeCommunityId ? (
          <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className={`min-h-0 overflow-y-auto ${hideScroll}`}>
              <div className={`${card} overflow-hidden`}>
                <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Communities</h2>
                    <p className="text-[11px] text-slate-500">Open a circle to read and post</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateCommunity(true)}
                    className="rounded-full bg-[#1B3A5F] p-2 text-white hover:opacity-95"
                    title="Create community"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <ul className="divide-y divide-slate-100">
                  {joined.map((c) => {
                    const postCount = feed.filter((p) => p.communityId === c.id).length;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => openCommunityRoom(c.id)}
                          className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition hover:bg-sky-50/80"
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#1B3A5F]">
                            {c.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-slate-900">{c.name}</span>
                              {c.visibility === 'private' ? (
                                <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                              {c.memberIds.length} members
                              {postCount > 0 ? ` · ${postCount} posts` : ''}
                            </span>
                          </span>
                          <MessageCircle className="h-4 w-4 shrink-0 text-slate-300" />
                        </button>
                      </li>
                    );
                  })}
                  {joined.length === 0 ? (
                    <li className="px-4 py-10 text-center">
                      <Users className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-800">No communities yet</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Pick a circle from Discover on the right, or create your own.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCreateCommunity(true)}
                        className="mt-4 rounded-full bg-[#1B3A5F] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Create community
                      </button>
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>

            <aside className={`min-h-0 overflow-y-auto ${hideScroll}`}>
              <div className={`${card} overflow-hidden`}>
                <div className="flex items-start justify-between px-3.5 pt-3.5">
                  <div>
                    <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Discover
                    </h2>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">Suggested circles</p>
                  </div>
                </div>
                <ul className="mt-2 space-y-0.5 px-1.5 pb-3">
                  {hotCircles.map(({ community, label, engagement }) => {
                    const isMember = Boolean(userId && community.memberIds.includes(userId));
                    return (
                      <li key={community.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isMember) handleJoin(community.id);
                            openCommunityRoom(community.id);
                          }}
                          className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-sky-50/80"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#28A8E1]" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1">
                              <span className="truncate text-[13px] font-semibold text-slate-900">
                                {community.name}
                              </span>
                              {community.visibility === 'private' ? (
                                <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-slate-500">
                              {label}
                              {engagement > 0 ? ` · ${engagement}` : ''}
                            </span>
                          </span>
                          <span className="shrink-0 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#28A8E1]">
                            {isMember ? 'Open' : 'Join'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {hotCircles.length === 0 ? (
                    <li className="px-2 py-6 text-center text-xs text-slate-400">No suggestions yet.</li>
                  ) : null}
                </ul>
              </div>
            </aside>
          </div>
        ) : null}

        {ogTab === 'chat' ? (
          <div className="grid min-h-0 h-full flex-1 items-stretch gap-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <div
              className={`min-h-0 h-full overflow-y-auto ${hideScroll} ${
                referenceChatId ? 'hidden lg:block' : ''
              }`}
            >
              {userId ? (
                <ReferenceCheckPanel
                  userId={userId}
                  variant="chat"
                  activeChatId={referenceChatId}
                  activeChatKind={referenceChatKind}
                  onRefresh={refresh}
                  onOpenCompany={openCompanyPage}
                  onOpenChat={(kind, id) => {
                    setReferenceChatKind(kind);
                    setReferenceChatId(id);
                  }}
                />
              ) : null}
            </div>

            <div
              className={`min-h-0 h-full ${
                referenceChatId ? 'flex' : 'hidden lg:flex'
              } flex-col`}
            >
              {userId &&
              referenceChatId &&
              (referenceChatKind === 'dm' || referenceChatKind === 'hryantra') ? (
                <ReferenceMessagingPanel
                  mode="embedded"
                  kind={referenceChatKind}
                  chatId={referenceChatId}
                  userId={userId}
                  onClose={closeChat}
                  onRefresh={refresh}
                />
              ) : (
                <div className={`${card} flex h-full min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-[#0A66C2]">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <h2 className="mt-4 text-base font-bold text-slate-900">Your messages</h2>
                  <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
                    Open HRYantra Verified or any conversation from the list. Chats open here in the
                    main panel — no small popup.
                  </p>
                  <div className="mt-5 w-full max-w-xs space-y-2 text-left">
                    <div className="rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2.5">
                      <p className="text-[11px] font-bold text-[#0A66C2]">Direct messages</p>
                      <p className="text-[11px] text-slate-600">
                        {dmPendingCount > 0
                          ? `${dmPendingCount} waiting for your reply`
                          : 'No pending message requests'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <p className="text-[11px] font-bold text-slate-800">Follow requests</p>
                      <p className="text-[11px] text-slate-600">
                        {followPendingCount > 0
                          ? `${followPendingCount} pending`
                          : 'No pending follow requests'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {ogTab === 'events' ? (
          <div className="grid min-h-0 flex-1 items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
            <div className={`min-h-0 space-y-3 overflow-y-auto pr-0.5 ${hideScroll}`}>
              <div className={`${card} flex flex-wrap items-center justify-between gap-2 px-3.5 py-3`}>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Events for you</h2>
                  <p className="text-[11px] text-slate-500">
                    Only events & jobs matched to your profile — full catalog lives in LMS
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      ['all', 'All'],
                      ['job', 'Jobs'],
                      ['walk-in', 'Walk-in'],
                      ['seminar', 'Seminar'],
                      ['webinar', 'Webinar'],
                      ['job-fair', 'Job fair'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEventFilter(id)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                        eventFilter === id
                          ? 'bg-[#1B3A5F] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredEvents.map((ev) => {
                const interested = Boolean(eventInterested[ev.id]);
                const isJob = ev.type === 'job';
                return (
                  <article
                    key={ev.id}
                    className={`${card} overflow-hidden ${isJob ? 'cursor-pointer transition hover:border-[#28A8E1]/50' : ''}`}
                    onClick={isJob ? () => openJobEvent(ev) : undefined}
                    onKeyDown={
                      isJob
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openJobEvent(ev);
                            }
                          }
                        : undefined
                    }
                    role={isJob ? 'link' : undefined}
                    tabIndex={isJob ? 0 : undefined}
                  >
                    <div className="flex items-center gap-2.5 px-3.5 pt-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B3A5F] text-sm font-bold text-white">
                        {isJob ? <Briefcase className="h-4 w-4 text-white" /> : ev.hostInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{ev.hostName}</p>
                        <p className="text-[11px] text-slate-500">
                          {eventTypeLabel(ev.type)} · {timeAgo(ev.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isJob
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-sky-50 text-[#0A66C2]'
                        }`}
                      >
                        {eventTypeLabel(ev.type)}
                      </span>
                    </div>

                    <div className="relative mt-3 flex max-h-[520px] w-full items-center justify-center overflow-hidden bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.imageUrl}
                        alt=""
                        className="max-h-[520px] w-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-2.5 px-3.5 py-3">
                      <p className="text-sm font-bold leading-snug text-slate-900">{ev.title}</p>
                      <p className="line-clamp-3 text-sm leading-relaxed text-slate-700">
                        {ev.body}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {isJob ? (
                            <Briefcase className="h-3.5 w-3.5 text-[#28A8E1]" />
                          ) : (
                            <Calendar className="h-3.5 w-3.5 text-[#28A8E1]" />
                          )}
                          {ev.whenLabel}
                        </span>
                        {ev.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#28A8E1]" />
                            {ev.location}
                          </span>
                        ) : !isJob ? (
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-3.5 w-3.5 text-[#28A8E1]" />
                            Online
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ev.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div
                        className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isJob ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openJobEvent(ev)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#0A66C2] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#004182]"
                            >
                              <Briefcase className="h-3.5 w-3.5" />
                              Apply
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#28A8E1] hover:text-[#0A66C2]"
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              Save
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#28A8E1] hover:text-[#0A66C2]"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              Share
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setEventInterested((prev) => ({
                                  ...prev,
                                  [ev.id]: !prev[ev.id],
                                }))
                              }
                              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold ${
                                interested
                                  ? 'text-[#0A66C2] hover:bg-sky-50'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <Sparkles className={`h-4 w-4 ${interested ? 'fill-current' : ''}`} />
                              Interested
                              <span className="text-slate-400">
                                · {ev.interestedCount + (interested ? 1 : 0)}
                              </span>
                            </button>
                            <button
                              type="button"
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <Bookmark className="h-4 w-4" />
                              Save
                            </button>
                            <button
                              type="button"
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <Share2 className="h-4 w-4" />
                              Share
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredEvents.length === 0 ? (
                <div className={`${card} px-5 py-14 text-center text-sm text-slate-500`}>
                  <p>No profile-matched events in this filter yet.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/lms/events')}
                    className="mt-3 text-xs font-semibold text-[#0A66C2] hover:underline"
                  >
                    Browse all events in LMS →
                  </button>
                </div>
              ) : null}
            </div>

            <aside className={`min-h-0 overflow-y-auto ${hideScroll}`}>
              <div className={`${card} overflow-hidden p-3.5`}>
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  For your profile
                </h2>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                  Only matches from your profile, skills, and circles. See every walk-in, seminar,
                  webinar, job fair, and job posting in LMS Events.
                </p>
                <ul className="mt-3 space-y-2">
                  {(
                    [
                      ['job', 'Jobs'],
                      ['walk-in', 'Walk-ins'],
                      ['seminar', 'Seminars'],
                      ['webinar', 'Webinars'],
                      ['job-fair', 'Job fairs'],
                    ] as const
                  ).map(([id, label]) => {
                    const count = profileEvents.filter((e) => e.type === id).length;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setEventFilter(id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                          eventFilter === id
                            ? 'bg-sky-50 text-[#0A66C2]'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{label}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => router.push('/lms/events')}
                  className="mt-3 w-full rounded-full bg-[#1B3A5F] px-3 py-2 text-xs font-semibold text-white hover:opacity-95"
                >
                  All events in LMS →
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex h-[3.75rem] max-w-[1520px] items-stretch justify-around px-2">
            {(
              [
                { id: 'feed' as const, label: 'Feed', Icon: Home },
                { id: 'communities' as const, label: 'Communities', Icon: Users },
                { id: 'chat' as const, label: 'Chat', Icon: MessageCircle },
                { id: 'events' as const, label: 'Events', Icon: Calendar },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = ogTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setOgTab(id);
                    if (id !== 'communities') setActiveCommunityId(null);
                    if (id !== 'chat') closeChat();
                    if (id === 'feed') setSelectedCompanyId(null);
                  }}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition ${
                    active ? 'text-[#0A66C2]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'stroke-[2.25]' : ''}`} />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {userId ? (
        <ProfileViewsPanel
          userId={userId}
          open={showProfileViews}
          onClose={() => setShowProfileViews(false)}
          onOpenProfile={(id) => {
            setShowProfileViews(false);
            openUserProfile(id);
          }}
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
            markGossipSetupDone(userId);
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
          <WritingAssistField
            value={description}
            onChange={setDescription}
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
