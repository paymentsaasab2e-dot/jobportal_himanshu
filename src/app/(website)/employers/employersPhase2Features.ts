import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Coins,
  Contact,
  FileSearch,
  FileText,
  GitBranch,
  Globe2,
  Inbox,
  Kanban,
  LayoutDashboard,
  Link2,
  MapPin,
  Network,
  Package,
  Shield,
  Sparkles,
  Target,
  UserCheck,
  UserRoundSearch,
  Users,
  Wallet,
  Workflow,
  Zap,
} from 'lucide-react';

export type FeatureStatus = 'available' | 'planned';

export type Phase2Feature = {
  id: string;
  title: string;
  description: string;
  category: Phase2CategoryId;
  icon?: LucideIcon;
  href?: string;
  available: boolean;
  highlight?: boolean;
};

export type Phase2CategoryId =
  | 'crm'
  | 'recruitment'
  | 'operations'
  | 'automation'
  | 'platform'
  | 'ai'
  | 'hq';

export type Phase2Category = {
  id: Phase2CategoryId;
  label: string;
  tagline: string;
  accent: string;
  icon: LucideIcon;
};

export const phase2Categories: Phase2Category[] = [
  {
    id: 'crm',
    label: 'CRM & Revenue',
    tagline: 'Turn every lead into a lasting client relationship',
    accent: 'text-orange-500',
    icon: Target,
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    tagline: 'Job to placement in one continuous workflow',
    accent: 'text-sky-500',
    icon: Briefcase,
  },
  {
    id: 'ai',
    label: 'AI Intelligence',
    tagline: 'Matching, parsing, briefs, and workspace intelligence',
    accent: 'text-indigo-500',
    icon: Bot,
  },
  {
    id: 'operations',
    label: 'Operations',
    tagline: 'Run the business between hires',
    accent: 'text-violet-500',
    icon: LayoutDashboard,
  },
  {
    id: 'automation',
    label: 'Automation',
    tagline: 'Handoffs that move without chasing',
    accent: 'text-amber-500',
    icon: Workflow,
  },
  {
    id: 'platform',
    label: 'Platform',
    tagline: 'Teams, roles, billing, and module control',
    accent: 'text-emerald-500',
    icon: Shield,
  },
  {
    id: 'hq',
    label: 'Administration',
    tagline: 'Multi-tenant HQ for operators and founders',
    accent: 'text-slate-300',
    icon: Building2,
  },
];

/** Single source of truth for Phase 2 capabilities on the employers landing page. */
export const phase2Features: Phase2Feature[] = [
  // CRM & Revenue
  { id: 'leads', title: 'Leads Workspace', description: 'CRUD, import, merge, convert, and trash for every prospect.', category: 'crm', available: true, highlight: true },
  { id: 'lead-crud', title: 'Lead CRUD', description: 'Create, edit, and manage lead records end to end.', category: 'crm', available: true },
  { id: 'lead-import', title: 'Lead Import', description: 'Bulk import leads with preview and validation.', category: 'crm', available: true },
  { id: 'lead-merge', title: 'Lead Merge', description: 'Merge duplicates without losing activity history.', category: 'crm', available: true },
  { id: 'lead-convert', title: 'Lead Convert', description: 'Convert qualified leads into client accounts.', category: 'crm', available: true, highlight: true },
  { id: 'lead-trash', title: 'Lead Trash', description: 'Soft-delete and restore leads from recycle bin.', category: 'crm', available: true },
  { id: 'followups', title: 'Follow-ups', description: 'Schedule and track recruiter follow-up actions.', category: 'crm', available: true, highlight: true },
  { id: 'meetings', title: 'Meetings', description: 'Book calls with email and Google Meet invites.', category: 'crm', available: true },
  { id: 'client-crm', title: 'Client CRM', description: 'Accounts, documents, contacts, and client meetings.', category: 'crm', available: true, highlight: true },
  { id: 'contacts', title: 'Contact Directory', description: 'Unified people records linked across CRM entities.', category: 'crm', available: true },
  { id: 'smart-search-crm', title: 'Smart Search', description: 'AI-assisted filters across leads and clients.', category: 'crm', available: true },
  { id: 'conversion-requests', title: 'Conversion Requests', description: 'Approval flow when converting leads to clients.', category: 'crm', available: true },
  { id: 'public-lead-forms', title: 'Public Lead Capture', description: 'Tokenized public forms for inbound lead capture.', category: 'crm', available: true },
  { id: 'agreements', title: 'Agreements', description: 'Upload and manage client agreements in-tenant.', category: 'crm', available: true },
  { id: 'contract-parse', title: 'Contract Parsing', description: 'Parse agreement documents into structured fields.', category: 'crm', available: true },
  { id: 'kyc-ai', title: 'KYC AI Parsing', description: 'Extract KYC fields from uploaded identity documents.', category: 'crm', available: true },
  { id: 'lead-ai-autofill', title: 'Lead AI Autofill', description: 'Fill lead details with AI-assisted suggestions.', category: 'crm', available: true },
  { id: 'client-ai-autofill', title: 'Client AI Autofill', description: 'Enrich client records with AI-assisted details.', category: 'crm', available: true },
  { id: 'crm-ai-chat', title: 'Lead & Client AI Chat', description: 'Ask questions and draft CRM updates in context.', category: 'crm', available: true },
  { id: 'dup-detection', title: 'Duplicate Detection', description: 'Catch duplicate leads and candidates on import.', category: 'crm', available: true },

  // Recruitment
  { id: 'jobs', title: 'Jobs', description: 'Create, edit, and manage open requisitions.', category: 'recruitment', available: true, highlight: true },
  { id: 'job-publish', title: 'Job Publishing', description: 'Publish roles and sync openings to the candidate portal.', category: 'recruitment', available: true },
  { id: 'public-apply', title: 'Public Apply Links', description: 'Branded apply forms with custom field templates.', category: 'recruitment', available: true, highlight: true },
  { id: 'candidates', title: 'Candidates', description: 'Full candidate profiles, tags, notes, and pipeline links.', category: 'recruitment', available: true, highlight: true },
  { id: 'bulk-cv', title: 'Bulk CV Upload', description: 'ZIP intake, resume parsing, and duplicate checks.', category: 'recruitment', available: true, highlight: true },
  { id: 'ai-matching', title: 'AI Matching', description: 'Ranked shortlists with explainable match tiers.', category: 'recruitment', available: true, highlight: true },
  { id: 'four-pass', title: 'Four-Pass Matching', description: 'Multi-pass scoring across CV, skills, experience, and fit.', category: 'recruitment', available: true, highlight: true },
  { id: 'pipeline', title: 'Pipeline Stages', description: 'Kanban movement with stage history and ownership.', category: 'recruitment', available: true },
  { id: 'interviews', title: 'Interviews', description: 'Schedule panels, scorecards, and interview notes.', category: 'recruitment', available: true, highlight: true },
  { id: 'interview-feedback', title: 'Interview Feedback', description: 'Structured feedback capture after every round.', category: 'recruitment', available: true },
  { id: 'placements', title: 'Placements', description: 'Track offers, joining, and placement outcomes.', category: 'recruitment', available: true, highlight: true },
  { id: 'placement-billing', title: 'Placement Billing', description: 'Connect placements to invoice and revenue records.', category: 'recruitment', available: true },
  { id: 'prescreen', title: 'Pre-screen Assessments', description: 'AI-generated screening tests tied to job roles.', category: 'recruitment', available: true },
  { id: 'interview-forms', title: 'Interview Form Builder', description: 'Build application and interview intake forms.', category: 'recruitment', available: true },
  { id: 'proctoring', title: 'Assessment Proctoring', description: 'Public assessment sessions with proctoring controls.', category: 'recruitment', available: true },
  { id: 'client-review', title: 'Client Review Tokens', description: 'Share candidate reviews with secure client links.', category: 'recruitment', available: true },
  { id: 'command-center', title: 'Recruitment Command Center', description: 'Hiring overview across jobs, pipeline, and interviews.', category: 'recruitment', available: true },
  { id: 'linkedin-publish', title: 'LinkedIn Publishing', description: 'Post jobs through connected LinkedIn accounts.', category: 'recruitment', available: true },
  { id: 'social-publish', title: 'Social Publishing', description: 'Distribute openings across social channels.', category: 'recruitment', available: true },
  { id: 'agency-mode', title: 'Agency Mode', description: 'Multi-client agency workflows with submissions and billing.', category: 'recruitment', available: true, highlight: true },
  { id: 'standalone-mode', title: 'Standalone Mode', description: 'In-house hiring mode without agency lead/client CRM.', category: 'recruitment', available: true, highlight: true },

  // Operations
  { id: 'dashboard', title: 'Command Dashboard', description: 'Live KPIs for hiring velocity, pipeline, and revenue.', category: 'operations', available: true, highlight: true },
  { id: 'reports', title: 'Reports', description: 'Recruitment, placement, and operational analytics.', category: 'operations', available: true },
  { id: 'exports', title: 'Exports', description: 'Export operational and finance-ready datasets.', category: 'operations', available: true },
  { id: 'tasks', title: 'Tasks', description: 'Assign and track work items across the team.', category: 'operations', available: true },
  { id: 'activities', title: 'Activities', description: 'Audit-friendly activity logs on CRM records.', category: 'operations', available: true },
  { id: 'calendar', title: 'Calendar', description: 'Shared scheduling for interviews and client meetings.', category: 'operations', available: true },
  { id: 'ops-meetings', title: 'Meetings', description: 'Coordinate attendees across Google and Outlook.', category: 'operations', available: true },
  { id: 'inbox', title: 'Inbox', description: 'Threaded conversations tied to candidates and clients.', category: 'operations', available: true },
  { id: 'messaging', title: 'Messaging', description: 'Operational messaging across recruitment workflows.', category: 'operations', available: true },
  { id: 'billing', title: 'Billing', description: 'Invoice lifecycle, payment status, and delivery.', category: 'operations', available: true, highlight: true },
  { id: 'invoices', title: 'Invoices', description: 'Draft, send, and track placement invoices.', category: 'operations', available: true },
  { id: 'portal-events', title: 'Portal Events', description: 'Manage employer/portal events and media.', category: 'operations', available: true },
  { id: 'activity-feed', title: 'Activity Feed', description: 'Tenant-wide feed of recent CRM actions.', category: 'operations', available: true },
  { id: 'requests', title: 'Requests', description: 'Internal request workflows across teams.', category: 'operations', available: true },
  { id: 'approvals', title: 'Approvals', description: 'Approve conversions, handoffs, and team requests.', category: 'operations', available: true },
  { id: 'cross-dept', title: 'Cross-department Requests', description: 'Handoffs between departments with approval trails.', category: 'operations', available: true },
  { id: 'help-center', title: 'Help Center', description: 'In-app help and guidance for operators.', category: 'operations', available: true },
  { id: 'support-tickets', title: 'Support Tickets', description: 'Raise and track support tickets to HQ.', category: 'operations', available: true },
  { id: 'global-search', title: 'Global Search', description: 'Search leads, jobs, candidates, clients, and more.', category: 'operations', available: true },

  // Automation (workflow narrative — capabilities that exist as connected product flows)
  { id: 'auto-assign', title: 'Lead Assignment', description: 'Assign inbound leads to the right recruiter.', category: 'automation', available: true },
  { id: 'auto-followup', title: 'Follow-up Creation', description: 'Create follow-ups as part of conversion workflows.', category: 'automation', available: true },
  { id: 'auto-meeting', title: 'Meeting Scheduling', description: 'Schedule meetings from CRM and interview flows.', category: 'automation', available: true },
  { id: 'auto-convert', title: 'Client Conversion Flow', description: 'Move qualified leads into client accounts with approval.', category: 'automation', available: true },
  { id: 'auto-match', title: 'Candidate Matching Flow', description: 'Trigger AI matching against open jobs.', category: 'automation', available: true },
  { id: 'auto-interview', title: 'Interview Scheduling Flow', description: 'Progress matched candidates into interviews.', category: 'automation', available: true },
  { id: 'auto-notify', title: 'Client Notifications', description: 'Notify clients via review links and workflow alerts.', category: 'automation', available: true },
  { id: 'auto-invoice', title: 'Invoice Generation', description: 'Generate invoices from completed placements.', category: 'automation', available: true },

  // Platform
  { id: 'team', title: 'Team', description: 'Manage members, credentials, and login activity.', category: 'platform', available: true, highlight: true },
  { id: 'rbac', title: 'RBAC', description: 'Roles and permission sets for every workspace action.', category: 'platform', available: true, highlight: true },
  { id: 'org-settings', title: 'Organization Settings', description: 'Branding, communication, workflow, and security settings.', category: 'platform', available: true },
  { id: 'recycle-bin', title: 'Recycle Bin', description: 'Restore soft-deleted leads, jobs, and core records.', category: 'platform', available: true },
  { id: 'hq-admin', title: 'HQ Admin', description: 'Multi-tenant provisioning and employer analytics.', category: 'platform', available: true, highlight: true },
  { id: 'notifications', title: 'Notifications', description: 'In-app alerts for approvals, meetings, and pipeline changes.', category: 'platform', available: true },
  { id: 'portal-bridge', title: 'Portal Bridge', description: 'Two-way sync with the candidate job portal.', category: 'platform', available: true, highlight: true },
  { id: 'ai-coins', title: 'AI Coins', description: 'Tenant AI coin wallet for metered AI features.', category: 'platform', available: true, highlight: true },
  { id: 'razorpay', title: 'Razorpay', description: 'Checkout and wallet top-ups via Razorpay.', category: 'platform', available: true },
  { id: 'upi', title: 'UPI', description: 'UPI payment support for coin and plan purchases.', category: 'platform', available: true },
  { id: 'departments', title: 'Departments', description: 'Organize teams by department structure.', category: 'platform', available: true },
  { id: 'targets', title: 'Targets', description: 'Set and track recruiter and team targets.', category: 'platform', available: true },
  { id: 'commission', title: 'Commission', description: 'Commission tracking tied to placements and team goals.', category: 'platform', available: true },
  { id: 'alert-templates', title: 'Alert Templates', description: 'Configure alert management templates for the org.', category: 'platform', available: true },
  { id: 'notif-templates', title: 'Notification Templates', description: 'Trigger templates for operational notifications.', category: 'platform', available: true },
  { id: 'module-packaging', title: 'Module Packaging', description: 'HQ-controlled enable/disable of tenant modules.', category: 'platform', available: true },
  { id: 'product-lines', title: 'Product Lines', description: 'CRM and recruitment product-line packaging.', category: 'platform', available: true },
  { id: 'trial', title: 'Trial Plans', description: 'HQ-granted trial access for employer workspaces.', category: 'platform', available: true },
  { id: 'starter', title: 'Starter Plan', description: 'Core CRM plan for boutique teams.', category: 'platform', available: true },
  { id: 'pro', title: 'Pro Plan', description: 'Growth plan with AI matching and full-cycle hiring.', category: 'platform', available: true },
  { id: 'enterprise', title: 'Enterprise Plan', description: 'HQ analytics, Brain, SSO options, and dedicated support.', category: 'platform', available: true },

  // AI
  { id: 'ai-job', title: 'AI Job Creation', description: 'Prompt-to-posting with titles, JD, skills, and salary hints.', category: 'ai', available: true, highlight: true },
  { id: 'ai-candidate-match', title: 'AI Candidate Matching', description: 'Explainable shortlists ranked for every open role.', category: 'ai', available: true, highlight: true },
  { id: 'brain', title: 'HRYantra Brain', description: 'In-app AI operator for CRM actions and workspace briefs.', category: 'ai', available: true, highlight: true },
  { id: 'smart-search-ai', title: 'Smart Search AI', description: 'Natural-language filters across jobs, leads, and candidates.', category: 'ai', available: true, highlight: true },
  { id: 'location-iq', title: 'Location Intelligence', description: 'Address search, map pick, and reverse geocode.', category: 'ai', available: true },
  { id: 'cv-ai', title: 'CV AI', description: 'Parse resumes and surface ATS-relevant structure.', category: 'ai', available: true, highlight: true },
  { id: 'doc-ai', title: 'Document AI', description: 'Extract structured fields from KYC and agreements.', category: 'ai', available: true },
  { id: 'aria', title: 'ARIA Assistant', description: 'Workspace summaries, daily briefs, and operational Q&A.', category: 'ai', available: true, highlight: true },
  { id: 'workspace-briefs', title: 'Workspace Briefs', description: 'Daily “what needs attention” recommendations.', category: 'ai', available: true },
  { id: 'behavior-engine', title: 'Tenant Behaviour Engine', description: 'Usage intelligence at /thebehave for personalized workflows.', category: 'ai', available: true, highlight: true },

  // HQ
  { id: 'hq-companies', title: 'Multi-Tenant Companies', description: 'Provision and manage employer organizations.', category: 'hq', available: true },
  { id: 'hq-tenants', title: 'Tenant Management', description: 'Control modules, product lines, and access per tenant.', category: 'hq', available: true, highlight: true },
  { id: 'hq-tickets', title: 'Tickets', description: 'HQ ticket inbox for employer support.', category: 'hq', available: true },
  { id: 'hq-plans', title: 'Plans & Subscriptions', description: 'Package and subscription control for employers.', category: 'hq', available: true },
  { id: 'hq-ai-costs', title: 'AI Cost Management', description: 'Configure AI feature costs and coin packs.', category: 'hq', available: true },
  { id: 'hq-coins', title: 'Coin Packs', description: 'Sell and manage AI coin packs across tenants.', category: 'hq', available: true },
  { id: 'hq-modules', title: 'Module Enable / Disable', description: 'Toggle tenant sidenav modules after provisioning.', category: 'hq', available: true, highlight: true },
  { id: 'hq-packaging', title: 'Product Packaging', description: 'CRM vs recruitment packaging for each tenant.', category: 'hq', available: true },
];

export function featuresByCategory(category: Phase2CategoryId, opts?: { availableOnly?: boolean }) {
  return phase2Features.filter(
    (f) => f.category === category && (opts?.availableOnly === false || f.available),
  );
}

export function highlightFeatures(category: Phase2CategoryId, limit = 6) {
  const all = featuresByCategory(category);
  const highlighted = all.filter((f) => f.highlight);
  return (highlighted.length ? highlighted : all).slice(0, limit);
}

export const platformStripItems = [
  'CRM',
  'ATS',
  'AI',
  'Recruitment',
  'Operations',
  'Analytics',
  'Automation',
  'Billing',
] as const;

export const ecosystemNodes = [
  { id: 'crm', label: 'CRM', icon: Target },
  { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
  { id: 'ai', label: 'AI', icon: Bot },
  { id: 'operations', label: 'Operations', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'billing', label: 'Billing', icon: Wallet },
  { id: 'automation', label: 'Automation', icon: Workflow },
  { id: 'admin', label: 'Administration', icon: Shield },
] as const;

export const crmPipelineSteps = [
  'Lead',
  'Follow-up',
  'Meeting',
  'Qualified',
  'Client',
  'Agreement',
  'Active',
] as const;

export const recruitmentPipelineSteps = [
  'Job',
  'Applicants',
  'AI Match',
  'Screening',
  'Interview',
  'Client Review',
  'Offer',
  'Placement',
] as const;

export const automationNodes = [
  'New Lead',
  'Assign Recruiter',
  'Welcome Message',
  'Create Follow-up',
  'Schedule Meeting',
  'Convert Client',
  'Recruitment Request',
  'Match Candidates',
  'Schedule Interview',
  'Notify Client',
  'Placement',
  'Generate Invoice',
] as const;

export const brainNodes = [
  'Candidates',
  'Jobs',
  'Leads',
  'Clients',
  'Interviews',
  'Placements',
  'Revenue',
  'Activities',
  'Documents',
] as const;

export const liveFeedItems = [
  { text: 'New candidate applied', ago: '2 min ago' },
  { text: 'AI matched 8 candidates', ago: '4 min ago' },
  { text: 'Interview scheduled', ago: '8 min ago' },
  { text: 'Client reviewed candidate', ago: '12 min ago' },
  { text: 'Lead converted', ago: '17 min ago' },
  { text: 'Placement completed', ago: '22 min ago' },
] as const;

export const securityItems = [
  { title: 'RBAC', description: 'Role-based access across CRM and recruitment modules.' },
  { title: 'Organization Isolation', description: 'Multi-DB tenant isolation for employer workspaces.' },
  { title: 'Audit Activity', description: 'Activity logs and member audit trails.' },
  { title: 'Permission Control', description: 'Fine-grained permissions for teams and departments.' },
  { title: 'Document Management', description: 'Controlled access to files, agreements, and KYC.' },
  { title: 'AI Usage Control', description: 'Coin wallets, feature costs, and HQ packaging limits.' },
] as const;

export const productModes = {
  agency: {
    title: 'Agency Mode',
    description: 'Built for recruitment agencies running multiple clients in one tenant.',
    points: [
      'Multiple clients',
      'Candidate pipeline',
      'Client submissions',
      'Recruiter management',
      'Placements',
      'Commission',
      'Billing',
      'Targets',
    ],
  },
  standalone: {
    title: 'Standalone Mode',
    description: 'Built for in-house employer and recruitment teams.',
    points: [
      'Hiring workflows',
      'Candidate management',
      'Interviews',
      'Assessments',
      'Recruitment analytics',
      'Internal approvals',
    ],
  },
} as const;

export const aiCoinsDemo = {
  balance: 12450,
  usage: [
    { label: 'CV Parsing', value: 120, icon: FileText },
    { label: 'Job Generation', value: 35, icon: Briefcase },
    { label: 'AI Matching', value: 245, icon: Sparkles },
    { label: 'Document Analysis', value: 78, icon: FileSearch },
  ],
} as const;

export const moduleIconStrip = [
  { label: 'Leads', icon: Target },
  { label: 'Jobs', icon: Briefcase },
  { label: 'Candidates', icon: UserRoundSearch },
  { label: 'Clients', icon: Building2 },
  { label: 'Pipeline', icon: Kanban },
  { label: 'Matches', icon: Sparkles },
  { label: 'Interviews', icon: CalendarDays },
  { label: 'Placements', icon: UserCheck },
  { label: 'Billing', icon: Wallet },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Team', icon: Users },
  { label: 'Inbox', icon: Inbox },
  { label: 'Tasks', icon: ClipboardList },
  { label: 'Contacts', icon: Contact },
  { label: 'Events', icon: Globe2 },
  { label: 'AI Coins', icon: Coins },
  { label: 'Behaviour', icon: Activity },
  { label: 'HQ Admin', icon: Shield },
] as const;

export const phase2Stats = [
  { value: `${phase2Features.filter((f) => f.available).length}+`, label: 'Capabilities mapped', icon: GitBranch },
  { value: '4-pass', label: 'AI matching', icon: Sparkles },
  { value: 'Multi-DB', label: 'Tenant isolation', icon: Shield },
  { value: 'Portal', label: 'Candidate bridge', icon: Link2 },
] as const;

export const opsMetrics = [
  { label: "Today's Tasks", value: 18 },
  { label: 'Open Leads', value: 42 },
  { label: 'Active Jobs', value: 16 },
  { label: 'Interviews', value: 9 },
  { label: 'Placements', value: 4 },
  { label: 'Revenue', value: '₹2.4L' },
  { label: 'Pending Approvals', value: 7 },
  { label: 'Upcoming Meetings', value: 5 },
] as const;

/** @deprecated Prefer phase2Categories + phase2Features */
export const phase2FeatureCategories = phase2Categories.map((cat) => {
  const styles: Record<
    string,
    { border: string; bg: string; dot: string }
  > = {
    crm: { border: 'border-orange-200/80', bg: 'from-orange-50 via-white to-amber-50', dot: 'bg-orange-500' },
    recruitment: { border: 'border-sky-200/80', bg: 'from-sky-50 via-white to-cyan-50', dot: 'bg-sky-500' },
    operations: { border: 'border-violet-200/80', bg: 'from-violet-50 via-white to-fuchsia-50', dot: 'bg-violet-500' },
    automation: { border: 'border-amber-200/80', bg: 'from-amber-50 via-white to-orange-50', dot: 'bg-amber-500' },
    platform: { border: 'border-emerald-200/80', bg: 'from-emerald-50 via-white to-teal-50', dot: 'bg-emerald-500' },
    ai: { border: 'border-indigo-200/80', bg: 'from-indigo-50 via-white to-blue-50', dot: 'bg-indigo-500' },
    hq: { border: 'border-slate-200/80', bg: 'from-slate-50 via-white to-slate-100', dot: 'bg-slate-500' },
  };
  const style = styles[cat.id] || styles.platform;
  return {
    id: cat.id,
    label: cat.label,
    tagline: cat.tagline,
    accent: cat.accent,
    icon: cat.icon,
    ...style,
    features: featuresByCategory(cat.id).map((f) => ({ name: f.title, detail: f.description })),
  };
});

export const phase2ModuleIcons = moduleIconStrip;

export const hrmsComparisonRows = [
  {
    capability: 'Leads + client CRM in one tenant',
    spreadsheets: false,
    genericAts: 'partial' as const,
    saasa: true,
  },
  {
    capability: 'AI job creation & CV screening',
    spreadsheets: false,
    genericAts: 'partial' as const,
    saasa: true,
  },
  {
    capability: '4-pass AI candidate matching',
    spreadsheets: false,
    genericAts: false,
    saasa: true,
  },
  {
    capability: 'Public apply links + portal sync',
    spreadsheets: false,
    genericAts: 'partial' as const,
    saasa: true,
  },
  {
    capability: 'Placements, billing & reports',
    spreadsheets: false,
    genericAts: false,
    saasa: true,
  },
  {
    capability: 'Role-based permissions (RBAC)',
    spreadsheets: false,
    genericAts: 'partial' as const,
    saasa: true,
  },
  {
    capability: 'Multi-tenant HQ & package control',
    spreadsheets: false,
    genericAts: false,
    saasa: true,
  },
  {
    capability: 'In-app AI assistant (Brain)',
    spreadsheets: false,
    genericAts: false,
    saasa: true,
  },
] as const;
