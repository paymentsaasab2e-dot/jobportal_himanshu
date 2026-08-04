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

const TICKET_STORAGE_KEY = 'saasa:help-tickets-v1';
export const HQ_TICKETS_API_PATH = '/api/hq-tickets';

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

export function saveHelpTicket(ticket: Omit<HelpTicket, 'id' | 'createdAt'>): HelpTicket {
  const full: HelpTicket = {
    ...ticket,
    id: `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const prev = loadHelpTickets();
  const next = [full, ...prev].slice(0, 40);
  try {
    localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return full;
}

/** Relay ticket to HQ so GET /api/hq-tickets can list it. */
export async function postHelpTicketToHq(ticket: HelpTicket): Promise<boolean> {
  try {
    const res = await fetch(HQ_TICKETS_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...ticket,
        source: 'help_page',
        status: 'open',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
