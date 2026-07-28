export type CommunityVisibility = 'public' | 'private';

export type CommunityPostType = 'text' | 'image' | 'video' | 'voice';

export type Community = {
  id: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  ownerId: string;
  ownerName: string;
  memberIds: string[];
  createdAt: string;
};

export type CompanyPage = {
  id: string;
  /** Unique key: email domain lowercased, e.g. aitikit.com */
  domainKey: string;
  name: string;
  description: string;
  logoLetter: string;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
};

export type CommunityComment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  communityId?: string;
  communityName?: string;
  companyPageId?: string;
  companyName?: string;
  authorId: string;
  authorName: string;
  type: CommunityPostType;
  text: string;
  mediaUrl?: string;
  mediaMime?: string;
  likeIds: string[];
  createdAt: string;
};

export type CommunityState = {
  communities: Community[];
  companyPages: CompanyPage[];
  posts: CommunityPost[];
  comments: CommunityComment[];
};

const STORAGE_KEY = 'saasa:office-gossips-v5';

/** Demo teammates for reference-check testing (local only). */
export const DEMO_REFERENCE_PEOPLE = [
  {
    userId: 'demo_ref_ananya',
    username: 'ananya_s',
    fee: 6,
    completed: 2,
    role: 'People Ops',
  },
  {
    userId: 'demo_ref_vikram',
    username: 'vikram_p',
    fee: 10,
    completed: 5,
    role: 'Engineering',
  },
  {
    userId: 'demo_ref_meera',
    username: 'meera_k',
    fee: 8,
    completed: 1,
    role: 'Product',
  },
  {
    userId: 'demo_ref_arjun',
    username: 'arjun_dev',
    fee: 5,
    completed: 0,
    role: 'Backend',
  },
  {
    userId: 'demo_ref_priya',
    username: 'priya_pm',
    fee: 12,
    completed: 8,
    role: 'Program Mgr',
  },
] as const;

export function isDemoReferenceUser(userId: string): boolean {
  return userId.startsWith('demo_ref_');
}
function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emailDomain(email?: string | null): string | null {
  if (!email || !email.includes('@')) return null;
  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (
    !domain ||
    domain.includes('gmail.') ||
    domain.includes('yahoo.') ||
    domain.includes('outlook.') ||
    domain.includes('hotmail.') ||
    domain.includes('icloud.')
  ) {
    return null;
  }
  return domain;
}

export function companyKeyFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

/** Strip to alphanumeric brand token (aitikit.com → aitikit). */
export function brandToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[a-z]{2,}$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function hoursAgo(h: number) {
  return new Date(Date.now() - 3600000 * h).toISOString();
}

function seedState(): CommunityState {
  const ownerId = 'system';
  const ownerName = 'Office Gossips';
  const jobSeekers: Community = {
    id: 'c_job_seekers',
    name: 'Job Seekers Hub',
    description: 'Share tips, openings, and interview wins with fellow candidates.',
    visibility: 'public',
    ownerId,
    ownerName,
    memberIds: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  };
  const interviewPrep: Community = {
    id: 'c_interview_prep',
    name: 'Interview Prep Circle',
    description: 'Practice questions, voice answers, and peer feedback.',
    visibility: 'public',
    ownerId,
    ownerName,
    memberIds: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  };
  const watercooler: Community = {
    id: 'c_watercooler',
    name: 'Watercooler',
    description: 'Light office chatter — memes, wins, and weekend plans.',
    visibility: 'public',
    ownerId,
    ownerName,
    memberIds: [],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  };
  const managersOnly: Community = {
    id: 'c_managers_private',
    name: 'Managers Lounge',
    description: 'Private room for leads — hiring gossip stays inside.',
    visibility: 'private',
    ownerId,
    ownerName,
    memberIds: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  const demoMemberIds = DEMO_REFERENCE_PEOPLE.map((p) => p.userId);

  const companies: CompanyPage[] = [
    {
      id: 'co_aitikit',
      domainKey: 'aitikit.com',
      name: 'AiTikit',
      description:
        'Connect if AiTikit is on your CV (current or past). Creating this page requires a verified @aitikit.com work email.',
      logoLetter: 'A',
      memberIds: [...demoMemberIds],
      createdBy: ownerId,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'co_infosys',
      domainKey: 'infosys.com',
      name: 'Infosys',
      description:
        'Connect with Infosys on your CV. Page creation needs a verified @infosys.com email.',
      logoLetter: 'I',
      memberIds: [demoMemberIds[0], demoMemberIds[2]],
      createdBy: ownerId,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 'co_tcs',
      domainKey: 'tcs.com',
      name: 'TCS',
      description:
        'Connect if TCS is on your CV. Only @tcs.com can create the official page.',
      logoLetter: 'T',
      memberIds: [demoMemberIds[1]],
      createdBy: ownerId,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'co_wipro',
      domainKey: 'wipro.com',
      name: 'Wipro',
      description: 'Connect via CV company match. Create requires @wipro.com.',
      logoLetter: 'W',
      memberIds: [],
      createdBy: ownerId,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'co_accenture',
      domainKey: 'accenture.com',
      name: 'Accenture',
      description: 'Connect via CV company match. Create requires @accenture.com.',
      logoLetter: 'A',
      memberIds: [demoMemberIds[3], demoMemberIds[4]],
      createdBy: ownerId,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
  ];
  const demoCompany = companies[0];

  const posts: CommunityPost[] = [
    {
      id: 'p_seed_01',
      communityId: watercooler.id,
      communityName: watercooler.name,
      authorId: ownerId,
      authorName: 'Neha M.',
      type: 'text',
      text: 'Boss just scheduled an urgent meeting 10 mins before I leave office… again 😭 anyone else stuck?',
      likeIds: [],
      createdAt: hoursAgo(0.4),
    },
    {
      id: 'p_seed_02',
      companyPageId: demoCompany.id,
      companyName: demoCompany.name,
      authorId: ownerId,
      authorName: 'Riya (AiTikit)',
      type: 'text',
      text: 'Coffee machine is dead on floor 3. Consider this your official alert. Bring your own caffeine.',
      likeIds: [],
      createdAt: hoursAgo(1),
    },
    {
      id: 'p_seed_03',
      communityId: watercooler.id,
      communityName: watercooler.name,
      authorId: ownerId,
      authorName: 'Kabir T.',
      type: 'text',
      text: 'Someone left “confidential strategy deck” open on the shared TV. We do not talk about what we saw.',
      likeIds: [],
      createdAt: hoursAgo(1.5),
    },
    {
      id: 'p_seed_04',
      communityId: interviewPrep.id,
      communityName: interviewPrep.name,
      authorId: ownerId,
      authorName: 'Arjun K.',
      type: 'text',
      text: 'Voice tip: record STAR answers and play back at 1.25x — filler words become painfully obvious.',
      likeIds: [],
      createdAt: hoursAgo(2),
    },
    {
      id: 'p_seed_05',
      communityId: watercooler.id,
      communityName: watercooler.name,
      authorId: ownerId,
      authorName: 'Simran P.',
      type: 'text',
      text: 'HR sent a “quick sync” invite for Friday 6:45pm. That’s not a sync, that’s a hostage situation.',
      likeIds: [],
      createdAt: hoursAgo(3),
    },
    {
      id: 'p_seed_06',
      communityId: jobSeekers.id,
      communityName: jobSeekers.name,
      authorId: ownerId,
      authorName: 'Priya S.',
      type: 'text',
      text: 'Cleared system design today 🔥 drop a reaction if you want the rough checklist I used.',
      likeIds: [],
      createdAt: hoursAgo(4),
    },
    {
      id: 'p_seed_07',
      communityId: watercooler.id,
      communityName: watercooler.name,
      authorId: ownerId,
      authorName: 'Aman R.',
      type: 'text',
      text: 'Update: standup moved to 8:55am “because leaders have another call.” Please send coffee IV.',
      likeIds: [],
      createdAt: hoursAgo(5),
    },
    {
      id: 'p_seed_08',
      companyPageId: demoCompany.id,
      companyName: demoCompany.name,
      authorId: ownerId,
      authorName: 'Dev M.',
      type: 'text',
      text: 'Prod deploy went green on first try. Suspicious. Checking logs before I jinx it.',
      likeIds: [],
      createdAt: hoursAgo(7),
    },
    {
      id: 'p_seed_09',
      communityId: interviewPrep.id,
      communityName: interviewPrep.name,
      authorId: ownerId,
      authorName: 'Meera J.',
      type: 'text',
      text: 'Recruiter: “quick chat.” 45 mins later I’m explaining every project since college. Classic.',
      likeIds: [],
      createdAt: hoursAgo(9),
    },
    {
      id: 'p_seed_10',
      communityId: watercooler.id,
      communityName: watercooler.name,
      authorId: ownerId,
      authorName: 'Rohan V.',
      type: 'text',
      text: 'Who ate the last samosa from the client meeting tray? Confess. No judgment. Okay, some judgment.',
      likeIds: [],
      createdAt: hoursAgo(11),
    },
  ];

  return {
    communities: [jobSeekers, interviewPrep, watercooler, managersOnly],
    companyPages: companies,
    posts,
    comments: [
      {
        id: 'cm_1',
        postId: 'p_seed_06',
        authorId: ownerId,
        authorName: 'Dev M.',
        text: 'Yes please share the checklist!',
        createdAt: hoursAgo(3.5),
      },
      {
        id: 'cm_2',
        postId: 'p_seed_01',
        authorId: ownerId,
        authorName: 'Kabir T.',
        text: 'Same energy every Thursday. Stay strong.',
        createdAt: hoursAgo(0.3),
      },
      {
        id: 'cm_3',
        postId: 'p_seed_01',
        authorId: ownerId,
        authorName: 'Neha M.',
        text: 'Update: meeting cancelled. Chaos continues.',
        createdAt: hoursAgo(0.2),
      },
      {
        id: 'cm_4',
        postId: 'p_seed_05',
        authorId: ownerId,
        authorName: 'Aman R.',
        text: 'Decline and protect your weekend.',
        createdAt: hoursAgo(2.5),
      },
    ],
  };
}

function normalizeState(raw: Partial<CommunityState> | null): CommunityState {
  if (!raw?.communities?.length) return seedState();
  return {
    communities: raw.communities,
    companyPages: raw.companyPages || [],
    posts: (raw.posts || []).map((p) => ({
      ...p,
      likeIds: Array.isArray(p.likeIds) ? p.likeIds : [],
    })),
    comments: raw.comments || [],
  };
}

/** Ensure demo teammates + identities exist so reference checks are testable. */
export function ensureDemoCompanyPeople(state: CommunityState): CommunityState {
  let changed = false;
  const aitikit = state.companyPages.find(
    (p) => p.id === 'co_aitikit' || p.domainKey === 'aitikit.com',
  );
  if (aitikit) {
    const nextMembers = [...aitikit.memberIds];
    for (const demo of DEMO_REFERENCE_PEOPLE) {
      if (!nextMembers.includes(demo.userId)) {
        nextMembers.push(demo.userId);
        changed = true;
      }
    }
    if (changed) {
      aitikit.memberIds = nextMembers;
      aitikit.description =
        'Connect if AiTikit is on your CV (current or past). Creating this page requires a verified @aitikit.com work email.';
    }
  }
  if (changed) saveCommunityState(state);
  ensureDemoGossipIdentities();
  return state;
}

function ensureDemoGossipIdentities() {
  if (typeof window === 'undefined') return;
  const map = loadIdentityMap();
  let changed = false;
  const now = new Date().toISOString();
  for (const demo of DEMO_REFERENCE_PEOPLE) {
    const existing = map[demo.userId];
    if (existing?.availableForReferenceCheck) continue;
    map[demo.userId] = {
      userId: demo.userId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      isAnonymous: true,
      username: demo.username,
      showInCompanyConnections: true,
      availableForReferenceCheck: true,
      referenceFeeTokens: demo.fee,
      completedReferenceChecks: demo.completed,
      allowPeopleToFollow: true,
      followAnonymously: true,
    };
    changed = true;
  }
  if (changed) saveIdentityMap(map);
}

export function loadCommunityState(): CommunityState {
  if (typeof window === 'undefined') {
    return { communities: [], companyPages: [], posts: [], comments: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      ensureDemoGossipIdentities();
      return seeded;
    }
    const parsed = normalizeState(JSON.parse(raw) as CommunityState);
    const withDemo = ensureDemoCompanyPeople(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withDemo));
    return withDemo;
  } catch {
    return seedState();
  }
}

export function saveCommunityState(state: CommunityState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createCommunity(input: {
  name: string;
  description: string;
  visibility: CommunityVisibility;
  ownerId: string;
  ownerName: string;
}): Community {
  const state = loadCommunityState();
  const community: Community = {
    id: uid('c'),
    name: input.name.trim(),
    description: input.description.trim(),
    visibility: input.visibility,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    memberIds: [input.ownerId],
    createdAt: new Date().toISOString(),
  };
  state.communities = [community, ...state.communities];
  saveCommunityState(state);
  return community;
}

/** One company page per domain — only matching work-email holders may create. */
export function upsertCompanyPage(input: {
  domainOrName: string;
  displayName?: string;
  description?: string;
  userId: string;
  email?: string | null;
}): { page: CompanyPage; created: boolean; error?: string } {
  const state = loadCommunityState();
  const raw = input.domainOrName.trim().toLowerCase().replace(/^@/, '');
  const looksLikeDomain = raw.includes('.') && !raw.includes(' ');
  if (!looksLikeDomain) {
    return {
      page: state.companyPages[0],
      created: false,
      error: 'Enter your work domain to create a page (e.g. aitikit.com).',
    };
  }
  const domainKey = raw;
  if (!domainKey) {
    return {
      page: state.companyPages[0],
      created: false,
      error: 'Enter a company domain (e.g. aitikit.com).',
    };
  }

  const existing = state.companyPages.find((p) => p.domainKey === domainKey);
  if (existing) {
    return {
      page: existing,
      created: false,
      error: 'This company page already exists — connect instead.',
    };
  }

  const createGate = canCreateCompanyPage(domainKey, input.email);
  if (!createGate.ok) {
    return {
      page: state.companyPages[0],
      created: false,
      error: createGate.error,
    };
  }

  const name =
    input.displayName?.trim() ||
    domainKey.split('.')[0].replace(/^\w/, (c) => c.toUpperCase());

  const page: CompanyPage = {
    id: uid('co'),
    domainKey,
    name,
    description:
      input.description?.trim() ||
      `Connect if ${name} is on your CV. Creating this page required a verified @${domainKey} email.`,
    logoLetter: name.slice(0, 1).toUpperCase(),
    memberIds: [input.userId],
    createdBy: input.userId,
    createdAt: new Date().toISOString(),
  };
  state.companyPages = [page, ...state.companyPages];
  saveCommunityState(state);
  return { page, created: true };
}

/**
 * Create = verified work email matching the company domain (unique page per domain).
 */
export function canCreateCompanyPage(
  domainKey: string,
  email?: string | null,
): { ok: boolean; error?: string } {
  const key = String(domainKey || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '');
  if (!key.includes('.')) {
    return { ok: false, error: 'Use a work domain like aitikit.com to create a page.' };
  }
  const domain = emailDomain(email);
  if (!domain) {
    return {
      ok: false,
      error: 'Only a verified work email (not Gmail/Yahoo/etc.) can create a company page.',
    };
  }
  const pageBrand = brandToken(key);
  const emailBrand = brandToken(domain);
  const domainMatch =
    domain === key ||
    domain.endsWith(`.${key}`) ||
    key.endsWith(`.${domain}`) ||
    pageBrand === emailBrand;
  if (!domainMatch) {
    return {
      ok: false,
      error: `Only @${key} work email can create this company page.`,
    };
  }
  return { ok: true };
}

/**
 * Connect = company on CV (current/past) OR matching work email.
 * Interview status is not required.
 */
export function canConnectToCompany(
  page: CompanyPage,
  opts: { email?: string | null; cvCompanies?: string[] },
): boolean {
  const domain = emailDomain(opts.email);
  if (
    domain &&
    (page.domainKey === domain ||
      page.domainKey.endsWith(`.${domain}`) ||
      domain.endsWith(page.domainKey) ||
      brandToken(page.domainKey) === brandToken(domain))
  ) {
    return true;
  }

  const pageBrand = brandToken(page.domainKey);
  const nameKey = brandToken(page.name);
  return (opts.cvCompanies || []).some((c) => {
    const raw = brandToken(c);
    if (!raw || raw.length < 3) return false;
    return (
      raw === nameKey ||
      raw === pageBrand ||
      raw.includes(nameKey) ||
      nameKey.includes(raw) ||
      raw.includes(pageBrand) ||
      pageBrand.includes(raw)
    );
  });
}

export function connectReasonHint(page: CompanyPage): string {
  return `Add “${page.name}” to your CV (current or past work), or use a @${page.domainKey} work email.`;
}

export function connectCompanyPage(pageId: string, userId: string): CompanyPage | null {
  const state = loadCommunityState();
  const page = state.companyPages.find((p) => p.id === pageId);
  if (!page) return null;
  if (!page.memberIds.includes(userId)) {
    page.memberIds = [...page.memberIds, userId];
    saveCommunityState(state);
  }
  return page;
}

export function joinCommunity(communityId: string, userId: string): Community | null {
  const state = loadCommunityState();
  const community = state.communities.find((c) => c.id === communityId);
  if (!community) return null;
  if (!community.memberIds.includes(userId)) {
    community.memberIds = [...community.memberIds, userId];
    saveCommunityState(state);
  }
  return community;
}

export function leaveCommunity(communityId: string, userId: string): Community | null {
  const state = loadCommunityState();
  const community = state.communities.find((c) => c.id === communityId);
  if (!community) return null;
  community.memberIds = community.memberIds.filter((id) => id !== userId);
  saveCommunityState(state);
  return community;
}

export function createPost(input: {
  communityId?: string;
  companyPageId?: string;
  authorId: string;
  authorName: string;
  text: string;
  type: CommunityPostType;
  mediaUrl?: string;
  mediaMime?: string;
}): CommunityPost | null {
  const state = loadCommunityState();
  let communityName: string | undefined;
  let companyName: string | undefined;

  if (input.communityId) {
    const community = state.communities.find((c) => c.id === input.communityId);
    if (!community || !community.memberIds.includes(input.authorId)) return null;
    communityName = community.name;
  } else if (input.companyPageId) {
    const page = state.companyPages.find((p) => p.id === input.companyPageId);
    if (!page || !page.memberIds.includes(input.authorId)) return null;
    companyName = page.name;
  } else {
    return null;
  }

  const post: CommunityPost = {
    id: uid('p'),
    communityId: input.communityId,
    communityName,
    companyPageId: input.companyPageId,
    companyName,
    authorId: input.authorId,
    authorName: input.authorName,
    type: input.type,
    text: input.text.trim(),
    mediaUrl: input.mediaUrl,
    mediaMime: input.mediaMime,
    likeIds: [],
    createdAt: new Date().toISOString(),
  };
  state.posts = [post, ...state.posts];
  saveCommunityState(state);
  return post;
}

export function toggleLike(postId: string, userId: string): CommunityPost | null {
  const state = loadCommunityState();
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return null;
  if (post.likeIds.includes(userId)) {
    post.likeIds = post.likeIds.filter((id) => id !== userId);
  } else {
    post.likeIds = [...post.likeIds, userId];
  }
  saveCommunityState(state);
  return post;
}

export function addComment(input: {
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
}): CommunityComment | null {
  const state = loadCommunityState();
  if (!state.posts.some((p) => p.id === input.postId)) return null;
  const text = input.text.trim();
  if (!text) return null;
  const comment: CommunityComment = {
    id: uid('cm'),
    postId: input.postId,
    authorId: input.authorId,
    authorName: input.authorName,
    text,
    createdAt: new Date().toISOString(),
  };
  state.comments = [...state.comments, comment];
  saveCommunityState(state);
  return comment;
}

export function getCommentsForPost(postId: string): CommunityComment[] {
  return loadCommunityState()
    .comments.filter((c) => c.postId === postId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function getVisibleFeed(userId: string | null): CommunityPost[] {
  const state = loadCommunityState();
  const byCommunity = new Map(state.communities.map((c) => [c.id, c]));
  const byCompany = new Map(state.companyPages.map((c) => [c.id, c]));
  return state.posts
    .filter((p) => {
      if (p.communityId) {
        const c = byCommunity.get(p.communityId);
        if (!c) return false;
        if (c.visibility === 'public') return true;
        return Boolean(userId && c.memberIds.includes(userId));
      }
      if (p.companyPageId) {
        const co = byCompany.get(p.companyPageId);
        if (!co) return false;
        // Company posts visible to all; posting still requires connect
        return true;
      }
      return false;
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getJoinedCommunities(userId: string): Community[] {
  return loadCommunityState().communities.filter((c) => c.memberIds.includes(userId));
}

export function getConnectedCompanies(userId: string): CompanyPage[] {
  return loadCommunityState().companyPages.filter((c) => c.memberIds.includes(userId));
}

/** Company pages this user created (admin / company-account switch). */
export function getOwnedCompanyPages(userId: string): CompanyPage[] {
  if (!userId) return [];
  return loadCommunityState().companyPages.filter((c) => c.createdBy === userId);
}

export type HotCircleStat = {
  community: Community;
  postCount: number;
  commentCount: number;
  engagement: number;
  label: string;
};

/** Rank circles by posts + comments for “hot / active” sidebar. */
export function getHotCircles(limit = 5): HotCircleStat[] {
  const state = loadCommunityState();
  const commentsByPost = new Map<string, number>();
  for (const c of state.comments) {
    commentsByPost.set(c.postId, (commentsByPost.get(c.postId) || 0) + 1);
  }

  return state.communities
    .map((community) => {
      const posts = state.posts.filter((p) => p.communityId === community.id);
      const commentCount = posts.reduce(
        (sum, p) => sum + (commentsByPost.get(p.id) || 0) + p.likeIds.length,
        0,
      );
      const postCount = posts.length;
      const engagement = postCount * 2 + commentCount;
      let label = 'Quiet today';
      if (engagement >= 8) label = 'Very active';
      else if (engagement >= 4) label = 'Heating up';
      else if (postCount > 0) label = `${postCount} recent posts`;
      return { community, postCount, commentCount, engagement, label };
    })
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);
}

export function canViewCommunity(community: Community, userId: string | null): boolean {
  if (community.visibility === 'public') return true;
  return Boolean(userId && community.memberIds.includes(userId));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Office Gossips identity / privacy (per candidate). */
export type GossipIdentity = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  /** When true, others see `username` instead of real name. */
  isAnonymous: boolean;
  /** Unique public handle (required when anonymous; optional otherwise). */
  username: string;
  /** Appear in company connection / member lists. */
  showInCompanyConnections: boolean;
  /** Available when others request a reference check. */
  availableForReferenceCheck: boolean;
  /** Tokens charged per accepted reference check (capped by experience). */
  referenceFeeTokens: number;
  /** Completed rated reference checks given (raises fee cap). */
  completedReferenceChecks: number;
  /** Others may send follow requests. */
  allowPeopleToFollow: boolean;
  /** Prefer anonymous name when following companies / people. */
  followAnonymously: boolean;
};

const IDENTITY_KEY = 'saasa:office-gossips-identity-v1';

/** Initial fee cap; rises with completed reference checks. */
export function getMaxReferenceFee(completedChecks = 0): number {
  const n = Math.max(0, Math.floor(Number(completedChecks) || 0));
  return Math.min(100, 20 + n * 2);
}

export function clampReferenceFee(fee: number, completedChecks = 0): number {
  const max = getMaxReferenceFee(completedChecks);
  const n = Math.round(Number(fee) || 0);
  return Math.max(1, Math.min(max, n));
}

function normalizeIdentity(row: GossipIdentity): GossipIdentity {
  const completed = Math.max(0, Math.floor(Number(row.completedReferenceChecks) || 0));
  return {
    ...row,
    completedReferenceChecks: completed,
    referenceFeeTokens: clampReferenceFee(row.referenceFeeTokens ?? 5, completed),
    allowPeopleToFollow: row.allowPeopleToFollow !== false,
    followAnonymously: Boolean(row.followAnonymously),
  };
}

function loadIdentityMap(): Record<string, GossipIdentity> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, GossipIdentity>;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, GossipIdentity> = {};
    for (const [id, row] of Object.entries(parsed)) {
      if (row && typeof row === 'object') out[id] = normalizeIdentity(row as GossipIdentity);
    }
    return out;
  } catch {
    return {};
  }
}

function saveIdentityMap(map: Record<string, GossipIdentity>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(map));
}

export function getGossipIdentity(userId: string | null | undefined): GossipIdentity | null {
  if (!userId) return null;
  return loadIdentityMap()[userId] || null;
}

export function hasGossipAccount(userId: string | null | undefined): boolean {
  return Boolean(getGossipIdentity(userId));
}

export function normalizeGossipUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
}

export function isGossipUsernameTaken(username: string, excludeUserId?: string): boolean {
  const key = normalizeGossipUsername(username);
  if (!key) return false;
  const map = loadIdentityMap();
  return Object.values(map).some(
    (row) =>
      row.username === key && (!excludeUserId || row.userId !== excludeUserId),
  );
}

/** Instant unique handle for anonymous mode. */
export function suggestAnonymousUsername(): string {
  const adjectives = ['quiet', 'swift', 'bright', 'calm', 'keen', 'bold', 'witty', 'sharp'];
  const nouns = ['fox', 'owl', 'kite', 'oak', 'wave', 'spark', 'nova', 'pixel'];
  for (let i = 0; i < 40; i++) {
    const a = adjectives[Math.floor(Math.random() * adjectives.length)];
    const n = nouns[Math.floor(Math.random() * nouns.length)];
    const suffix = Math.floor(10 + Math.random() * 89);
    const candidate = normalizeGossipUsername(`${a}_${n}${suffix}`);
    if (candidate && !isGossipUsernameTaken(candidate)) return candidate;
  }
  return normalizeGossipUsername(`anon_${Date.now().toString(36).slice(-6)}`);
}

export function createGossipAccount(input: {
  userId: string;
  isAnonymous: boolean;
  username?: string;
  showInCompanyConnections: boolean;
  availableForReferenceCheck: boolean;
}): { ok: true; identity: GossipIdentity } | { ok: false; error: string } {
  if (!input.userId) return { ok: false, error: 'Sign in required.' };
  if (hasGossipAccount(input.userId)) {
    return { ok: false, error: 'Office Gossips account already exists.' };
  }

  let username = normalizeGossipUsername(input.username || '');
  if (input.isAnonymous) {
    if (!username) username = suggestAnonymousUsername();
    if (isGossipUsernameTaken(username)) {
      return { ok: false, error: 'That username is taken — pick another.' };
    }
  } else if (username && isGossipUsernameTaken(username)) {
    return { ok: false, error: 'That username is taken — pick another.' };
  }

  const now = new Date().toISOString();
  const identity: GossipIdentity = {
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
    isAnonymous: Boolean(input.isAnonymous),
    username: username || '',
    showInCompanyConnections: Boolean(input.showInCompanyConnections),
    availableForReferenceCheck: Boolean(input.availableForReferenceCheck),
    referenceFeeTokens: 5,
    completedReferenceChecks: 0,
    allowPeopleToFollow: true,
    followAnonymously: Boolean(input.isAnonymous),
  };
  const map = loadIdentityMap();
  map[input.userId] = identity;
  saveIdentityMap(map);
  return { ok: true, identity };
}

export function updateGossipIdentity(
  userId: string,
  patch: Partial<
    Pick<
      GossipIdentity,
      | 'isAnonymous'
      | 'username'
      | 'showInCompanyConnections'
      | 'availableForReferenceCheck'
      | 'referenceFeeTokens'
      | 'completedReferenceChecks'
      | 'allowPeopleToFollow'
      | 'followAnonymously'
    >
  >,
): { ok: true; identity: GossipIdentity } | { ok: false; error: string } {
  const map = loadIdentityMap();
  const current = map[userId];
  if (!current) return { ok: false, error: 'Create an Office Gossips account first.' };

  let username =
    patch.username !== undefined
      ? normalizeGossipUsername(patch.username)
      : current.username;
  const isAnonymous =
    patch.isAnonymous !== undefined ? Boolean(patch.isAnonymous) : current.isAnonymous;

  if (isAnonymous && !username) {
    username = suggestAnonymousUsername();
  }
  if (username && isGossipUsernameTaken(username, userId)) {
    return { ok: false, error: 'That username is taken — pick another.' };
  }
  if (isAnonymous && !username) {
    return { ok: false, error: 'Anonymous mode needs a unique username.' };
  }

  const completed =
    patch.completedReferenceChecks !== undefined
      ? Math.max(0, Math.floor(Number(patch.completedReferenceChecks) || 0))
      : current.completedReferenceChecks ?? 0;
  const feeRaw =
    patch.referenceFeeTokens !== undefined
      ? patch.referenceFeeTokens
      : current.referenceFeeTokens ?? 5;

  const identity: GossipIdentity = {
    ...current,
    isAnonymous,
    username: username || '',
    showInCompanyConnections:
      patch.showInCompanyConnections !== undefined
        ? Boolean(patch.showInCompanyConnections)
        : current.showInCompanyConnections,
    availableForReferenceCheck:
      patch.availableForReferenceCheck !== undefined
        ? Boolean(patch.availableForReferenceCheck)
        : current.availableForReferenceCheck,
    completedReferenceChecks: completed,
    referenceFeeTokens: clampReferenceFee(feeRaw, completed),
    allowPeopleToFollow:
      patch.allowPeopleToFollow !== undefined
        ? Boolean(patch.allowPeopleToFollow)
        : current.allowPeopleToFollow !== false,
    followAnonymously:
      patch.followAnonymously !== undefined
        ? Boolean(patch.followAnonymously)
        : Boolean(current.followAnonymously),
    updatedAt: new Date().toISOString(),
  };
  map[userId] = identity;
  saveIdentityMap(map);
  return { ok: true, identity };
}

/** Name others see on posts / comments. */
export function getGossipDisplayName(
  userId: string | null | undefined,
  fallbackRealName: string,
): string {
  const identity = getGossipIdentity(userId);
  if (!identity) return fallbackRealName;
  if (identity.isAnonymous) {
    return identity.username ? identity.username : 'Anonymous';
  }
  return fallbackRealName;
}

/** Members visible on a company page (respects showInCompanyConnections). */
export function getVisibleCompanyMemberIds(companyPageId: string): string[] {
  const state = loadCommunityState();
  const page = state.companyPages.find((p) => p.id === companyPageId);
  if (!page) return [];
  return page.memberIds.filter((id) => {
    const identity = getGossipIdentity(id);
    // Legacy members without identity still show; new accounts follow the toggle.
    if (!identity) return true;
    return identity.showInCompanyConnections;
  });
}

export function listReferenceCheckCandidates(): GossipIdentity[] {
  return Object.values(loadIdentityMap()).filter((row) => row.availableForReferenceCheck);
}

/** People on a company page who opted in for reference checks. */
export function listOpenForReferenceOnCompany(companyPageId: string): Array<{
  userId: string;
  displayName: string;
  feeTokens: number;
  completedChecks: number;
}> {
  const memberIds = getVisibleCompanyMemberIds(companyPageId);
  const out: Array<{
    userId: string;
    displayName: string;
    feeTokens: number;
    completedChecks: number;
  }> = [];
  for (const id of memberIds) {
    const identity = getGossipIdentity(id);
    if (!identity?.availableForReferenceCheck) continue;
    out.push({
      userId: id,
      displayName: getGossipDisplayName(id, `Member ${id.slice(-4)}`),
      feeTokens: identity.referenceFeeTokens,
      completedChecks: identity.completedReferenceChecks,
    });
  }
  return out;
}

export function searchCompanyPages(query: string): CompanyPage[] {
  const q = query.trim().toLowerCase();
  const pages = loadCommunityState().companyPages;
  if (!q) return pages;
  return pages.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.domainKey.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}

export type CommunitySearchHit =
  | { kind: 'company'; id: string; title: string; subtitle: string; letter: string }
  | { kind: 'circle'; id: string; title: string; subtitle: string; private: boolean }
  | { kind: 'person'; id: string; title: string; subtitle: string }
  | { kind: 'post'; id: string; title: string; subtitle: string; companyPageId?: string };

/** Unified search across companies, circles, people, and posts. */
export function searchCommunityEverything(query: string, limit = 24): CommunitySearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const state = loadCommunityState();
  const hits: CommunitySearchHit[] = [];

  for (const p of state.companyPages) {
    if (
      p.name.toLowerCase().includes(q) ||
      p.domainKey.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    ) {
      hits.push({
        kind: 'company',
        id: p.id,
        title: p.name,
        subtitle: `${p.domainKey} · ${p.memberIds.length} connected`,
        letter: p.logoLetter,
      });
    }
  }

  for (const c of state.communities) {
    if (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
      hits.push({
        kind: 'circle',
        id: c.id,
        title: c.name,
        subtitle: `${c.memberIds.length} members · ${c.visibility}`,
        private: c.visibility === 'private',
      });
    }
  }

  const seenPeople = new Set<string>();
  for (const row of Object.values(loadIdentityMap())) {
    const name = getGossipDisplayName(row.userId, row.username || row.userId);
    const hay = `${name} ${row.username}`.toLowerCase();
    if (!hay.includes(q)) continue;
    if (seenPeople.has(row.userId)) continue;
    seenPeople.add(row.userId);
    hits.push({
      kind: 'person',
      id: row.userId,
      title: name,
      subtitle: row.availableForReferenceCheck
        ? 'Open for reference'
        : row.showInCompanyConnections
          ? 'Community member'
          : 'Member',
    });
  }

  // Also surface seeded author names from posts (demo posters)
  for (const post of state.posts) {
    if (seenPeople.has(post.authorId)) continue;
    if (post.authorName.toLowerCase().includes(q)) {
      seenPeople.add(post.authorId);
      hits.push({
        kind: 'person',
        id: post.authorId,
        title: post.authorName,
        subtitle: 'From feed',
      });
    }
  }

  for (const post of state.posts) {
    const place = post.companyName || post.communityName || '';
    if (
      post.text.toLowerCase().includes(q) ||
      post.authorName.toLowerCase().includes(q) ||
      place.toLowerCase().includes(q)
    ) {
      hits.push({
        kind: 'post',
        id: post.id,
        title: post.text.slice(0, 72) + (post.text.length > 72 ? '…' : ''),
        subtitle: `${post.authorName}${place ? ` · ${place}` : ''}`,
        companyPageId: post.companyPageId,
      });
    }
  }

  return hits.slice(0, limit);
}

