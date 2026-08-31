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
  FileText,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  companyFollowerCount,
  getDmPeerLabel,
  listDmThreadsForUser,
  listFollowedCompanyIds,
  listFollowedPeopleIds,
  pendingDmIncomingCount,
  pendingFollowIncomingCount,
  softPullSocialFromServer,
  SOCIAL_UPDATED_EVENT,
} from '@/lib/social-store';
import {
  ensureHryantraVerifiedChat,
  installHryantraHqChatListener,
} from '@/lib/hryantra-verified-chat-store';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';
import {
  buildEventMatchHaystack,
  eventTypeLabel,
  filterJobsForProfile,
  listEventsForProfile,
  listOgEvents,
  mapJobsToOgEvents,
  mapLmsEventsToOgEvents,
  mergeEventsWithJobs,
  mergeOgEventLists,
  scoreEventsForProfile,
  type OgEventPost,
  type OgEventType,
} from '@/lib/og-events-store';
import {
  fetchPortalJobsList,
  fetchPortalPersonalizedJobs,
  fetchPortalCvDashboard,
} from '@/lib/query/portal-api';
import { fetchEvents } from '@/app/lms/api/client';
import { fetchPublicEvents } from '@/lib/public-events-api';
import {
  isOgEventsCacheFresh,
  readOgEventsCache,
  writeOgEventsCache,
} from '@/lib/og-events-session-cache';
import {
  exploreJobsCacheKey,
  isExploreJobsCacheFresh,
  readExploreJobsCache,
} from '@/lib/explore-jobs-session-cache';
import { getBehaviourSignalsForSuggestions } from '@/lib/user-activity-tracker';
import {
  buildInterestHaystack,
  bumpInterestsFromText,
  syncInterestsFromBehaviour,
} from '@/lib/interest-affinity-store';
import { buildProfileSignalsFromDashboard } from '@/lib/suggestions-engine';
import { DEFAULT_LOCALE } from '@/lib/i18n';
import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { CompanyPageView } from '@/components/community/CompanyPageView';
import { ContainedPostMedia, ExpandableCaption } from '@/components/community/PostBody';
import { ProfileViewsPanel } from '@/components/community/ProfileViewsPanel';
import { ReferenceCheckPanel } from '@/components/community/ReferenceCheckPanel';
import { ReferenceMessagingPanel } from '@/components/community/ReferenceMessagingPanel';
import { UserProfileView } from '@/components/community/UserProfileView';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import {
  listReferenceChecksForUser,
} from '@/lib/reference-check-store';
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
  getPersonalizedCommunityFeed,
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
  COMPANY_PAGE_REQUIRED_DOCS,
  type Community,
  type CommunityComment,
  type CommunityPost,
  type CommunityPostType,
  type CommunitySearchHit,
  type CommunityVisibility,
  type CompanyPage,
  type CompanyPageDocument,
  type CompanyPageDocumentKind,
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

const EVENTS_QUEUE_BATCH = 5;
const EVENTS_BG_POLL_MS = 48_000;
const SOCIAL_BG_POLL_MS = 20_000;

type EventsLiveCompanyPost = CommunityPost & {
  liveSource: 'followed' | 'connected' | 'match';
};

type EventsTimelineItem =
  | { kind: 'company'; id: string; createdAt: string; post: EventsLiveCompanyPost }
  | { kind: 'event'; id: string; createdAt: string; event: OgEventPost };

function sortEventsTimelineNewestFirst(items: EventsTimelineItem[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
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

function CompanyPostMedia({
  post,
  compact = false,
  tight = false,
}: {
  post: CommunityPost;
  compact?: boolean;
  tight?: boolean;
}) {
  return (
    <ContainedPostMedia
      post={post}
      className="mt-3"
      compact={compact}
      tight={tight}
    />
  );
}

export default function OfficeGossipsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  type OgTab = 'feed' | 'communities' | 'chat' | 'events';
  const [ogTab, setOgTab] = useState<OgTab>('chat');
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('saasa:og-tab-changed', { detail: { tab: ogTab } }),
    );
  }, [ogTab]);
  const [eventFilter, setEventFilter] = useState<'all' | OgEventType>('all');
  const [eventSearch, setEventSearch] = useState('');
  const [eventInterested, setEventInterested] = useState<Record<string, boolean>>({});
  const [jobsFromPersonalized, setJobsFromPersonalized] = useState(false);
  const [jobEvents, setJobEvents] = useState<OgEventPost[]>([]);
  const [lmsEvents, setLmsEvents] = useState<OgEventPost[]>([]);
  const [eventMatchHaystack, setEventMatchHaystack] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [companyPages, setCompanyPages] = useState<CompanyPage[]>([]);
  const [hotCircles, setHotCircles] = useState<HotCircleStat[]>([]);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  /** Company page posts (kept separate from personalized community feed) for Events live strip */
  const [companyFeed, setCompanyFeed] = useState<CommunityPost[]>([]);
  const [eventsTimeline, setEventsTimeline] = useState<EventsTimelineItem[]>([]);
  const [eventsQueueCount, setEventsQueueCount] = useState(0);
  const [eventsHydrated, setEventsHydrated] = useState(false);
  const [eventsDataReady, setEventsDataReady] = useState(false);
  const [eventsPullHint, setEventsPullHint] = useState<'idle' | 'loading' | 'empty'>('idle');
  const [eventsPullDistance, setEventsPullDistance] = useState(0);
  const [socialRequestQueueCount, setSocialRequestQueueCount] = useState(0);
  const [socialTick, setSocialTick] = useState(0);
  const eventsQueueRef = useRef<EventsTimelineItem[]>([]);
  const eventsSeenIdsRef = useRef<Set<string>>(new Set());
  const socialSeenPendingRef = useRef(0);
  const socialBaselineReadyRef = useRef(false);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const eventsPullStartY = useRef<number | null>(null);
  const eventsPullDistanceRef = useRef(0);
  const eventsPullingRef = useRef(false);
  const [cvCompanies, setCvCompanies] = useState<string[]>([]);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);

  useEffect(() => {
    setCreateMenuOpen(false);
  }, [ogTab]);
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
  const [companyPageInitialTab, setCompanyPageInitialTab] = useState<
    'posts' | 'people' | 'references' | 'inbox' | undefined
  >(undefined);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const composeInputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const pendingCompanyDeepLinkRef = useRef<{ id?: string; domain?: string } | null>(null);

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
    const visible = getVisibleFeed(userId);
    setCompanyFeed(visible.filter((p) => Boolean(p.companyPageId)));
    if (userId) {
      syncInterestsFromBehaviour(userId);
      setFeed(
        getPersonalizedCommunityFeed(userId, {
          followedAuthorIds: listFollowedPeopleIds(userId),
        }),
      );
    } else {
      setFeed(visible.filter((p) => Boolean(p.communityId)));
    }
    setGossipIdentity(getGossipIdentity(userId));
    if (commentPostId) {
      setCommentThread(getCommentsForPost(commentPostId));
    }
  }, [userId, commentPostId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) refresh();
  }, [authLoading, isAuthenticated, refresh]);

  useEffect(() => {
    const onHydrated = () => refresh();
    window.addEventListener('saasa:office-gossips-hydrated', onHydrated);
    return () => window.removeEventListener('saasa:office-gossips-hydrated', onHydrated);
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('views') === '1') {
      setShowProfileViews(true);
      params.delete('views');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState({}, '', next);
    }
    const companyId = params.get('company')?.trim() || '';
    const domainKey = params.get('domain')?.trim().toLowerCase() || '';
    if (companyId || domainKey) {
      pendingCompanyDeepLinkRef.current = {
        id: companyId || undefined,
        domain: domainKey || undefined,
      };
      if (companyId) {
        setSelectedCompanyId(companyId);
        setSelectedProfileUserId(null);
        setCompanyPageInitialTab('posts');
        setOgTab('feed');
      }
      params.delete('company');
      params.delete('domain');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, []);

  // Resolve deep-linked company after local/remote company pages load (id or domain).
  useEffect(() => {
    const pending = pendingCompanyDeepLinkRef.current;
    if (!pending || companyPages.length === 0) return;
    const byId = pending.id
      ? companyPages.find((p) => p.id === pending.id)
      : undefined;
    const byDomain = pending.domain
      ? companyPages.find(
          (p) => String(p.domainKey || '').toLowerCase() === pending.domain,
        )
      : undefined;
    const match = byId || byDomain;
    if (!match) return;
    setSelectedCompanyId(match.id);
    setSelectedProfileUserId(null);
    setCompanyPageInitialTab('posts');
    setOgTab('feed');
    pendingCompanyDeepLinkRef.current = null;
  }, [companyPages]);

  useEffect(() => {
    const onUp = () => setProfileViewTick((n) => n + 1);
    window.addEventListener(PROFILE_VIEWS_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(PROFILE_VIEWS_UPDATED_EVENT, onUp);
  }, []);

  useEffect(() => {
    // Only prompt Office Gossips identity when leaving Chat-only usage
    // (communities / feed / events need the one-time anonymity setup).
    if (
      !authLoading &&
      isAuthenticated &&
      userId &&
      !isGossipSetupDone(userId) &&
      (ogTab === 'communities' || ogTab === 'feed' || ogTab === 'events')
    ) {
      setShowCreateAccount(true);
    }
  }, [authLoading, isAuthenticated, userId, ogTab]);

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
    setSelectedProfileUserId(null);
    setSelectedCompanyId(pageId);
    setCompanyPageInitialTab('posts');
    setSearchOpen(false);
    setCompanySearch('');
    setHighlightPostId(null);
    setOgTab('feed');
  };

  const openReferenceCheckForCompany = (pageId: string, openWizard = true) => {
    const q = new URLSearchParams({ company: pageId });
    if (openWizard) q.set('wizard', '1');
    router.push(`/reference-check?${q.toString()}`);
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
    if (ogTab === 'communities') setOgTab('feed');
  }, [actingCompany, selectedCompanyId, ogTab]);

  const openChat = (kind: ChatKind, id: string) => {
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
      const tabPref = sessionStorage.getItem('saasa:og-tab');
      if (tabPref === 'chat' || tabPref === 'communities' || tabPref === 'feed' || tabPref === 'events') {
        sessionStorage.removeItem('saasa:og-tab');
        setOgTab(tabPref);
      }
    } catch {
      /* ignore */
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'chat' || tab === 'communities' || tab === 'feed' || tab === 'events') {
        setOgTab(tab);
        params.delete('tab');
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState({}, '', next);
      }
    }

    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ chatId?: string }>).detail;
      openVerified(detail?.chatId);
    };
    const onTab = (event: Event) => {
      const tab = (event as CustomEvent<{ tab?: string }>).detail?.tab;
      if (tab === 'chat' || tab === 'communities' || tab === 'feed' || tab === 'events') {
        setOgTab(tab);
      }
    };
    window.addEventListener('saasa:open-hryantra-chat', onOpen);
    window.addEventListener('saasa:og-open-tab', onTab as EventListener);
    return () => {
      window.removeEventListener('saasa:open-hryantra-chat', onOpen);
      window.removeEventListener('saasa:og-open-tab', onTab as EventListener);
    };
  }, [userId]);

  const companyInboxItems = useMemo(() => {
    if (!userId || !actingCompany) return [];
    const items: Array<{
      id: string;
      kind: 'dm' | 'reference';
      title: string;
      subtitle: string;
      urgency: 'action' | 'open';
    }> = [];
    const refs = listReferenceChecksForUser(userId).filter(
      (r) => r.companyPageId === actingCompany.id,
    );
    for (const r of refs) {
      const peer = r.requesterId === userId ? r.refereeName : r.requesterName;
      const needsAccept = r.refereeId === userId && r.status === 'pending';
      const needsAnswers = r.refereeId === userId && r.status === 'awaiting_answers';
      const needsRate = r.requesterId === userId && r.status === 'answered';
      if (needsAccept || needsAnswers || needsRate || r.status === 'active') {
        items.push({
          id: r.id,
          kind: 'reference',
          title: peer,
          subtitle: needsAccept
            ? 'Reference · needs accept'
            : needsAnswers
              ? 'Reference · answer questions'
              : needsRate
                ? 'Reference · rate to complete'
                : `Reference · ${r.status}`,
          urgency: needsAccept || needsAnswers || needsRate ? 'action' : 'open',
        });
      }
    }
    const dms = listDmThreadsForUser(userId).filter(
      (d) => d.companyPageId === actingCompany.id,
    );
    for (const d of dms) {
      if (d.status !== 'pending' && d.status !== 'active') continue;
      items.push({
        id: d.id,
        kind: 'dm',
        title: getDmPeerLabel(d, userId),
        subtitle:
          d.status === 'pending' && d.toUserId === userId
            ? 'Message request · needs reply'
            : d.status === 'pending'
              ? 'Message · waiting'
              : 'Direct message · open',
        urgency: d.status === 'pending' && d.toUserId === userId ? 'action' : 'open',
      });
    }
    return items.slice(0, 8);
  }, [userId, actingCompany, feed, referenceChatId]);

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
    // Single circle: full visible posts for that community (not the personalized mix)
    if (ogTab === 'communities' && activeCommunityId) {
      return getVisibleFeed(userId).filter((p) => p.communityId === activeCommunityId);
    }
    // Main Feed: ~60% joined + interest-matched public (already applied in refresh)
    return feed.filter((p) => Boolean(p.communityId));
  }, [feed, ogTab, activeCommunityId, userId]);

  const openCommunityRoom = (communityId: string) => {
    setActiveCommunityId(communityId);
    setOgTab('communities');
    setSelectedCompanyId(null);
    setSelectedProfileUserId(null);
    setComposeTarget({ kind: 'community', id: communityId });
    setSearchOpen(false);
    if (userId) {
      const c = communities.find((x) => x.id === communityId);
      if (c) bumpInterestsFromText(userId, `${c.name} ${c.description}`, 1.5);
    }
  };

  const profileEventText = useMemo(() => {
    const base = [
      realName,
      authorName,
      user?.email,
      workDomain,
      ...(joined.map((c) => c.name) || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return [base, eventMatchHaystack].filter(Boolean).join(' ').toLowerCase();
  }, [realName, authorName, user?.email, workDomain, joined, eventMatchHaystack]);

  const profileEvents = useMemo(() => {
    const catalogMatched = listEventsForProfile(profileEventText);
    const lmsMatched = scoreEventsForProfile(lmsEvents, profileEventText, {
      minHits: 1,
      limit: 12,
    });
    const matched = mergeOgEventLists(lmsMatched, catalogMatched);
    const relevantJobs = filterJobsForProfile(jobEvents, profileEventText, {
      preferAll: jobsFromPersonalized,
      limit: 6,
    });
    return mergeEventsWithJobs(matched, relevantJobs);
  }, [profileEventText, jobEvents, jobsFromPersonalized, lmsEvents]);

  const buildEventsCandidates = useCallback((): EventsTimelineItem[] => {
    if (!userId) return [];
    const followed = new Set(listFollowedCompanyIds(userId));
    const connected = new Set(getConnectedCompanies(userId).map((c) => c.id));
    const hay = `${eventMatchHaystack} ${cvCompanies.join(' ')} ${profileEventText}`.toLowerCase();
    const tokens = hay.split(/\s+/).filter((t) => t.length > 2);
    const items: EventsTimelineItem[] = [];

    for (const p of companyFeed) {
      if (!p.companyPageId) continue;
      const pageId = p.companyPageId;
      let liveSource: EventsLiveCompanyPost['liveSource'] | null = null;
      if (followed.has(pageId)) liveSource = 'followed';
      else if (connected.has(pageId)) liveSource = 'connected';
      else {
        const page = companyPages.find((c) => c.id === pageId);
        if (!page || !tokens.length) continue;
        const blob =
          `${page.name} ${page.domainKey} ${page.description || ''} ${p.text}`.toLowerCase();
        if (!tokens.some((token) => blob.includes(token))) continue;
        liveSource = 'match';
      }
      items.push({
        kind: 'company',
        id: `company:${p.id}`,
        createdAt: p.createdAt,
        post: { ...p, liveSource },
      });
    }

    for (const ev of profileEvents) {
      items.push({
        kind: 'event',
        id: `event:${ev.id}`,
        createdAt: ev.createdAt,
        event: ev,
      });
    }

    return sortEventsTimelineNewestFirst(items);
  }, [
    userId,
    companyFeed,
    companyPages,
    cvCompanies,
    eventMatchHaystack,
    profileEventText,
    profileEvents,
  ]);

  const enqueueNewEventsInBackground = useCallback(() => {
    if (!eventsHydrated) return;
    const timelineIds = new Set(eventsTimeline.map((i) => i.id));
    const queuedIds = new Set(eventsQueueRef.current.map((i) => i.id));
    let added = 0;
    for (const item of buildEventsCandidates()) {
      if (eventsSeenIdsRef.current.has(item.id)) continue;
      if (timelineIds.has(item.id) || queuedIds.has(item.id)) continue;
      eventsQueueRef.current.push(item);
      queuedIds.add(item.id);
      added += 1;
    }
    if (!added) return;
    // Newest first so the next user refresh loads latest batch first (FILO feel)
    eventsQueueRef.current = sortEventsTimelineNewestFirst(eventsQueueRef.current);
    setEventsQueueCount(eventsQueueRef.current.length);
  }, [buildEventsCandidates, eventsHydrated, eventsTimeline]);

  const enqueueNewEventsRef = useRef(enqueueNewEventsInBackground);
  enqueueNewEventsRef.current = enqueueNewEventsInBackground;
  const buildEventsCandidatesRef = useRef(buildEventsCandidates);
  buildEventsCandidatesRef.current = buildEventsCandidates;

  const syncCompanyFeedFromStore = useCallback(() => {
    const visible = getVisibleFeed(userId);
    const next = visible.filter((p) => Boolean(p.companyPageId));
    setCompanyFeed((prev) => {
      if (
        prev.length === next.length &&
        prev.every(
          (p, i) =>
            p.id === next[i]?.id &&
            p.likeIds.length === next[i]?.likeIds.length &&
            p.text === next[i]?.text,
        )
      ) {
        return prev;
      }
      return next;
    });
  }, [userId]);

  const releaseEventsQueueBatch = useCallback(() => {
    setEventsPullHint('loading');
    const q = eventsQueueRef.current;
    if (!q.length) {
      setEventsPullHint('empty');
      window.setTimeout(() => setEventsPullHint('idle'), 2200);
      setEventsPullDistance(0);
      eventsPullDistanceRef.current = 0;
      return;
    }
    const batch = q.splice(0, EVENTS_QUEUE_BATCH);
    eventsQueueRef.current = q;
    setEventsQueueCount(q.length);
    for (const item of batch) eventsSeenIdsRef.current.add(item.id);
    setEventsTimeline((prev) => sortEventsTimelineNewestFirst([...batch, ...prev]));
    setEventsPullHint('idle');
    setEventsPullDistance(0);
    eventsPullDistanceRef.current = 0;
    eventsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /** Instagram-style: sync → queue → release a batch into the feed */
  const pullToLoadEvents = useCallback(() => {
    setEventsPullHint('loading');
    setEventsPullDistance(56);
    eventsPullDistanceRef.current = 56;
    syncCompanyFeedFromStore();
    enqueueNewEventsRef.current();
    window.setTimeout(() => {
      const q = eventsQueueRef.current;
      if (!q.length) {
        setEventsPullHint('empty');
        setEventsPullDistance(0);
        eventsPullDistanceRef.current = 0;
        window.setTimeout(() => setEventsPullHint('idle'), 1800);
        return;
      }
      const batch = q.splice(0, EVENTS_QUEUE_BATCH);
      eventsQueueRef.current = q;
      setEventsQueueCount(q.length);
      for (const item of batch) eventsSeenIdsRef.current.add(item.id);
      setEventsTimeline((prev) => sortEventsTimelineNewestFirst([...batch, ...prev]));
      setEventsPullHint('idle');
      setEventsPullDistance(0);
      eventsPullDistanceRef.current = 0;
      eventsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 320);
  }, [syncCompanyFeedFromStore]);

  const resetEventsPull = useCallback(() => {
    eventsPullingRef.current = false;
    eventsPullStartY.current = null;
    eventsPullDistanceRef.current = 0;
    setEventsPullDistance(0);
  }, []);

  const onEventsPullStart = useCallback(
    (clientY: number) => {
      if (eventSearch.trim()) return;
      if (eventsPullHint === 'loading') return;
      if ((eventsScrollRef.current?.scrollTop || 0) > 4) return;
      eventsPullingRef.current = true;
      eventsPullStartY.current = clientY;
    },
    [eventSearch, eventsPullHint],
  );

  const onEventsPullMove = useCallback((clientY: number) => {
    if (!eventsPullingRef.current || eventsPullStartY.current == null) return;
    if ((eventsScrollRef.current?.scrollTop || 0) > 4) {
      resetEventsPull();
      return;
    }
    const dy = Math.max(0, Math.min(96, clientY - eventsPullStartY.current));
    eventsPullDistanceRef.current = dy;
    setEventsPullDistance(dy);
  }, [resetEventsPull]);

  const onEventsPullEnd = useCallback(() => {
    if (!eventsPullingRef.current) return;
    eventsPullingRef.current = false;
    eventsPullStartY.current = null;
    const dist = eventsPullDistanceRef.current;
    if (dist >= 56) {
      pullToLoadEvents();
    } else {
      eventsPullDistanceRef.current = 0;
      setEventsPullDistance(0);
    }
  }, [pullToLoadEvents]);

  const displayEventsTimeline = useMemo(() => {
    // Instagram-like: only followed/connected company posts + profile-matched events
    let items = eventsTimeline.filter((item) => {
      if (item.kind === 'company') {
        return item.post.liveSource === 'followed' || item.post.liveSource === 'connected';
      }
      return true;
    });
    if (eventFilter !== 'all') {
      items = items.filter(
        (item) => item.kind === 'event' && item.event.type === eventFilter,
      );
    }
    return items;
  }, [eventsTimeline, eventFilter]);

  /** Full LMS + jobs + catalog — searchable like /lms/events */
  const allEventsCatalog = useMemo(() => {
    return mergeOgEventLists(
      mergeOgEventLists(lmsEvents, jobEvents),
      listOgEvents(),
    );
  }, [lmsEvents, jobEvents]);

  const eventSearchResults = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return [] as OgEventPost[];
    const tokens = q.split(/\s+/).filter(Boolean);
    return allEventsCatalog
      .filter((ev) => {
        const blob =
          `${ev.title} ${ev.body} ${ev.hostName} ${ev.type} ${ev.location || ''} ${ev.tags.join(' ')}`.toLowerCase();
        return tokens.every((t) => blob.includes(t));
      })
      .slice(0, 40);
  }, [eventSearch, allEventsCatalog]);

  const topMatchedEvents = useMemo(
    () => profileEvents.slice(0, 6),
    [profileEvents],
  );

  /** Main Events column: search catalog OR personalized followed/interest feed */
  const eventsMainList = useMemo((): EventsTimelineItem[] => {
    const q = eventSearch.trim();
    if (q) {
      return eventSearchResults
        .filter((ev) => eventFilter === 'all' || ev.type === eventFilter)
        .map((ev) => ({
          kind: 'event' as const,
          id: `search:${ev.id}`,
          createdAt: ev.createdAt,
          event: ev,
        }));
    }
    return displayEventsTimeline;
  }, [eventSearch, eventSearchResults, eventFilter, displayEventsTimeline]);

  useEffect(() => {
    if (ogTab !== 'events') return;
    let cancelled = false;
    let softTimer: number | undefined;
    const candidateId = resolveCandidateIdForApi(userId);

    async function loadEventsSources(opts?: { soft?: boolean }) {
      try {
        const [jobsResult, lmsRaw, publicEvents, dashboard] = await Promise.all([
          (async () => {
            // Prefer explore-jobs cache when still fresh (skip network)
            const ej = readExploreJobsCache(
              exploreJobsCacheKey(DEFAULT_LOCALE, candidateId),
            );
            if (ej?.jobs?.length && isExploreJobsCacheFresh(ej)) {
              return {
                jobs: ej.jobs,
                personalized: Boolean(ej.isPersonalized),
              };
            }
            let jobs: unknown[] = [];
            let personalized = false;
            if (candidateId) {
              jobs = await fetchPortalPersonalizedJobs(candidateId, DEFAULT_LOCALE).catch(
                () => [],
              );
              personalized = jobs.length > 0;
            }
            if (!jobs.length) {
              jobs = await fetchPortalJobsList(DEFAULT_LOCALE, 12).catch(() => []);
            }
            return { jobs, personalized };
          })(),
          fetchEvents().catch(() => []),
          fetchPublicEvents(undefined, 'all').catch(() => []),
          candidateId
            ? fetchPortalCvDashboard(candidateId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const nextJobs = mapJobsToOgEvents(
          jobsResult.jobs,
          jobsResult.personalized ? 8 : 12,
        );
        const publicRows = Array.isArray(publicEvents) ? publicEvents : [];
        const publicById = new Map(publicRows.map((row) => [String(row.id), row]));
        const lmsRows = (Array.isArray(lmsRaw) ? lmsRaw : []).map((row: { id?: string; media?: unknown[] }) => {
          const pub = publicById.get(String(row?.id || ''));
          const media =
            Array.isArray(row?.media) && row.media.length
              ? row.media
              : pub?.media || [];
          return { ...row, media };
        });
        const seen = new Set(lmsRows.map((row) => String(row?.id || '')).filter(Boolean));
        for (const pub of publicRows) {
          if (!seen.has(String(pub.id))) lmsRows.push(pub);
        }
        const nextLms = mapLmsEventsToOgEvents(lmsRows, 40);

        const profileSignals = dashboard
          ? buildProfileSignalsFromDashboard(dashboard)
          : null;
        const behaviour = userId ? getBehaviourSignalsForSuggestions(userId) : null;
        const hay = [
          buildEventMatchHaystack({
            nameBits: [realName, authorName, user?.email],
            skills: profileSignals?.skills,
            targetRole: profileSignals?.targetRole,
            workDomain: profileSignals?.workDomain || workDomain,
            recentJobTitles: (dashboard?.recentApplications || [])
              .slice(0, 5)
              .map((a) => `${a.jobTitle} ${a.company}`),
            topRoles: behaviour?.topRoles,
            topCompanies: behaviour?.topCompanies,
            communityNames: joined.map((c) => c.name),
          }),
          userId ? buildInterestHaystack(userId) : '',
        ]
          .filter(Boolean)
          .join(' ');

        setJobsFromPersonalized(jobsResult.personalized);
        setJobEvents(nextJobs);
        setLmsEvents(nextLms);
        setEventMatchHaystack(hay);
        setEventsDataReady(true);
        writeOgEventsCache({
          userId,
          jobEvents: nextJobs,
          lmsEvents: nextLms,
          jobsFromPersonalized: jobsResult.personalized,
          eventMatchHaystack: hay,
        });
      } catch {
        if (!cancelled && !opts?.soft) {
          setJobsFromPersonalized(false);
          setJobEvents([]);
          setLmsEvents([]);
          setEventsDataReady(true);
        }
      }
    }

    const cached = readOgEventsCache(userId);
    if (cached) {
      setJobsFromPersonalized(cached.jobsFromPersonalized);
      setJobEvents(cached.jobEvents);
      setLmsEvents(cached.lmsEvents);
      if (cached.eventMatchHaystack) setEventMatchHaystack(cached.eventMatchHaystack);
      setEventsDataReady(true);
      if (isOgEventsCacheFresh(cached)) {
        softTimer = window.setTimeout(() => {
          if (!cancelled) void loadEventsSources({ soft: true });
        }, 400);
        return () => {
          cancelled = true;
          if (softTimer) window.clearTimeout(softTimer);
        };
      }
    } else {
      // Instant paint from explore-jobs cache while LMS/network loads
      const ej = readExploreJobsCache(exploreJobsCacheKey(DEFAULT_LOCALE, candidateId));
      if (ej?.jobs?.length) {
        setJobsFromPersonalized(Boolean(ej.isPersonalized));
        setJobEvents(mapJobsToOgEvents(ej.jobs, ej.isPersonalized ? 8 : 12));
        setEventsDataReady(true);
      }
    }

    void loadEventsSources();
    return () => {
      cancelled = true;
      if (softTimer) window.clearTimeout(softTimer);
    };
  }, [ogTab, userId, realName, authorName, user?.email, workDomain, joined]);

  // Seed visible timeline once — later discoveries stay in background queue
  useEffect(() => {
    if (ogTab !== 'events' || eventsHydrated || !eventsDataReady) return;
    const seed = buildEventsCandidatesRef.current().slice(0, 18);
    for (const item of seed) eventsSeenIdsRef.current.add(item.id);
    setEventsTimeline(seed);
    eventsQueueRef.current = [];
    setEventsQueueCount(0);
    setEventsHydrated(true);
  }, [ogTab, eventsHydrated, eventsDataReady]);

  // Quiet background check: queue new IDs only — never rewrite the open feed.
  // Do NOT call full refresh() here: it recreates companyFeed → rebuilds
  // enqueue callback → re-runs this effect → max update depth.
  useEffect(() => {
    if (ogTab !== 'events' || !eventsHydrated) return;
    const softCheck = () => {
      syncCompanyFeedFromStore();
      window.setTimeout(() => enqueueNewEventsRef.current(), 80);
    };
    softCheck();
    const timer = window.setInterval(softCheck, EVENTS_BG_POLL_MS);
    return () => window.clearInterval(timer);
  }, [ogTab, eventsHydrated, syncCompanyFeedFromStore]);

  // When LMS/company sources change, queue silently (no UI jump)
  useEffect(() => {
    if (ogTab !== 'events' || !eventsHydrated) return;
    enqueueNewEventsRef.current();
  }, [companyFeed, profileEvents, ogTab, eventsHydrated]);

  const openEventCard = (ev: OgEventPost) => {
    const isJob = ev.type === 'job';
    const href =
      ev.actionHref ||
      (ev.jobId ? `/explore-jobs?job=${encodeURIComponent(ev.jobId)}` : null);
    if (!href) return;

    void import('@/lib/user-activity-tracker').then((m) => {
      m.trackCustomActivityForCurrentUser({
        type: 'page_visit',
        category: 'community',
        path: isJob
          ? `/community/events/job/${ev.jobId || ev.id}`
          : `/community/events/${ev.id}`,
        meta: {
          companyId: ev.hostName,
          companyName: ev.hostName,
          jobTitle: ev.title,
          roleKey: ev.title
            .toLowerCase()
            .split(/[^a-z0-9+.#]+/)
            .slice(0, 3)
            .join('-'),
          sourceSurface: isJob ? 'office_gossips_event' : 'office_gossips_lms_event',
        },
      });
    });
    const from =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/community';
    if (href.startsWith('/lms/events')) {
      const sep = href.includes('?') ? '&' : '?';
      router.push(`${href}${sep}from=${encodeURIComponent(from)}`);
      return;
    }
    router.push(href);
  };

  const followPendingCount = useMemo(
    () => (userId ? pendingFollowIncomingCount(userId) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, feed, referenceChatId, socialTick],
  );

  const dmPendingCount = useMemo(
    () => (userId ? pendingDmIncomingCount(userId) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, feed, referenceChatId, socialTick],
  );

  // Events-style soft load for follow / message requests while browsing Feed
  useEffect(() => {
    if (!userId) return;
    const onSocial = () => {
      setSocialTick((n) => n + 1);
      refresh();
    };
    window.addEventListener(SOCIAL_UPDATED_EVENT, onSocial);
    window.addEventListener('saasa:office-gossips-hydrated', onSocial);
    return () => {
      window.removeEventListener(SOCIAL_UPDATED_EVENT, onSocial);
      window.removeEventListener('saasa:office-gossips-hydrated', onSocial);
    };
  }, [userId, refresh]);

  useEffect(() => {
    if (ogTab !== 'feed' || !userId) return;
    socialBaselineReadyRef.current = false;
    socialSeenPendingRef.current = 0;
    setSocialRequestQueueCount(0);

    const softCheck = async () => {
      await softPullSocialFromServer();
      setSocialTick((n) => n + 1);
      const pending =
        pendingFollowIncomingCount(userId) + pendingDmIncomingCount(userId);
      if (!socialBaselineReadyRef.current) {
        socialSeenPendingRef.current = pending;
        socialBaselineReadyRef.current = true;
        setSocialRequestQueueCount(0);
        return;
      }
      const delta = Math.max(0, pending - socialSeenPendingRef.current);
      setSocialRequestQueueCount(delta);
    };

    void softCheck();
    const timer = window.setInterval(() => {
      void softCheck();
    }, SOCIAL_BG_POLL_MS);
    return () => window.clearInterval(timer);
  }, [ogTab, userId]);

  const releaseSocialRequestQueue = useCallback(() => {
    if (!userId) return;
    const pending =
      pendingFollowIncomingCount(userId) + pendingDmIncomingCount(userId);
    socialSeenPendingRef.current = pending;
    setSocialRequestQueueCount(0);
    setSocialTick((n) => n + 1);
    refresh();
    setOgTab('chat');
  }, [userId, refresh]);

  // Quiet soft-pull for social while browsing Chat (live inbox + open threads)
  useEffect(() => {
    if (ogTab !== 'chat' || !userId) return;
    const softCheck = () => {
      void softPullSocialFromServer().then(() => setSocialTick((n) => n + 1));
    };
    softCheck();
    const timer = window.setInterval(softCheck, SOCIAL_BG_POLL_MS);
    return () => window.clearInterval(timer);
  }, [ogTab, userId]);

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
    const c = communities.find((x) => x.id === id);
    if (c) bumpInterestsFromText(userId, `${c.name} ${c.description}`, 8);
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

  const handleCreateCompany = (payload: {
    domainOrName: string;
    displayName: string;
    description: string;
    documents: CompanyPageDocument[];
  }) => {
    if (!userId) return;
    const result = upsertCompanyPage({
      domainOrName: payload.domainOrName,
      displayName: payload.displayName,
      description: payload.description,
      documents: payload.documents,
      userId,
      email: user?.email,
    });
    if (result.error && !result.created) {
      showErrorToast('Company page', result.error);
      if (result.page && result.error.includes('already exists')) {
        handleConnectCompany(result.page);
      }
      return;
    }
    setShowCreateCompany(false);
    showSuccessToast('Company page created', 'Your company page is ready.');
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
    if (!userId) return;
    const target: ComposeTarget =
      ogTab === 'communities' && activeCommunityId
        ? { kind: 'community', id: activeCommunityId }
        : composeTarget;
    if (!target) return;
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
        communityId: target.kind === 'community' ? target.id : undefined,
        companyPageId: target.kind === 'company' ? target.id : undefined,
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
    const post =
      feed.find((p) => p.id === postId) ||
      companyFeed.find((p) => p.id === postId) ||
      getVisibleFeed(userId).find((p) => p.id === postId);
    toggleLike(postId, userId);
    if (post) {
      bumpInterestsFromText(
        userId,
        `${post.communityName || ''} ${post.companyName || ''} ${post.text || ''}`,
        2.5,
      );
    }
    refresh();
  };

  const handleSendComment = () => {
    if (!userId || !commentPostId) return;
    const commentAs =
      isCompanyAccount && actingCompany
        ? actingCompany.name
        : authorName;
    const c = addComment({
      postId: commentPostId,
      authorId: userId,
      authorName: commentAs,
      text: commentText,
    });
    if (!c) {
      showErrorToast('Comment failed');
      return;
    }
    const post =
      feed.find((p) => p.id === commentPostId) ||
      companyFeed.find((p) => p.id === commentPostId) ||
      getVisibleFeed(userId).find((p) => p.id === commentPostId);
    if (post) {
      bumpInterestsFromText(
        userId,
        `${post.communityName || ''} ${post.companyName || ''} ${post.text || ''} ${commentText}`,
        4,
      );
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
  /** Match candidate dashboard glass panels */
  const card = 'dashboard-surface rounded-[24px]';
  /** Blue→orange rounded gradient frame around each feed post */
  const feedPostFrame =
    'group rounded-[22px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#176F96] p-[1.5px] shadow-[0_10px_28px_rgba(32,152,200,0.1),0_4px_14px_rgba(32,152,200,0.08)] transition-shadow duration-220 hover:shadow-[0_16px_36px_rgba(32,152,200,0.16),0_8px_20px_rgba(32,152,200,0.14)]';
  const feedPostInner =
    'relative overflow-hidden rounded-[20.5px] bg-linear-to-b from-white via-[#FBFCFE] to-[#F7FAFD] px-4 py-4 sm:px-5';
  const visibleHot = showAllHot ? hotCircles : hotCircles.slice(0, 4);
  const activeCompany = companyPages[companySlide % Math.max(companyPages.length, 1)];
  const feedPageBg =
    'radial-gradient(circle at top left, rgba(32,152,200,0.13), transparent 28%), radial-gradient(circle at 85% 12%, rgba(32,152,200,0.1), transparent 16%), radial-gradient(circle at 18% 82%, rgba(32,152,200,0.08), transparent 18%), linear-gradient(180deg, #f5fafd 0%, #f8fcff 44%, #fcfdff 100%)';

  return (
    <div
      className="profile-page-typography candidate-dashboard-page h-[calc(100dvh-var(--app-header-height,96px))] overflow-hidden"
      style={{ background: feedPageBg }}
    >
      <div className="mx-auto flex h-full w-full max-w-380 flex-col px-3 pb-17 pt-3 sm:px-5 lg:px-6">
        {/* Top bar — profile views + account switcher */}
        {!isCompanyAccount || ownedCompanies.length > 0 ? (
          <div className="relative mb-2 flex shrink-0 items-center justify-between gap-2">
            {!isCompanyAccount ? (
              <button
                type="button"
                onClick={() => setShowProfileViews(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-(--dashboard-shadow) backdrop-blur-sm transition hover:border-[rgba(32,152,200,0.35)] hover:text-[#2098C8] lg:hidden"
              >
                <Eye className="h-3.5 w-3.5" />
                {lockedProfileViews > 0 || recentProfileViews > 0
                  ? 'Someone viewed your profile'
                  : 'Who viewed you'}
                {lockedProfileViews > 0 ? (
                  <span className="rounded-full bg-[#2098C8] px-1.5 py-0.5 text-[10px] font-bold text-white">
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
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-(--dashboard-shadow) transition ${
                isCompanyAccount
                  ? 'border-transparent bg-[#2098C8] text-white hover:bg-[#2098C8]'
                  : 'border-white/80 bg-white/80 text-slate-700 backdrop-blur-sm hover:border-[rgba(32,152,200,0.35)] hover:text-[#2098C8]'
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
                      !isCompanyAccount ? 'bg-sky-50/80 font-semibold text-[#176F96]' : 'text-slate-800'
                    }`}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#176F96]">
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
                          ? 'bg-sky-50/80 font-semibold text-[#176F96]'
                          : 'text-slate-800'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#176F96] text-xs font-bold text-white">
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

        {/* Feed */}
        <div
          className={`grid min-h-0 flex-1 items-stretch gap-3 ${
            ogTab === 'feed'
              ? 'lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)_288px]'
              : 'grid-cols-1'
          } ${ogTab === 'feed' ? '' : 'hidden'}`}
        >
          {/* LEFT — profile + circles (own scroll) */}
          <aside
            className={`h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pb-4 ${hideScroll} ${
              ogTab === 'feed' ? 'hidden lg:flex' : 'hidden'
            }`}
          >
            <div className={`${card} relative overflow-hidden`}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(32,152,200,0.2),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(32,152,200,0.12),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(32,152,200,0.14),transparent_22%),radial-gradient(circle_at_12%_88%,rgba(32,152,200,0.08),transparent_24%)]" />
              <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-(--brand-primary-glow) blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-(--brand-accent-glow) blur-3xl" />
              <div className="relative px-3.5 pb-4 pt-5 text-center">
                {isCompanyAccount && actingCompany ? (
                  <>
                    <div className="mx-auto flex h-18 w-18 items-center justify-center overflow-hidden rounded-[22px] border border-white/80 bg-white/75 text-xl font-bold tracking-tight text-[#2098C8] shadow-[0_14px_30px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] ring-2 ring-[rgba(32,152,200,0.18)]">
                      {actingCompany.logoLetter}
                    </div>
                    <p className="mt-3 truncate text-[15px] font-semibold tracking-tight text-slate-900">
                      {actingCompany.name}
                    </p>
                    <p className="truncate text-[12px] font-medium text-slate-500">
                      @{actingCompany.domainKey}
                    </p>
                    <p className="mt-2.5 border-t border-slate-100/80 pt-2.5 text-[11px] font-medium text-slate-500">
                      {actingCompany.memberIds.length} connections ·{' '}
                      {companyFollowerCount(actingCompany.id)} followers
                    </p>
                    <p className="mt-1.5 inline-block rounded-full border border-(--brand-accent-soft) bg-white/74 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--brand-accent) shadow-sm">
                      Company account
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-18 w-18 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/75 text-xl font-bold tracking-tight text-[#2098C8] shadow-[0_14px_30px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] ring-2 ring-[rgba(32,152,200,0.2)]">
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
                    <p className="mt-3 truncate text-[15px] font-semibold tracking-tight text-slate-900">
                      {authorName}
                    </p>
                    <p className="truncate text-[12px] font-medium text-slate-500">
                      {workDomain ? `@${workDomain}` : 'Office Gossips'}
                    </p>
                    <p className="mt-2.5 border-t border-slate-100/80 pt-2.5 text-[11px] font-medium text-slate-500">
                      <span className="font-semibold text-slate-700">{joined.length}</span> circles ·{' '}
                      <span className="font-semibold text-slate-700">
                        {connectedCompanies.length}
                      </span>{' '}
                      companies
                    </p>
                  </>
                )}
              </div>
            </div>

            {!isCompanyAccount ? (
              <button
                type="button"
                onClick={() => setShowProfileViews(true)}
                className={`${card} relative flex w-full items-center gap-3 overflow-hidden px-3.5 py-3.5 text-left transition hover:border-[rgba(32,152,200,0.28)]`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(32,152,200,0.1),transparent_45%)]" />
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/80 bg-white/90 text-[#2098C8] shadow-[0_8px_18px_rgba(32,152,200,0.12),inset_0_1px_0_rgba(255,255,255,0.96)]">
                  <Eye className="h-4 w-4" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold tracking-tight text-slate-800">
                    {recentProfileViews === 0
                      ? 'Who viewed you'
                      : recentProfileViews === 1
                        ? 'Someone viewed your profile'
                        : `${recentProfileViews} people viewed your profile`}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-[#2098C8]">
                    {recentProfileViews === 0 ? 'No views yet' : 'View details'}
                  </span>
                </span>
                {lockedProfileViews > 0 ? (
                  <span className="relative rounded-full bg-[#2098C8] px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_6px_14px_rgba(32,152,200,0.28)]">
                    {lockedProfileViews}
                  </span>
                ) : null}
              </button>
            ) : null}

            {!isCompanyAccount ? (
            <div className={`${card} relative flex min-h-0 flex-1 flex-col overflow-hidden`}>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.1),transparent_45%),radial-gradient(circle_at_top_left,rgba(32,152,200,0.1),transparent_40%)]" />
              <div className="relative flex items-center justify-between border-b border-slate-100/70 px-3.5 py-3">
                <h2 className="dashboard-status-pill inline-flex items-center rounded-full border border-(--brand-accent-soft) bg-white/74 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--brand-accent) shadow-sm">
                  Circles
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(true)}
                  className="rounded-full p-1.5 text-[#2098C8] transition hover:bg-(--brand-primary-soft)"
                  title="Create circle"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <ul className={`space-y-1 overflow-y-auto px-2 py-2 ${hideScroll}`}>
                {communities.map((c) => {
                  const isMember = Boolean(userId && c.memberIds.includes(userId));
                  return (
                    <li
                      key={c.id}
                      className="rounded-[16px] bg-slate-50/80 px-2.5 py-2.5 transition hover:bg-white"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-slate-200/80 bg-white text-[#2098C8] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]">
                          <Users className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isMember) handleJoin(c.id);
                              openCommunityRoom(c.id);
                            }}
                            className="truncate text-left text-[13px] font-semibold tracking-tight text-slate-900 hover:text-[#2098C8]"
                          >
                            {c.name}
                          </button>
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-slate-500">
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
                            className={`mt-2 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                              isMember
                                ? 'bg-slate-100/85 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                                : 'bg-[#2098C8] text-white shadow-[0_8px_16px_rgba(32,152,200,0.22)] hover:bg-[#2098C8]'
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
              <div className={`${card} relative overflow-hidden p-3.5`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.12),transparent_40%)]" />
                <div className="relative">
                  <p className="text-xs font-bold text-slate-700">Page tools</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    Circles stay personal-only. Manage posts, people, and requests on this company
                    page.
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (actingCompany) setSelectedCompanyId(actingCompany.id);
                        setOgTab('feed');
                      }}
                      className="w-full rounded-full bg-[#2098C8] px-2 py-2 text-[11px] font-semibold text-white shadow-[0_8px_16px_rgba(32,152,200,0.2)]"
                    >
                      Posts
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* CENTER — search + feed / company page */}
          <section className="flex min-h-0 min-w-0 flex-col gap-2.5">
            {ogTab === 'feed' && activeCommunity ? (
              <div className={`${card} flex shrink-0 items-center gap-2 px-3 py-2.5`}>
                <button
                  type="button"
                  onClick={() => setActiveCommunityId(null)}
                  className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Back to communities"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-[#176F96]">
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
              <div
                className={`${card} flex items-center gap-2.5 px-3.5 py-2.5 transition focus-within:border-[rgba(32,152,200,0.28)]`}
              >
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
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
                />
                {socialRequestQueueCount > 0 && ogTab === 'feed' ? (
                  <button
                    type="button"
                    onClick={() => releaseSocialRequestQueue()}
                    className="shrink-0 rounded-full bg-[#2098C8] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
                  >
                    {socialRequestQueueCount} new · load
                  </button>
                ) : null}
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
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100/80 hover:text-slate-600"
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
                              ? 'bg-[#176F96] text-white'
                              : hit.kind === 'circle'
                                ? 'bg-amber-100 text-amber-800'
                                : hit.kind === 'person'
                                  ? 'bg-sky-100 text-[#176F96]'
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
              <div className="mb-1 flex shrink-0 items-center justify-between px-1">
                <p className="dashboard-status-pill inline-flex items-center rounded-full border border-transparent bg-(--brand-primary-soft) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--brand-primary)">
                  Your feed
                  <span className="ml-1.5 font-semibold normal-case tracking-normal text-slate-500">
                    · {feed.length}
                  </span>
                </p>
              </div>
            ) : null}

            <div
              ref={feedRef}
              className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-3 pt-1.5 ${hideScroll} ${
                selectedCompany || selectedProfileUserId ? '' : 'space-y-3.5'
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
                      <article className={feedPostFrame}>
                        <div className={feedPostInner}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-slate-200/80 bg-white text-[15px] font-semibold text-[#2098C8] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]">
                            {post.authorName.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold tracking-tight text-slate-900">
                              {post.authorName}
                            </p>
                            <p className="mt-0.5 text-[12px] font-medium text-slate-400">
                              {timeAgo(post.createdAt)}
                            </p>
                            {post.text ? (
                              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.55] text-slate-700">
                                {post.text}
                              </p>
                            ) : null}
                            <div className="mt-3.5 flex items-center gap-1 border-t border-slate-100/80 pt-2">
                              <button
                                type="button"
                                onClick={() => handleLike(post.id)}
                                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-semibold transition ${
                                  liked
                                    ? 'bg-rose-50 text-rose-600'
                                    : 'bg-slate-100/70 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                                {post.likeIds.length || 'Like'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openComments(post.id)}
                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-100/70 py-2.5 text-[12px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              >
                                <MessageCircle className="h-4 w-4" />
                                {commentCount || 'Comment'}
                              </button>
                            </div>
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
                  viewerRealName={realName}
                  posts={companyFeed}
                  isConnected={selectedCompany.memberIds.includes(userId)}
                  canConnect={canConnectToCompany(selectedCompany, {
                    email: user?.email,
                    cvCompanies,
                  })}
                  hideBack={isCompanyAccount && selectedCompany.id === actingCompany?.id}
                  manageAsCompany={
                    isCompanyAccount && selectedCompany.id === actingCompany?.id
                  }
                  variant="feed"
                  initialTab={companyPageInitialTab}
                  onBack={() => {
                    if (isCompanyAccount) return;
                    setSelectedCompanyId(null);
                    setCompanyPageInitialTab(undefined);
                  }}
                  onConnect={() => handleConnectCompany(selectedCompany)}
                  onRefresh={refresh}
                  onOpenChat={openChat}
                  onOpenProfile={openUserProfile}
                  onOpenReferenceModule={() =>
                    openReferenceCheckForCompany(selectedCompany.id, true)
                  }
                  renderPost={(post) => {
                    const liked = Boolean(userId && post.likeIds.includes(userId));
                    const commentCount =
                      commentPostId === post.id
                        ? commentThread.length
                        : getCommentsForPost(post.id).length;
                    const commentsOpen = commentPostId === post.id;
                    return (
                      <article id={`og-post-${post.id}`} className={feedPostFrame}>
                        <div className={feedPostInner}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-slate-200/80 bg-white text-[14px] font-semibold text-[#2098C8]">
                              {selectedCompany.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={selectedCompany.logoUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                post.authorName.slice(0, 1).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
                                {post.authorName}
                              </p>
                              <p className="text-[12px] font-medium text-slate-400">
                                {timeAgo(post.createdAt)}
                              </p>
                            </div>
                          </div>
                          <CompanyPostMedia post={post} />
                          <ExpandableCaption text={post.text} className="mt-3" />
                          <div className="mt-3.5 flex items-center gap-1 border-t border-slate-100/80 pt-2">
                            <button
                              type="button"
                              onClick={() => handleLike(post.id)}
                              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-semibold transition ${
                                liked
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'bg-slate-100/70 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                              {post.likeIds.length || 'Like'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openComments(post.id)}
                              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-semibold transition ${
                                commentsOpen
                                  ? 'bg-sky-50 text-[#2098C8]'
                                  : 'bg-slate-100/70 text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              <MessageCircle className="h-4 w-4" />
                              {commentCount || 'Comment'}
                            </button>
                          </div>
                          {commentsOpen ? (
                            <div className="mt-3 space-y-2.5 rounded-[16px] border border-slate-100/90 bg-slate-50/80 p-3">
                              <div className="max-h-44 space-y-2 overflow-y-auto">
                                {commentThread.map((c) => (
                                  <div
                                    key={c.id}
                                    className="rounded-[14px] bg-white px-3 py-2 shadow-sm"
                                  >
                                    <p className="text-[12px] font-semibold text-slate-800">
                                      {c.authorName}{' '}
                                      <span className="font-medium text-slate-400">
                                        · {timeAgo(c.createdAt)}
                                      </span>
                                    </p>
                                    <p className="mt-0.5 text-[13px] leading-relaxed text-slate-700">
                                      {c.text}
                                    </p>
                                  </div>
                                ))}
                                {commentThread.length === 0 ? (
                                  <p className="px-1 text-[12px] font-medium text-slate-400">
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
                                  placeholder={
                                    isCompanyAccount
                                      ? `Reply as ${actingCompany?.name || 'company'}…`
                                      : 'Write a comment…'
                                  }
                                  className="min-w-0 flex-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-2.5 text-[13px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-[rgba(32,152,200,0.45)]"
                                />
                                <button
                                  type="button"
                                  onClick={handleSendComment}
                                  title="Send"
                                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2098C8] text-white shadow-sm"
                                >
                                  <ComposeAssetIcon src="/icons/send.png" alt="Send" size={18} />
                                </button>
                              </div>
                            </div>
                          ) : null}
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
                    className={`${feedPostFrame} ${
                      highlightPostId === post.id
                        ? 'shadow-[0_0_0_3px_rgba(32,152,200,0.28)]'
                        : ''
                    }`}
                  >
                    <div className={feedPostInner}>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.06),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(32,152,200,0.05),transparent_38%)] opacity-70" />
                    <div className="relative flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => openUserProfile(post.authorId)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/90 bg-linear-to-br from-(--brand-primary-soft) to-white text-[15px] font-semibold text-[#2098C8] shadow-[0_10px_22px_rgba(32,152,200,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] ring-2 ring-[rgba(32,152,200,0.12)] transition group-hover:ring-[rgba(32,152,200,0.22)]"
                        aria-label={`Open ${post.authorName}`}
                      >
                        {post.authorName.slice(0, 1).toUpperCase()}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <button
                            type="button"
                            onClick={() => openUserProfile(post.authorId)}
                            className="text-[15px] font-semibold tracking-tight text-slate-900 hover:text-[#2098C8]"
                          >
                            {post.authorName}
                          </button>
                          <span className="rounded-full bg-slate-100/80 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                            {timeAgo(post.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (post.companyPageId) openCompanyPage(post.companyPageId);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(32,152,200,0.14)] bg-(--brand-primary-soft)/70 px-2.5 py-1 text-[11px] font-semibold text-[#2098C8] transition hover:border-[rgba(32,152,200,0.28)] hover:bg-(--brand-primary-soft)"
                          >
                            {post.companyPageId ? (
                              <Briefcase className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )}
                            {place}
                          </button>
                        </p>
                        <ContainedPostMedia post={post} className="mt-3.5" />
                        <ExpandableCaption text={post.text} className="mt-3" />
                        <div className="mt-4 flex items-center gap-1.5 rounded-[16px] border border-slate-100/90 bg-slate-50/75 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                          <button
                            type="button"
                            onClick={() => handleLike(post.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12px] font-semibold transition ${
                              liked
                                ? 'bg-white text-rose-600 shadow-sm'
                                : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                            {post.likeIds.length ? post.likeIds.length : 'Like'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openComments(post.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12px] font-semibold transition ${
                              commentPostId === post.id
                                ? 'bg-white text-[#2098C8] shadow-sm'
                                : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                            }`}
                          >
                            <MessageCircle className="h-4 w-4" />
                            {commentCount ? commentCount : 'Comment'}
                          </button>
                        </div>

                        {commentPostId === post.id ? (
                          <div className="mt-3 space-y-2.5 rounded-[16px] border border-slate-100/90 bg-white/70 p-3">
                            <div className={`max-h-40 space-y-2 overflow-y-auto ${hideScroll}`}>
                              {commentThread.map((c) => (
                                <div
                                  key={c.id}
                                  className="rounded-[14px] bg-slate-50/90 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                                >
                                  <p className="text-[12px] font-semibold text-slate-800">
                                    {c.authorName}{' '}
                                    <span className="font-medium text-slate-400">
                                      · {timeAgo(c.createdAt)}
                                    </span>
                                  </p>
                                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate-700">
                                    {c.text}
                                  </p>
                                </div>
                              ))}
                              {commentThread.length === 0 ? (
                                <p className="px-1 text-[12px] font-medium text-slate-400">
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
                                className="min-w-0 flex-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-2.5 text-[13px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-[rgba(32,152,200,0.45)]"
                              />
                              <button
                                type="button"
                                onClick={handleSendComment}
                                title="Send"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.96)] transition hover:border-[rgba(32,152,200,0.35)] hover:bg-(--brand-primary-soft)"
                              >
                                <ComposeAssetIcon src="/icons/send.png" alt="Send" size={18} />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    </div>
                  </article>
                );
              })}
              {displayFeed.length === 0 ? (
                <div className={`${card} px-6 py-16 text-center`}>
                  <p className="text-[15px] font-semibold tracking-tight text-slate-800">
                    No posts yet
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-[13px] font-medium leading-relaxed text-slate-500">
                    Open Communities to join a circle and start the conversation.
                  </p>
                </div>
              ) : null}
                </>
              )}
            </div>

          </section>

          {/* RIGHT — discover circles only (feed sidebar) */}
          <aside
            className={`hidden h-full min-h-0 flex-col gap-3 overscroll-contain pb-6 xl:flex ${hideScroll} ${
              ogTab === 'feed' ? '' : 'hidden!'
            } ${isCompanyAccount ? 'overflow-hidden' : 'overflow-y-auto'}`}
          >
            {/* Hot circles — LinkedIn News style (personal account only) */}
            {!isCompanyAccount ? (
            <div className="shrink-0 rounded-[24px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#176F96] p-[1.5px] shadow-[0_12px_30px_rgba(32,152,200,0.12),0_4px_16px_rgba(32,152,200,0.1)]">
              <div className="relative overflow-hidden rounded-[22.5px] bg-linear-to-b from-white via-[#FBFCFE] to-[#F8FAFD]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.14),transparent_36%),radial-gradient(circle_at_top_left,rgba(32,152,200,0.12),transparent_40%)]" />
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-(--brand-accent-glow) blur-3xl" />
              <div className="relative flex items-start justify-between px-4 pb-3 pt-4">
                <div>
                  <div className="dashboard-status-pill inline-flex items-center gap-1.5 rounded-full border border-(--brand-accent-soft) bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--brand-accent) shadow-sm">
                    <Flame className="h-3 w-3" />
                    Hot circles
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-slate-500">
                    Most active right now
                  </p>
                </div>
                <span
                  title="Ranked by posts, likes & comments"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white/80 text-slate-400 shadow-sm"
                >
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
              <ul className="relative space-y-2 px-3 pb-3">
                {visibleHot.map(({ community, label, engagement }, index) => {
                  const isMember = Boolean(userId && community.memberIds.includes(userId));
                  return (
                    <li key={community.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isMember) handleJoin(community.id);
                          openCommunityRoom(community.id);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-[16px] border border-white/90 bg-white/85 px-2.5 py-2.5 text-left shadow-[0_6px_16px_rgba(15,23,42,0.04)] transition hover:-translate-y-px hover:border-[rgba(32,152,200,0.22)] hover:shadow-[0_10px_22px_rgba(32,152,200,0.1)]"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[14px] text-[11px] font-bold text-white ${
                            [
                              'bg-linear-to-br from-[#2098C8] to-[#1A86B3] shadow-[0_8px_16px_rgba(32,152,200,0.28)]',
                              'bg-linear-to-br from-[#2098C8] to-[#1F8FC2] shadow-[0_8px_16px_rgba(32,152,200,0.24)]',
                              'bg-linear-to-br from-[#0EA5E9] to-[#0369A1] shadow-[0_8px_16px_rgba(14,165,233,0.24)]',
                              'bg-linear-to-br from-[#F59E0B] to-[#D97706] shadow-[0_8px_16px_rgba(245,158,11,0.24)]',
                            ][index % 4]
                          }`}
                        >
                          <Users className="mb-0.5 h-3 w-3 opacity-90" />
                          #{index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-semibold tracking-tight text-slate-900">
                              {community.name}
                            </span>
                            {community.visibility === 'private' ? (
                              <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                            ) : (
                              <Globe2 className="h-3 w-3 shrink-0 text-emerald-500" />
                            )}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            <span>{label}</span>
                            {engagement > 0 ? (
                              <span className="rounded-full bg-(--brand-accent-soft) px-1.5 py-0.5 text-[10px] font-semibold text-(--brand-accent)">
                                {engagement} eng
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            isMember
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-[#2098C8] text-white shadow-[0_8px_14px_rgba(32,152,200,0.2)]'
                          }`}
                        >
                          Open
                        </span>
                      </button>
                    </li>
                  );
                })}
                {hotCircles.length === 0 ? (
                  <li className="px-3 py-4 text-center text-[12px] font-medium text-slate-500">
                    No circles yet.
                  </li>
                ) : null}
              </ul>
              {hotCircles.length > 4 ? (
                <button
                  type="button"
                  onClick={() => setShowAllHot((v) => !v)}
                  className="relative flex w-full items-center justify-center gap-1 border-t border-slate-100/80 px-4 py-3 text-[13px] font-semibold text-[#2098C8] hover:bg-(--brand-primary-soft)/50"
                >
                  {showAllHot ? 'Show less' : 'Show more circles'}
                  <ChevronDown
                    className={`h-4 w-4 transition ${showAllHot ? 'rotate-180' : ''}`}
                  />
                </button>
              ) : null}
              </div>
            </div>
            ) : (
              <div className={`${card} relative flex min-h-0 flex-1 flex-col overflow-hidden p-4`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.12),transparent_40%),radial-gradient(circle_at_top_left,rgba(32,152,200,0.1),transparent_42%)]" />
                <div className="relative flex min-h-0 flex-1 flex-col">
                  <h2 className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold tracking-tight text-slate-900">
                    <Building2 className="h-4 w-4 text-[#2098C8]" />
                    Company inbox
                    {companyInboxItems.filter((i) => i.urgency === 'action').length > 0 ? (
                      <span className="rounded-full bg-[#2098C8] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {companyInboxItems.filter((i) => i.urgency === 'action').length}
                      </span>
                    ) : null}
                  </h2>
                  <p className="mt-1.5 shrink-0 text-[12px] font-medium leading-relaxed text-slate-500">
                    Message & reference requests for {actingCompany?.name}.
                  </p>
                  {companyInboxItems.length === 0 ? (
                    <p className="mt-3 flex min-h-48 flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/80 px-3 py-6 text-center text-[12px] text-slate-400">
                      No open requests yet.
                    </p>
                  ) : (
                    <ul className={`mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5 ${hideScroll}`}>
                      {companyInboxItems.map((item) => (
                        <li key={`${item.kind}-${item.id}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompanyId(actingCompany?.id || null);
                              openChat(item.kind, item.id);
                            }}
                            className="flex w-full items-start gap-2 rounded-xl border border-white/90 bg-white/90 px-2.5 py-2 text-left shadow-sm transition hover:border-[rgba(32,152,200,0.28)]"
                          >
                            <span
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                item.kind === 'reference'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-sky-50 text-[#2098C8]'
                              }`}
                            >
                              {item.kind === 'reference' ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <MessageCircle className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12px] font-semibold text-slate-900">
                                {item.title}
                              </span>
                              <span
                                className={`mt-0.5 block text-[10px] font-medium ${
                                  item.urgency === 'action' ? 'text-[#C2410C]' : 'text-slate-500'
                                }`}
                              >
                                {item.subtitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (actingCompany) {
                        setSelectedCompanyId(actingCompany.id);
                        setCompanyPageInitialTab('posts');
                        setOgTab('feed');
                      }
                    }}
                    className="mt-3 w-full shrink-0 rounded-full border border-[rgba(32,152,200,0.25)] bg-white px-3 py-2 text-[11px] font-semibold text-[#2098C8] hover:bg-[#F5FAFD]"
                  >
                    Open company page
                  </button>
                </div>
              </div>
            )}

            <div className={`${card} relative shrink-0 overflow-hidden`}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.12),transparent_42%)]" />
              <div className="relative px-3.5 py-3">
                {isCompanyAccount ? (
                  <>
                    <p className="dashboard-status-pill inline-flex rounded-full border border-[rgba(32,152,200,0.28)] bg-[#FFF8F1] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#C2410C]">
                      Tip
                    </p>
                    <p className="mt-1.5 text-[12px] font-medium leading-snug text-slate-600">
                      Use Company inbox on the right for message & reference requests.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="dashboard-status-pill inline-flex rounded-full border border-transparent bg-(--brand-primary-soft) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--brand-primary)">
                      Tip
                    </p>
                    <p className="mt-2.5 text-[13px] font-medium leading-relaxed text-slate-600">
                      Feed is for reading. To post, open a circle under Communities.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setOgTab('communities');
                        setActiveCommunityId(null);
                      }}
                      className="mt-3.5 w-full rounded-full bg-[#2098C8] px-3 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(32,152,200,0.22)] transition hover:bg-[#2098C8]"
                    >
                      Go to Communities
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Communities — chat-like master/detail; match Feed design system */}
        {ogTab === 'communities' && !isCompanyAccount ? (
          <div className="grid min-h-0 h-full flex-1 items-stretch gap-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <div
              className={`flex min-h-0 h-full flex-col ${
                activeCommunityId ? 'hidden lg:flex' : ''
              }`}
            >
              <div className="flex min-h-0 h-full flex-1 flex-col overflow-hidden rounded-[24px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#176F96] p-[1.5px] shadow-[0_12px_30px_rgba(32,152,200,0.12),0_4px_16px_rgba(32,152,200,0.1)]">
                <div className="relative flex min-h-0 h-full flex-1 flex-col overflow-hidden rounded-[22.5px] bg-linear-to-b from-white via-[#FBFCFE] to-[#F8FAFD]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.12),transparent_36%),radial-gradient(circle_at_top_left,rgba(32,152,200,0.1),transparent_40%)]" />
                  <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100/80 px-3.5 py-3">
                    <div>
                      <h2 className="dashboard-status-pill inline-flex items-center rounded-full border border-(--brand-accent-soft) bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--brand-accent) shadow-sm">
                        Communities
                      </h2>
                      <p className="mt-1.5 text-[12px] font-medium text-slate-500">
                        Circles & company pages
                      </p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setCreateMenuOpen((o) => !o)}
                        className="rounded-full bg-[#2098C8] p-2 text-white shadow-[0_8px_16px_rgba(32,152,200,0.28)] transition hover:bg-[#2098C8]"
                        title="Create"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      {createMenuOpen ? (
                        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]">
                          <button
                            type="button"
                            onClick={() => {
                              setCreateMenuOpen(false);
                              setShowCreateCommunity(true);
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-[#F5FAFD]"
                          >
                            <Users className="h-4 w-4 text-[#2098C8]" />
                            Create circle
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateMenuOpen(false);
                              setShowCreateCompany(true);
                            }}
                            className="flex w-full items-center gap-2.5 border-t border-slate-100 px-3.5 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-[#FFF8F1]"
                          >
                            <Building2 className="h-4 w-4 text-[#2098C8]" />
                            Create company page
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <ul className={`relative min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2.5 ${hideScroll}`}>
                    {joined.map((c, index) => {
                      const postCount = feed.filter((p) => p.communityId === c.id).length;
                      const selected = activeCommunityId === c.id;
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => openCommunityRoom(c.id)}
                            className={`flex w-full items-center gap-3 rounded-[16px] border px-2.5 py-2.5 text-left transition ${
                              selected
                                ? 'border-[rgba(32,152,200,0.28)] bg-(--brand-primary-soft) shadow-[0_8px_18px_rgba(32,152,200,0.12)]'
                                : 'border-white/90 bg-white/85 shadow-[0_6px_16px_rgba(15,23,42,0.04)] hover:-translate-y-px hover:border-[rgba(32,152,200,0.22)]'
                            }`}
                          >
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold text-white ${
                                [
                                  'bg-linear-to-br from-[#2098C8] to-[#1A86B3] shadow-[0_8px_16px_rgba(32,152,200,0.28)]',
                                  'bg-linear-to-br from-[#2098C8] to-[#1F8FC2] shadow-[0_8px_16px_rgba(32,152,200,0.24)]',
                                  'bg-linear-to-br from-[#0EA5E9] to-[#0369A1] shadow-[0_8px_16px_rgba(14,165,233,0.24)]',
                                  'bg-linear-to-br from-[#F59E0B] to-[#D97706] shadow-[0_8px_16px_rgba(245,158,11,0.24)]',
                                ][index % 4]
                              }`}
                            >
                              {c.name.slice(0, 1).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="truncate text-[13px] font-semibold tracking-tight text-slate-900">
                                  {c.name}
                                </span>
                                {c.visibility === 'private' ? (
                                  <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                                ) : (
                                  <Globe2 className="h-3 w-3 shrink-0 text-emerald-500" />
                                )}
                              </span>
                              <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                                {c.memberIds.length} members
                                {postCount > 0 ? ` · ${postCount} posts` : ''}
                              </span>
                            </span>
                            <MessageCircle className="h-4 w-4 shrink-0 text-[#2098C8]/50" />
                          </button>
                        </li>
                      );
                    })}
                    {joined.length === 0 ? (
                      <li className="px-3 py-8 text-center">
                        <Users className="mx-auto h-9 w-9 text-slate-300" />
                        <p className="mt-2 text-sm font-semibold text-slate-800">No communities yet</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          Join from Discover, create a circle, or add a company page.
                        </p>
                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowCreateCommunity(true)}
                            className="rounded-full bg-[#2098C8] px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(32,152,200,0.22)] hover:bg-[#2098C8]"
                          >
                            Create circle
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCreateCompany(true)}
                            className="rounded-full border border-[rgba(32,152,200,0.35)] bg-[#FFF8F1] px-4 py-2 text-xs font-semibold text-[#C2410C] hover:bg-[#FFEDD5]"
                          >
                            Company page
                          </button>
                        </div>
                      </li>
                    ) : null}
                  </ul>
                  <div className={`relative flex max-h-[42%] min-h-0 shrink-0 flex-col border-t border-slate-100/80 px-3.5 py-3`}>
                    <h3 className="dashboard-status-pill inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--brand-accent-soft) bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--brand-accent) shadow-sm">
                      <Flame className="h-3 w-3" />
                      Discover
                    </h3>
                    <ul className={`mt-2.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto ${hideScroll}`}>
                      {hotCircles.slice(0, 6).map(({ community, label, engagement }, index) => {
                        const isMember = Boolean(userId && community.memberIds.includes(userId));
                        return (
                          <li key={community.id}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isMember) handleJoin(community.id);
                                openCommunityRoom(community.id);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-[14px] border border-white/90 bg-white/80 px-2 py-2 text-left shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition hover:border-[rgba(32,152,200,0.22)] hover:bg-white"
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-bold text-white ${
                                  [
                                    'bg-linear-to-br from-[#2098C8] to-[#1A86B3]',
                                    'bg-linear-to-br from-[#2098C8] to-[#1F8FC2]',
                                    'bg-linear-to-br from-[#0EA5E9] to-[#0369A1]',
                                    'bg-linear-to-br from-[#F59E0B] to-[#D97706]',
                                  ][index % 4]
                                }`}
                              >
                                {community.name.slice(0, 1).toUpperCase()}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[12px] font-semibold text-slate-800">
                                  {community.name}
                                </span>
                                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                                  {label}
                                  {engagement > 0 ? ` · ${engagement}` : ''}
                                </span>
                              </span>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  isMember
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-[#2098C8] text-white shadow-[0_6px_12px_rgba(32,152,200,0.2)]'
                                }`}
                              >
                                {isMember ? 'Open' : 'Join'}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`min-h-0 h-full ${
                activeCommunityId ? 'flex' : 'hidden lg:flex'
              } flex-col gap-2.5`}
            >
              {activeCommunity && activeCommunityId ? (
                <>
                  <div className={`${card} relative flex shrink-0 items-center gap-2.5 overflow-hidden px-3.5 py-3`}>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.1),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(32,152,200,0.1),transparent_45%)]" />
                    <button
                      type="button"
                      onClick={() => setActiveCommunityId(null)}
                      className="relative rounded-full p-1.5 text-slate-500 hover:bg-white/80 lg:hidden"
                      aria-label="Back to communities"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-linear-to-br from-[#2098C8] to-[#1F8FC2] text-sm font-bold text-white shadow-[0_8px_16px_rgba(32,152,200,0.24)]">
                      {activeCommunity.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold tracking-tight text-slate-900">
                        {activeCommunity.name}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500">
                        {activeCommunity.memberIds.length} members ·{' '}
                        {activeCommunity.visibility === 'private' ? 'Private' : 'Public'}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 py-3 ${hideScroll}`}
                    style={{
                      backgroundColor: '#DCEEF8',
                      backgroundImage:
                        'radial-gradient(circle at 12% 18%, rgba(32,152,200,0.1), transparent 26%), radial-gradient(circle at 88% 12%, rgba(32,152,200,0.18), transparent 28%), linear-gradient(180deg, #E8F5FC 0%, #E3F1F9 45%, #F0F7FB 100%)',
                    }}
                  >
                    {displayFeed.length === 0 ? (
                      <div className={`${card} px-6 py-14 text-center`}>
                        <p className="text-[15px] font-semibold tracking-tight text-slate-800">
                          No posts yet
                        </p>
                        <p className="mx-auto mt-2 max-w-xs text-[13px] font-medium leading-relaxed text-slate-500">
                          Be the first to share in this circle.
                        </p>
                      </div>
                    ) : (
                      displayFeed.map((post) => {
                        const liked = Boolean(userId && post.likeIds.includes(userId));
                        const commentCount =
                          commentPostId === post.id
                            ? commentThread.length
                            : getCommentsForPost(post.id).length;
                        return (
                          <article key={post.id} className="flex items-start gap-2">
                            <div className="mt-0.5 flex w-8 shrink-0 justify-center">
                              <button
                                type="button"
                                onClick={() => openUserProfile(post.authorId)}
                                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white bg-linear-to-br from-[#2098C8] to-[#1F8FC2] text-[11px] font-bold text-white shadow-sm"
                                aria-label={`Open ${post.authorName}`}
                              >
                                {(post.authorName || '?').slice(0, 1).toUpperCase()}
                              </button>
                            </div>
                            <div className="min-w-0 max-w-[min(100%,520px)] flex-1 rounded-2xl rounded-tl-md border border-[#B8E0F4] bg-linear-to-br from-white via-[#F2FAFE] to-[#DFF2FB] px-3.5 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
                              <div className="mb-1.5 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => openUserProfile(post.authorId)}
                                  className="truncate text-[12px] font-bold text-[#2098C8] hover:underline"
                                >
                                  {post.authorName}
                                </button>
                                <span className="shrink-0 text-[10px] font-medium text-slate-400">
                                  {timeAgo(post.createdAt)}
                                </span>
                              </div>
                              <ContainedPostMedia post={post} className="mt-2" />
                              <ExpandableCaption text={post.text} className="mt-2" />
                              <div className="mt-2.5 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleLike(post.id)}
                                  className={`inline-flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-semibold transition ${
                                    liked
                                      ? 'bg-rose-50 text-rose-600'
                                      : 'bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800'
                                  }`}
                                >
                                  <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
                                  {post.likeIds.length ? post.likeIds.length : 'Like'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openComments(post.id)}
                                  className={`inline-flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-[11px] font-semibold transition ${
                                    commentPostId === post.id
                                      ? 'bg-[#EAF6FC] text-[#2098C8]'
                                      : 'bg-white/70 text-slate-500 hover:bg-white hover:text-slate-800'
                                  }`}
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  {commentCount ? commentCount : 'Comment'}
                                </button>
                              </div>
                              {commentPostId === post.id ? (
                                <div className="mt-2.5 space-y-2 rounded-xl border border-sky-100/80 bg-white/80 p-2.5">
                                  <div className={`max-h-36 space-y-2 overflow-y-auto ${hideScroll}`}>
                                    {commentThread.map((c) => (
                                      <div
                                        key={c.id}
                                        className="rounded-lg bg-slate-50 px-2.5 py-1.5"
                                      >
                                        <p className="text-[11px] font-semibold text-[#2098C8]">
                                          {c.authorName}{' '}
                                          <span className="font-medium text-slate-400">
                                            · {timeAgo(c.createdAt)}
                                          </span>
                                        </p>
                                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-700">
                                          {c.text}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <input
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder="Write a comment…"
                                      className="min-w-0 flex-1 rounded-full border border-slate-200/80 bg-white px-3 py-2 text-[13px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-[rgba(32,152,200,0.45)]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSendComment()}
                                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#2098C8] px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_8px_16px_rgba(32,152,200,0.22)] hover:bg-[#2098C8]"
                                    >
                                      Send
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>

                  <div className="relative shrink-0 rounded-[18px] border border-[rgba(32,152,200,0.2)] bg-(--brand-primary-soft) px-2.5 py-2 shadow-[0_4px_14px_rgba(32,152,200,0.1)]">
                    {!(
                      userId &&
                      activeCommunityId &&
                      activeCommunity?.memberIds.includes(userId)
                    ) ? (
                      <div className="px-2 py-2 text-center">
                        <p className="text-sm font-semibold text-slate-800">Join this circle to post</p>
                        <button
                          type="button"
                          onClick={() => activeCommunityId && handleJoin(activeCommunityId)}
                          className="mt-2 rounded-full bg-[#2098C8] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#1F8FC2]"
                        >
                          Join circle
                        </button>
                      </div>
                    ) : (
                      <div>
                        {mediaPreview ? (
                          <div className="mb-1.5 flex items-center justify-end px-0.5">
                            <button
                              type="button"
                              className="text-[10px] font-semibold text-rose-600"
                              onClick={() => {
                                setMediaPreview(null);
                                setComposeType('text');
                              }}
                            >
                              Remove image
                            </button>
                          </div>
                        ) : null}
                        <div className="flex items-end gap-1.5 rounded-[16px] border border-[rgba(32,152,200,0.22)] bg-white px-1.5 py-1.5 shadow-sm">
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
                          <div className="mb-0.5 flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={insertAtMention}
                              title="Tag someone"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-(--brand-primary-soft)"
                            >
                              <ComposeAssetIcon src="/icons/email.png" alt="Tag" size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              title="Add image"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-(--brand-primary-soft)"
                            >
                              <ComposeAssetIcon src="/icons/image-.png" alt="Image" size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                recording ? mediaRecorderRef.current?.stop() : void startVoice()
                              }
                              title={recording ? 'Stop recording' : 'Voice note'}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-(--brand-primary-soft) ${
                                recording ? 'bg-rose-50 ring-1 ring-rose-300' : ''
                              }`}
                            >
                              <ComposeAssetIcon src="/icons/waveform-path.png" alt="Voice" size={16} />
                            </button>
                          </div>
                          <WritingAssistField
                            inputRef={composeInputRef}
                            value={composeText}
                            onChange={setComposeText}
                            rows={1}
                            wrapperClassName="min-w-0 flex-1"
                            placeholder="Spill the gossip… @ to tag"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!posting) void handlePost();
                              }
                            }}
                            className="max-h-24 min-h-9 w-full resize-none bg-transparent px-1.5 py-2 text-[13px] leading-snug text-slate-800 outline-none placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            disabled={posting}
                            onClick={() => void handlePost()}
                            title="Send (Enter) · New line (Shift+Enter)"
                            className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2098C8] shadow-[0_4px_12px_rgba(32,152,200,0.28)] transition hover:bg-[#1F8FC2] disabled:opacity-50"
                          >
                            {posting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                            ) : (
                              <span className="brightness-0 invert">
                                <ComposeAssetIcon src="/icons/send.png" alt="Send" size={15} />
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className={`${card} relative flex h-full min-h-105 flex-col items-center justify-center overflow-hidden px-6 py-10 text-center`}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.1),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(32,152,200,0.12),transparent_40%)]" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-linear-to-br from-[#2098C8] to-[#1F8FC2] text-white shadow-[0_12px_28px_rgba(32,152,200,0.28)]">
                    <Users className="h-8 w-8" />
                  </div>
                  <h2 className="relative mt-4 text-[16px] font-semibold tracking-tight text-slate-900">
                    Your communities
                  </h2>
                  <p className="relative mt-1.5 max-w-sm text-[13px] font-medium leading-relaxed text-slate-500">
                    Pick a circle from the list. Posts and the compose box open here — same look as
                    Feed.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {ogTab === 'chat' ? (
          <div className="grid min-h-0 h-full flex-1 items-stretch gap-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <div
              className={`flex min-h-0 h-full flex-col ${
                referenceChatId ? 'hidden lg:flex' : ''
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
              (referenceChatKind === 'dm' ||
                referenceChatKind === 'hryantra' ||
                referenceChatKind === 'reference') ? (
                <ReferenceMessagingPanel
                  mode="embedded"
                  kind={referenceChatKind}
                  chatId={referenceChatId}
                  userId={userId}
                  onClose={closeChat}
                  onRefresh={refresh}
                />
              ) : (
                <div className={`${card} relative flex h-full min-h-105 flex-col items-center justify-center overflow-hidden px-6 py-10 text-center`}>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.1),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(32,152,200,0.12),transparent_40%)]" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-linear-to-br from-[#2098C8] to-[#1F8FC2] text-white shadow-[0_12px_28px_rgba(32,152,200,0.28)]">
                    <MessageCircle className="h-8 w-8" />
                  </div>
                  <h2 className="relative mt-4 text-[16px] font-semibold tracking-tight text-slate-900">
                    Your messages
                  </h2>
                  <p className="relative mt-1.5 max-w-sm text-[13px] font-medium leading-relaxed text-slate-500">
                    Pick a conversation from the list. HRYantra and DMs open here in the main
                    panel — same look as Communities.
                  </p>
                  {dmPendingCount > 0 || followPendingCount > 0 ? (
                    <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(32,152,200,0.2)] bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-[#176F96] shadow-sm">
                      {dmPendingCount > 0 ? (
                        <span>
                          {dmPendingCount} message{dmPendingCount === 1 ? '' : 's'} waiting
                        </span>
                      ) : null}
                      {dmPendingCount > 0 && followPendingCount > 0 ? (
                        <span className="text-slate-300">·</span>
                      ) : null}
                      {followPendingCount > 0 ? (
                        <span>
                          {followPendingCount} follow request
                          {followPendingCount === 1 ? '' : 's'}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {ogTab === 'events' ? (
          <div className="grid min-h-0 flex-1 items-stretch gap-3 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[248px_minmax(0,1fr)_272px] lg:gap-4">
            {/* LEFT — profile (Feed-style) */}
            <aside
              className={`hidden min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain pb-4 lg:flex ${hideScroll}`}
            >
              <div className={`${card} relative overflow-hidden border border-slate-200/80`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(32,152,200,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(32,152,200,0.1),transparent_36%)]" />
                <div className="relative px-3.5 pb-4 pt-5 text-center">
                  <div className="mx-auto flex h-17 w-17 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/75 text-xl font-bold tracking-tight text-[#2098C8] shadow-[0_12px_26px_rgba(15,23,42,0.08)] ring-2 ring-[rgba(32,152,200,0.2)]">
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
                  <p className="mt-3 truncate text-[15px] font-semibold tracking-tight text-slate-900">
                    {authorName}
                  </p>
                  <p className="truncate text-[12px] font-medium text-slate-500">
                    {workDomain ? `@${workDomain}` : 'Office Gossips'}
                  </p>
                  <p className="mt-2.5 border-t border-slate-100/80 pt-2.5 text-[11px] font-medium text-slate-500">
                    <span className="font-semibold text-slate-700">{joined.length}</span> circles ·{' '}
                    <span className="font-semibold text-slate-700">
                      {listFollowedCompanyIds(userId || '').length}
                    </span>{' '}
                    following
                  </p>
                </div>
              </div>
            </aside>

            {/* CENTER — wider event posts */}
            <div
              ref={eventsScrollRef}
              className={`min-h-0 overflow-y-auto touch-pan-y ${hideScroll}`}
              onPointerDown={(e) => {
                // Only left-click / primary touch; ignore UI controls
                if (e.button !== 0) return;
                const tag = (e.target as HTMLElement)?.tagName;
                if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'A' || tag === 'TEXTAREA') {
                  return;
                }
                onEventsPullStart(e.clientY);
                if (eventsPullingRef.current) {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    /* ignore */
                  }
                }
              }}
              onPointerMove={(e) => {
                if (!eventsPullingRef.current) return;
                onEventsPullMove(e.clientY);
              }}
              onPointerUp={(e) => {
                try {
                  if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                } catch {
                  /* ignore */
                }
                onEventsPullEnd();
              }}
              onPointerCancel={resetEventsPull}
            >
              <div className="mx-auto w-full max-w-190 space-y-3 px-1 sm:px-0">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    placeholder="Search events, jobs, walk-ins…"
                    className="w-full rounded-full border border-slate-200/90 bg-white/95 py-2.5 pl-10 pr-9 text-[13px] font-medium text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.04)] outline-none placeholder:text-slate-400 focus:border-[rgba(32,152,200,0.45)] focus:ring-2 focus:ring-[rgba(32,152,200,0.12)]"
                  />
                  {eventSearch ? (
                    <button
                      type="button"
                      onClick={() => setEventSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 px-0.5">
                  {eventsQueueCount > 0 && !eventSearch.trim() ? (
                    <button
                      type="button"
                      onClick={() => releaseEventsQueueBatch()}
                      className="rounded-full bg-[#2098C8] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
                    >
                      {eventsQueueCount} new · load
                    </button>
                  ) : null}
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
                          ? 'bg-[#176F96] text-white'
                          : 'bg-white/90 text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {!eventSearch.trim() ? (
              <div
                className="flex flex-col items-center justify-end gap-1 overflow-hidden transition-[height] duration-150"
                style={{
                  height: Math.max(
                    eventsPullDistance,
                    eventsPullHint !== 'idle' ? 52 : 0,
                  ),
                }}
                aria-live="polite"
              >
                {eventsPullHint === 'loading' || eventsPullDistance > 10 ? (
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-200 border-t-[#2098C8] ${
                      eventsPullHint === 'loading' ? 'animate-spin' : ''
                    }`}
                    style={
                      eventsPullHint === 'loading'
                        ? undefined
                        : {
                            transform: `rotate(${Math.min(eventsPullDistance / 56, 1) * 270}deg)`,
                          }
                    }
                    aria-hidden
                  />
                ) : null}
                {eventsPullHint === 'loading' ? (
                  <p className="pb-1 text-[11px] font-semibold text-[#2098C8]">
                    Loading latest…
                  </p>
                ) : eventsPullHint === 'empty' ? (
                  <p className="pb-1 text-[11px] font-semibold text-slate-500">
                    You’re up to date — nothing new waiting
                  </p>
                ) : eventsPullDistance > 10 ? (
                  <p className="pb-1 text-[11px] font-medium text-slate-500">
                    {eventsPullDistance >= 56
                      ? 'Release to load new posts'
                      : 'Pull down for new posts'}
                  </p>
                ) : null}
              </div>
              ) : (
                <p className="px-0.5 text-[11px] font-medium text-slate-500">
                  {eventsMainList.length} match
                  {eventsMainList.length === 1 ? '' : 'es'} in the full events catalog
                </p>
              )}

              {eventsMainList.map((item) => {
                if (item.kind === 'company') {
                  const snap = item.post;
                  const live = companyFeed.find((p) => p.id === snap.id);
                  const post = live
                    ? { ...live, liveSource: snap.liveSource }
                    : snap;
                  const company =
                    (post.companyPageId &&
                      companyPages.find((p) => p.id === post.companyPageId)) ||
                    null;
                  const liked = Boolean(userId && post.likeIds.includes(userId));
                  const commentCount =
                    commentPostId === post.id
                      ? commentThread.length
                      : getCommentsForPost(post.id).length;
                  const commentsOpen = commentPostId === post.id;
                  return (
                    <article id={`og-post-${post.id}`} key={item.id} className={feedPostFrame}>
                      <div className={`${feedPostInner} border border-slate-200/70 px-4 py-3.5 sm:px-5`}>
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (post.companyPageId) setSelectedCompanyId(post.companyPageId);
                              setOgTab('feed');
                            }}
                            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-slate-200/80 bg-white text-[14px] font-semibold text-[#2098C8]"
                            aria-label={`Open ${post.companyName || post.authorName}`}
                          >
                            {company?.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={company.logoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              company?.logoLetter ||
                              (post.companyName || post.authorName).slice(0, 1).toUpperCase()
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (post.companyPageId) setSelectedCompanyId(post.companyPageId);
                                  setOgTab('feed');
                                }}
                                className="truncate text-[14px] font-semibold text-slate-900 hover:text-[#2098C8]"
                              >
                                {post.companyName || post.authorName}
                              </button>
                              {post.liveSource === 'followed' ? (
                                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#176F96]">
                                  Following
                                </span>
                              ) : post.liveSource === 'connected' ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  Connected
                                </span>
                              ) : post.liveSource ? (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                  For you
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {timeAgo(post.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="mx-auto w-full max-w-120">
                          <CompanyPostMedia post={post} compact tight />
                        </div>
                        <ExpandableCaption text={post.text} className="mt-2" />
                        <div className="mt-3 flex items-center gap-1.5 rounded-[16px] border border-slate-100/90 bg-slate-50/75 p-1">
                          <button
                            type="button"
                            onClick={() => handleLike(post.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2 text-[12px] font-semibold transition ${
                              liked
                                ? 'bg-white text-rose-600 shadow-sm'
                                : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                            {post.likeIds.length ? post.likeIds.length : 'Like'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openComments(post.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2 text-[12px] font-semibold transition ${
                              commentsOpen
                                ? 'bg-white text-[#2098C8] shadow-sm'
                                : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                            }`}
                          >
                            <MessageCircle className="h-4 w-4" />
                            {commentCount ? commentCount : 'Comment'}
                          </button>
                        </div>
                        {commentsOpen ? (
                          <div className="mt-3 space-y-2.5 rounded-[16px] border border-slate-100/90 bg-white/70 p-3">
                            <div className={`max-h-36 space-y-2 overflow-y-auto ${hideScroll}`}>
                              {commentThread.map((c) => (
                                <div
                                  key={c.id}
                                  className="rounded-[14px] bg-white px-3 py-2 shadow-sm"
                                >
                                  <p className="text-[12px] font-semibold text-slate-800">
                                    {c.authorName}{' '}
                                    <span className="font-medium text-slate-400">
                                      · {timeAgo(c.createdAt)}
                                    </span>
                                  </p>
                                  <p className="mt-0.5 text-[13px] leading-relaxed text-slate-700">
                                    {c.text}
                                  </p>
                                </div>
                              ))}
                              {commentThread.length === 0 ? (
                                <p className="px-1 text-[12px] font-medium text-slate-400">
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
                                className="min-w-0 flex-1 rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:border-[rgba(32,152,200,0.45)]"
                              />
                              <button
                                type="button"
                                onClick={handleSendComment}
                                title="Send"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2098C8] text-white shadow-sm"
                              >
                                <ComposeAssetIcon src="/icons/send.png" alt="Send" size={16} />
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                }

                const ev = item.event;
                const interested = Boolean(eventInterested[ev.id]);
                const isJob = ev.type === 'job';
                const isLms = Boolean(ev.actionHref?.startsWith('/lms/events'));
                const canOpen = isJob || isLms;
                const isTalkEvent =
                  ev.type === 'webinar' ||
                  ev.type === 'seminar' ||
                  ev.type === 'walk-in' ||
                  ev.type === 'job-fair';
                return (
                  <article
                    key={item.id}
                    className={`${feedPostFrame} ${canOpen ? 'cursor-pointer' : ''}`}
                    onClick={canOpen ? () => openEventCard(ev) : undefined}
                    onKeyDown={
                      canOpen
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openEventCard(ev);
                            }
                          }
                        : undefined
                    }
                    role={canOpen ? 'link' : undefined}
                    tabIndex={canOpen ? 0 : undefined}
                  >
                    <div className={`${feedPostInner} border border-slate-200/70 px-0! py-0!`}>
                    <div className="flex items-center gap-2.5 px-4 pt-3.5 sm:px-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200/80 bg-[#176F96] text-sm font-bold text-white">
                        {isJob ? <Briefcase className="h-4 w-4 text-white" /> : ev.hostInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{ev.hostName}</p>
                        <p className="text-[11px] text-slate-500">
                          {eventTypeLabel(ev.type)} · {timeAgo(ev.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          isJob
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-sky-200 bg-sky-50 text-[#176F96]'
                        }`}
                      >
                        {eventTypeLabel(ev.type)}
                      </span>
                    </div>

                    {/* Seminar / webinar / walk-in: smaller image so card fits one viewport */}
                    <div
                      className={`relative mt-2.5 flex w-full items-center justify-center overflow-hidden border-y border-slate-100 bg-slate-50/90 ${
                        isTalkEvent ? 'py-1.5' : 'py-2'
                      }`}
                    >
                      {ev.imageType === 'video' ? (
                        <video
                          src={ev.imageUrl}
                          className={
                            isTalkEvent
                              ? 'max-h-35 w-auto max-w-[min(100%,360px)] object-contain'
                              : 'max-h-55 w-auto max-w-[min(100%,480px)] object-contain'
                          }
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          className={
                            isTalkEvent
                              ? 'max-h-35 w-auto max-w-[min(100%,360px)] object-contain'
                              : 'max-h-55 w-auto max-w-[min(100%,480px)] object-contain'
                          }
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className={`space-y-2 px-4 sm:px-5 ${isTalkEvent ? 'py-3' : 'space-y-2.5 py-3.5'}`}>
                      <p className="text-sm font-bold leading-snug text-slate-900">{ev.title}</p>
                      <p
                        className={`text-sm leading-relaxed text-slate-700 ${
                          isTalkEvent ? 'line-clamp-2' : 'line-clamp-3'
                        }`}
                      >
                        {ev.body}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {isJob ? (
                            <Briefcase className="h-3.5 w-3.5 text-[#2098C8]" />
                          ) : (
                            <Calendar className="h-3.5 w-3.5 text-[#2098C8]" />
                          )}
                          {ev.whenLabel}
                        </span>
                        {ev.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#2098C8]" />
                            {ev.location}
                          </span>
                        ) : !isJob ? (
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-3.5 w-3.5 text-[#2098C8]" />
                            Online
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ev.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div
                        className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isJob ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEventCard(ev)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-[#176F96] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0F5A7A]"
                            >
                              <Briefcase className="h-3.5 w-3.5" />
                              Apply
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#2098C8] hover:text-[#176F96]"
                            >
                              <Bookmark className="h-3.5 w-3.5" />
                              Save
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#2098C8] hover:text-[#176F96]"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              Share
                            </button>
                          </>
                        ) : (
                          <>
                            {isLms ? (
                              <button
                                type="button"
                                onClick={() => openEventCard(ev)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#176F96] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0F5A7A]"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                                {Number(ev.tokenCost) > 0
                                  ? `${ev.ctaLabel?.trim() || 'Join'} · ${ev.tokenCost} tokens`
                                  : ev.ctaLabel?.trim() || 'Join'}
                              </button>
                            ) : null}
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
                                  ? 'text-[#176F96] hover:bg-sky-50'
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
                    </div>
                  </article>
                );
              })}

              {eventsMainList.length === 0 ? (
                <div className={`${card} border border-slate-200/90 px-5 py-14 text-center text-sm text-slate-500`}>
                  <p>
                    {eventSearch.trim()
                      ? 'No events match that search.'
                      : 'No followed or interest-matched items in this filter yet.'}
                  </p>
                  {eventSearch.trim() ? (
                    <button
                      type="button"
                      onClick={() => setEventSearch('')}
                      className="mt-3 text-xs font-semibold text-[#176F96] hover:underline"
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>
              ) : null}
              </div>
            </div>

            {/* RIGHT — Top for you */}
            <aside className={`hidden min-h-0 flex-col gap-3 overflow-y-auto xl:flex ${hideScroll}`}>
              <div className={`${card} overflow-hidden border border-slate-200/90 p-3.5`}>
                <h2 className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#2098C8]">
                  <Calendar className="h-3.5 w-3.5" />
                  Top for you
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Highest matches from LMS events for your profile.
                </p>
                {topMatchedEvents.length === 0 ? (
                  <p className="mt-3 text-center text-[12px] text-slate-400">
                    No strong matches yet — search the catalog above.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {topMatchedEvents.map((ev) => (
                      <li key={ev.id}>
                        <button
                          type="button"
                          onClick={() => openEventCard(ev)}
                          className="flex w-full items-start gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-2.5 py-2 text-left shadow-sm transition hover:border-[rgba(32,152,200,0.28)]"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#176F96] text-[11px] font-bold text-white">
                            {ev.type === 'job' ? (
                              <Briefcase className="h-3.5 w-3.5" />
                            ) : (
                              ev.hostInitial
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-semibold text-slate-900">
                              {ev.title}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500">
                              {eventTypeLabel(ev.type)} · {ev.hostName}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        ) : null}

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(32,152,200,0.22)] bg-white/95 shadow-[0_-8px_24px_rgba(32,152,200,0.08)] backdrop-blur-md">
          <div className="mx-auto flex h-15 max-w-380 items-stretch justify-around gap-1 px-2 py-1.5">
            {(
              isCompanyAccount
                ? ([
                    { id: 'chat' as const, label: 'Chat', Icon: MessageCircle },
                    { id: 'feed' as const, label: 'Page', Icon: Building2 },
                    { id: 'events' as const, label: 'Events', Icon: Calendar },
                  ] as const)
                : ([
                    { id: 'chat' as const, label: 'Chat', Icon: MessageCircle },
                    { id: 'communities' as const, label: 'Communities', Icon: Users },
                    { id: 'feed' as const, label: 'Feed', Icon: Home },
                    { id: 'events' as const, label: 'Events', Icon: Calendar },
                  ] as const)
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
                    if (id === 'feed') {
                      if (isCompanyAccount && actingCompany) {
                        setSelectedCompanyId(actingCompany.id);
                      } else if (!isCompanyAccount) {
                        setSelectedCompanyId(null);
                      }
                    }
                  }}
                  className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold transition ${
                    active
                      ? 'bg-(--brand-primary-soft) text-[#176F96] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                      : 'text-slate-400 hover:bg-[rgba(232,247,253,0.6)] hover:text-[#176F96]'
                  }`}
                >
                  {active ? (
                    <span className="absolute inset-x-5 top-0 h-[2.5px] rounded-full bg-linear-to-r from-[#2098C8] to-[#176F96]" />
                  ) : null}
                  <Icon
                    className={`h-5 w-5 ${active ? 'stroke-[2.25] text-[#2098C8]' : ''}`}
                  />
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
          creatorEmail={user?.email}
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
        <div className="fixed inset-0 z-400 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
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
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2098C8]"
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
    <div className="fixed inset-0 z-400 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
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
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2098C8]"
            placeholder="e.g. Backend Banter"
          />
        </label>
        <label className="mt-3 block text-sm font-semibold text-slate-800">
          Description
          <WritingAssistField
            value={description}
            onChange={setDescription}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2098C8]"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setVisibility('public')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold ${
              visibility === 'public'
                ? 'border-[#2098C8] bg-sky-50 text-[#176F96]'
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
                ? 'border-[#2098C8] bg-sky-50 text-[#176F96]'
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
  creatorEmail,
  onClose,
  onCreate,
}: {
  defaultDomain: string;
  creatorEmail?: string | null;
  onClose: () => void;
  onCreate: (p: {
    domainOrName: string;
    displayName: string;
    description: string;
    documents: CompanyPageDocument[];
  }) => void;
}) {
  const [domainOrName, setDomainOrName] = useState(defaultDomain);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [docs, setDocs] = useState<Partial<Record<CompanyPageDocumentKind, CompanyPageDocument>>>(
    {},
  );
  const [busyKind, setBusyKind] = useState<CompanyPageDocumentKind | null>(null);

  useEffect(() => {
    setDomainOrName(defaultDomain);
  }, [defaultDomain]);

  const allDocsReady = COMPANY_PAGE_REQUIRED_DOCS.every((d) => Boolean(docs[d.kind]?.dataUrl));
  const canSubmit =
    domainOrName.trim().includes('.') && displayName.trim().length >= 2 && allDocsReady;

  const pickDoc = async (kind: CompanyPageDocumentKind, file: File | null) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      showErrorToast('File too large', 'Keep each document under 6 MB.');
      return;
    }
    setBusyKind(kind);
    try {
      const dataUrl = await fileToDataUrl(file);
      setDocs((prev) => ({
        ...prev,
        [kind]: {
          kind,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString(),
        },
      }));
    } catch {
      showErrorToast('Upload failed', 'Could not read that file.');
    } finally {
      setBusyKind(null);
    }
  };

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center bg-slate-900/45 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[min(92vh,860px)] w-full max-w-xl overflow-hidden rounded-[24px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#176F96] p-[1.5px] shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
        <div className="flex max-h-[min(92vh,860px)] flex-col overflow-hidden rounded-[22.5px] bg-linear-to-b from-white via-[#FBFCFE] to-[#F8FAFD]">
          <div className="relative shrink-0 border-b border-slate-100/80 px-5 py-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.14),transparent_40%),radial-gradient(circle_at_top_left,rgba(32,152,200,0.12),transparent_42%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(32,152,200,0.28)] bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C2410C]">
                  <Building2 className="h-3 w-3" />
                  Company page
                </p>
                <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
                  Create company page
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                  Any email works for now (including Gmail). Upload the mandatory documents to
                  verify the page.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {creatorEmail ? (
              <p className="relative mt-3 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-[12px] text-slate-600">
                Creating as{' '}
                <span className="font-semibold text-slate-900">{creatorEmail}</span>
              </p>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-800 sm:col-span-2">
                Company name <span className="text-rose-500">*</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2098C8]"
                  placeholder="AiTikit"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-800 sm:col-span-2">
                Company domain <span className="text-rose-500">*</span>
                <input
                  value={domainOrName}
                  onChange={(e) => setDomainOrName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2098C8]"
                  placeholder="aitikit.com"
                />
                <span className="mt-1 block text-[11px] font-medium text-slate-400">
                  Unique key for this page — one page per domain.
                </span>
              </label>
              <label className="block text-sm font-semibold text-slate-800 sm:col-span-2">
                About the company
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2098C8]"
                  placeholder="What your company does, who should connect…"
                />
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Mandatory documents <span className="text-rose-500">*</span>
                </h4>
                <span className="text-[11px] font-medium text-slate-400">PDF or image · max 6 MB</span>
              </div>
              <div className="space-y-2.5">
                {COMPANY_PAGE_REQUIRED_DOCS.map((item) => {
                  const uploaded = docs[item.kind];
                  return (
                    <label
                      key={item.kind}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 transition ${
                        uploaded
                          ? 'border-emerald-200 bg-emerald-50/70'
                          : 'border-dashed border-slate-200 bg-white hover:border-[rgba(32,152,200,0.4)] hover:bg-[#F5FAFD]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          uploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-50 text-[#2098C8]'
                        }`}
                      >
                        {uploaded ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-slate-900">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-slate-500">{item.hint}</span>
                        {uploaded ? (
                          <span className="mt-1 block truncate text-[11px] font-medium text-emerald-700">
                            {uploaded.fileName}
                          </span>
                        ) : (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2098C8]">
                            <Upload className="h-3 w-3" />
                            {busyKind === item.kind ? 'Uploading…' : 'Upload file'}
                          </span>
                        )}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          void pickDoc(item.kind, f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100/80 bg-white/90 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() =>
                onCreate({
                  domainOrName: domainOrName.trim(),
                  displayName: displayName.trim(),
                  description: description.trim(),
                  documents: COMPANY_PAGE_REQUIRED_DOCS.map((d) => docs[d.kind]!).filter(Boolean),
                })
              }
              className="rounded-full bg-[#2098C8] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(32,152,200,0.28)] transition hover:bg-[#2098C8] disabled:opacity-45"
            >
              Create company page
            </button>
          </div>
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
      realName,
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
    <div className="fixed inset-0 z-500 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
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
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2098C8]"
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
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2098C8]"
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
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2098C8]"
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
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2098C8]"
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
