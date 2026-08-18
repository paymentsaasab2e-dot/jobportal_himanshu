/** Common problems users hit in the product — shown on Help (not FAQ). */

export type HelpProblem = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  /** Prefills ticket category when user clicks “Raise ticket” */
  ticketCategory: string;
};

export const HELP_PROBLEMS: HelpProblem[] = [
  {
    id: 'login-otp',
    title: 'Cannot sign in or OTP not arriving',
    summary: 'WhatsApp / email OTP delayed, wrong number, or password login fails.',
    steps: [
      'Confirm the same email or WhatsApp number you registered with.',
      'Wait 60 seconds, then use Resend OTP once.',
      'Check spam / promotions for the OTP email.',
      'If you already have an account, use Sign in (not Create account).',
      'Still stuck? Raise a ticket with the phone/email you tried.',
    ],
    ticketCategory: 'Login & account',
  },
  {
    id: 'duplicate-email-phone',
    title: 'Email or mobile already in use',
    summary: 'Profile save or signup blocked because another account owns that contact.',
    steps: [
      'Sign in with the account that already uses that email or phone.',
      'Do not create a second account with the same details.',
      'In Profile → Basic info, change only to an unused email/phone.',
      'Raise a ticket if you lost access to the original account.',
    ],
    ticketCategory: 'Login & account',
  },
  {
    id: 'few-jobs',
    title: 'Few or no matching jobs',
    summary: 'Explore Jobs looks empty or poorly matched.',
    steps: [
      'Complete missing Profile sections (skills, experience, resume).',
      'Add skills that match your target role.',
      'Update AI CV wording to match job descriptions.',
      'Refresh Explore Jobs after saving the profile.',
    ],
    ticketCategory: 'Jobs & applications',
  },
  {
    id: 'apply-failed',
    title: 'Application not submitting or status missing',
    summary: 'Apply button fails, or you cannot see status after applying.',
    steps: [
      'Confirm you are signed in and your resume/profile is saved.',
      'Retry once on a stable connection.',
      'Check Dashboard → Applications for Submitted / Under review.',
      'Raise a ticket with the job title and approximate apply time.',
    ],
    ticketCategory: 'Jobs & applications',
  },
  {
    id: 'tokens',
    title: 'Not enough tokens for a paid action',
    summary: 'Interview unlock, reference check, or premium LMS step asks for tokens.',
    steps: [
      'Open Subscriptions / token packages and top up.',
      'Retry the same action after the balance updates.',
      'Note the exact feature name (e.g. Become Interviewer, Reference Check).',
      'Raise a ticket if tokens were deducted but the unlock did not apply.',
    ],
    ticketCategory: 'Tokens & payments',
  },
  {
    id: 'og-setup',
    title: 'Office Gossips keeps asking to set up / be anonymous',
    summary: 'Gossip identity or setup flag missing on this browser.',
    steps: [
      'Finish the Office Gossips setup once (username + anonymity choice).',
      'Do not clear site data if you want the identity to stick on this device.',
      'Use the same signed-in account — identity is tied to your user id.',
      'Raise a ticket if setup never saves after a successful submit.',
    ],
    ticketCategory: 'Office Gossips',
  },
  {
    id: 'hryantra-alerts',
    title: 'Not seeing HRYantra tips or chat alerts',
    summary: 'Floating button missing, or unread suggestions not opening.',
    steps: [
      'Confirm you are signed in (FAB only shows when logged in).',
      'Open Office Gossips → Chat → HRYantra Verified.',
      'Allow notifications if the browser asked; refresh the page once.',
      'Raise a ticket if the chat thread never loads.',
    ],
    ticketCategory: 'Office Gossips',
  },
  {
    id: 'reference-check',
    title: 'Reference check stuck or fee issue',
    summary: 'Request pending forever, accept fails, or rating / payout unclear.',
    steps: [
      'Open the request card and check status (pending, accepted, answered).',
      'Confirm both sides used the same Reference Check flow and tokens available.',
      'Wait for the other person to accept or answer before rating.',
      'Raise a ticket with the request id or company/person name.',
    ],
    ticketCategory: 'Reference check',
  },
  {
    id: 'profile-save',
    title: 'Profile or CV changes not saving',
    summary: 'Basic info, skills, or resume editor reverts after refresh.',
    steps: [
      'Wait for the silent save / success toast before leaving the page.',
      'Stay online — offline edits may not sync.',
      'Reload once and check whether the last save appeared.',
      'Raise a ticket naming the section (Basic info, Skills, Resume, etc.).',
    ],
    ticketCategory: 'Profile & CV',
  },
  {
    id: 'employer-access',
    title: 'Employer demo or workspace access',
    summary: 'Hiring team cannot reach employer tools or book a demo.',
    steps: [
      'Use Employers → Book a demo or email support@saasab2e.com.',
      'Include company name and hiring needs in the request.',
      'Candidate portal login is separate from employer workspace.',
      'Raise a ticket under Employers if you already booked and got no reply.',
    ],
    ticketCategory: 'Employers',
  },
];

export const HELP_TICKET_CATEGORIES = [
  'Login & account',
  'Jobs & applications',
  'Profile & CV',
  'Tokens & payments',
  'Office Gossips',
  'Reference check',
  'LMS & interview prep',
  'Employers',
  'Other',
] as const;

export type HelpTicketCategory = (typeof HELP_TICKET_CATEGORIES)[number];

export type HelpTicketStatus = 'open' | 'in_progress' | 'closed';

export type HelpTicket = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  problemId?: string;
  userId?: string;
};

export type HelpTicketWithStatus = HelpTicket & {
  status?: HelpTicketStatus;
};

export type HelpTicketMessage = {
  id: string;
  ticketId: string;
  senderRole: 'candidate' | 'hq';
  senderName?: string;
  senderId?: string | null;
  body: string;
  createdAt: string;
};

const TICKET_STORAGE_KEY = 'saasa:help-tickets-v1';
export const HQ_TICKETS_API_PATH = '/api/hq-tickets';
export const HQ_TICKET_MESSAGES_API_PATH = '/api/hq-tickets/messages';

export function loadHelpTickets(): HelpTicket[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TICKET_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function nextLocalFiveDigitId(existing: HelpTicket[]): string {
  let max = 9999;
  for (const row of existing) {
    const n = Number(String(row.id || '').trim());
    if (Number.isInteger(n) && n >= 10000 && n <= 99999) max = Math.max(max, n);
  }
  return String(Math.min(99999, max + 1));
}

export function saveHelpTicket(
  ticket: Omit<HelpTicket, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): HelpTicket {
  const prev = loadHelpTickets();
  const incoming = String(ticket.id || '').trim();
  const id = /^\d{5}$/.test(incoming) ? incoming : nextLocalFiveDigitId(prev);
  const full: HelpTicket = {
    ...ticket,
    id,
    createdAt: ticket.createdAt || new Date().toISOString(),
  };
  const next = [full, ...prev.filter((row) => row.id !== full.id)].slice(0, 40);
  try {
    localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return full;
}

export function filterHelpTicketsForUser(
  tickets: HelpTicket[],
  opts: { userId?: string; email?: string },
): HelpTicket[] {
  const email = opts.email?.trim().toLowerCase();
  const userId = opts.userId?.trim();
  if (!email && !userId) return [];

  return tickets.filter((ticket) => {
    if (userId && ticket.userId === userId) return true;
    if (email && ticket.email.trim().toLowerCase() === email) return true;
    return false;
  });
}

/** Merge local tickets with HQ API (status updates) for the current user. */
export async function fetchMyHelpTickets(opts: {
  userId?: string;
  email?: string;
}): Promise<HelpTicketWithStatus[]> {
  const email = opts.email?.trim();
  const userId = opts.userId?.trim();
  if (!email && !userId) return [];

  const local = filterHelpTicketsForUser(loadHelpTickets(), { userId, email });

  let remote: HelpTicketWithStatus[] = [];
  if (email) {
    try {
      const res = await fetch(
        `${HQ_TICKETS_API_PATH}?email=${encodeURIComponent(email)}&limit=50`,
      );
      if (res.ok) {
        const json = await res.json();
        remote = Array.isArray(json?.data?.tickets) ? json.data.tickets : [];
      }
    } catch {
      /* ignore network errors — fall back to local */
    }
  }

  const byId = new Map<string, HelpTicketWithStatus>();
  for (const ticket of local) {
    byId.set(ticket.id, { ...ticket, status: 'open' });
  }
  for (const ticket of remote) {
    const existing = byId.get(ticket.id);
    byId.set(ticket.id, {
      ...(existing || ticket),
      ...ticket,
      status: ticket.status || existing?.status || 'open',
    });
  }

  let merged = Array.from(byId.values());
  if (userId) {
    merged = merged.filter(
      (ticket) =>
        ticket.userId === userId ||
        (email && ticket.email.trim().toLowerCase() === email.toLowerCase()),
    );
  } else if (email) {
    merged = merged.filter((ticket) => ticket.email.trim().toLowerCase() === email.toLowerCase());
  }

  return merged.sort((a, b) => {
    const aDone = a.status === 'closed' ? 1 : 0;
    const bDone = b.status === 'closed' ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function fetchHelpTicketMessages(opts: {
  ticketId: string;
  email?: string;
  userId?: string;
}): Promise<{ messages: HelpTicketMessage[]; status: HelpTicketStatus }> {
  const qs = new URLSearchParams({ ticketId: opts.ticketId });
  if (opts.email) qs.set('email', opts.email);
  if (opts.userId) qs.set('userId', opts.userId);
  try {
    const res = await fetch(`${HQ_TICKET_MESSAGES_API_PATH}?${qs.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { messages: [], status: 'open' };
    const json = await res.json();
    const status = json?.data?.status;
    return {
      messages: Array.isArray(json?.data?.messages) ? json.data.messages : [],
      status:
        status === 'closed' || status === 'in_progress' || status === 'open' ? status : 'open',
    };
  } catch {
    return { messages: [], status: 'open' };
  }
}

export async function sendHelpTicketMessage(opts: {
  ticketId: string;
  body: string;
  email?: string;
  userId?: string;
  senderName?: string;
  senderRole?: 'candidate' | 'hq';
}): Promise<HelpTicketMessage | null> {
  try {
    const res = await fetch(HQ_TICKET_MESSAGES_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId: opts.ticketId,
        body: opts.body,
        email: opts.email,
        userId: opts.userId,
        senderName: opts.senderName,
        senderRole: opts.senderRole || 'candidate',
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

/** Relay ticket to HQ so GET /api/hq-tickets can list it. Returns the server ticket (5-digit ID). */
export async function postHelpTicketToHq(
  ticket: Omit<HelpTicket, 'id'> & { id?: string },
): Promise<HelpTicket | null> {
  try {
    const res = await fetch(HQ_TICKETS_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ticket,
        id: undefined,
        source: 'help_page',
        status: 'open',
      }),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const saved = json?.data as HelpTicket | undefined;
    return saved?.id ? saved : null;
  } catch {
    return null;
  }
}
