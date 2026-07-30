import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Contact,
  GitBranch,
  Inbox,
  Kanban,
  Link2,
  Shield,
  Sparkles,
  Target,
  UserCheck,
  UserRoundSearch,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';

export type Phase2FeatureCategory = {
  id: string;
  label: string;
  tagline: string;
  accent: string;
  dot: string;
  border: string;
  bg: string;
  icon: LucideIcon;
  features: Array<{ name: string; detail: string }>;
};

/** Full Phase 2 CRM inventory — aligned to frontphase2 / backendphase2 modules. */
export const phase2FeatureCategories: Phase2FeatureCategory[] = [
  {
    id: 'crm',
    label: 'CRM & Revenue',
    tagline: 'Leads, clients, and contacts in one pipeline',
    accent: 'text-orange-600',
    dot: 'bg-orange-500',
    border: 'border-orange-200/80',
    bg: 'from-orange-50 via-white to-amber-50',
    icon: Target,
    features: [
      { name: 'Leads workspace', detail: 'CRUD, import, merge, convert, recycle bin, and activity history' },
      { name: 'Follow-ups & meetings', detail: 'Schedule calls, Google Meet invites, and email reminders' },
      { name: 'Client CRM', detail: 'Accounts, contacts, documents, and scheduled client meetings' },
      { name: 'Contact directory', detail: 'Unified people records linked to leads, clients, and jobs' },
      { name: 'Smart search', detail: 'AI-assisted filters across lead and client lists' },
    ],
  },
  {
    id: 'recruitment',
    label: 'Recruitment Engine',
    tagline: 'Jobs to placements — the full hiring stack',
    accent: 'text-sky-600',
    dot: 'bg-sky-500',
    border: 'border-sky-200/80',
    bg: 'from-sky-50 via-white to-cyan-50',
    icon: Briefcase,
    features: [
      { name: 'Jobs & publishing', detail: 'AI job wizard, multi-channel publish, and portal sync to Phase 1' },
      { name: 'Public apply links', detail: 'Branded application forms with custom field builder' },
      { name: 'Candidates & bulk CV', detail: 'Manual add, ZIP upload, parsing, and duplicate detection' },
      { name: 'AI matching pipeline', detail: '4-pass scoring — CV, skills, experience, and fit ranking' },
      { name: 'Pipeline stages', detail: 'Kanban-style movement with stage history and ownership' },
      { name: 'Interviews & feedback', detail: 'Panels, scheduling, scorecards, and client review tokens' },
      { name: 'Placements & billing', detail: 'Placement tracking, invoices, and revenue records' },
      { name: 'Pre-screen assessments', detail: 'AI-generated screening tests tied to job roles' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations Hub',
    tagline: 'Run the business between hires',
    accent: 'text-violet-600',
    dot: 'bg-violet-500',
    border: 'border-violet-200/80',
    bg: 'from-violet-50 via-white to-fuchsia-50',
    icon: Workflow,
    features: [
      { name: 'Command dashboard', detail: 'KPI widgets for hiring velocity, pipeline health, and revenue' },
      { name: 'Reports & exports', detail: 'Recruitment, placement, and finance-ready analytics' },
      { name: 'Tasks & activities', detail: 'Work items, follow-ups, and audit-friendly activity logs' },
      { name: 'Calendar & meetings', detail: 'Google / Outlook scheduling with attendee coordination' },
      { name: 'Inbox & messaging', detail: 'Threaded conversations tied to candidates and clients' },
      { name: 'Billing module', detail: 'Invoice lifecycle, payment status, and email delivery' },
    ],
  },
  {
    id: 'platform',
    label: 'Platform & Control',
    tagline: 'Enterprise-grade tenant operations',
    accent: 'text-emerald-600',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200/80',
    bg: 'from-emerald-50 via-white to-teal-50',
    icon: Shield,
    features: [
      { name: 'Team & RBAC', detail: 'Roles, permissions, department heads, and super-admin controls' },
      { name: 'Org settings', detail: 'Branding, communication templates, alerts, and integrations' },
      { name: 'Recycle bin', detail: 'Soft-delete restore for leads, jobs, and core records' },
      { name: 'HQ platform admin', detail: 'Multi-tenant provisioning, packages, and employer analytics' },
      { name: 'Notifications', detail: 'In-app alerts for approvals, meetings, and pipeline changes' },
      { name: 'Portal bridge', detail: 'Two-way sync with the candidate job portal (Phase 1)' },
    ],
  },
  {
    id: 'ai',
    label: 'HRYantra AI',
    tagline: 'Practical intelligence — not ornamental AI',
    accent: 'text-indigo-600',
    dot: 'bg-indigo-500',
    border: 'border-indigo-200/80',
    bg: 'from-indigo-50 via-white to-blue-50',
    icon: Bot,
    features: [
      { name: 'AI job creation', detail: 'Prompt-to-posting with titles, JD, skills, and salary hints' },
      { name: 'AI candidate matching', detail: 'Ranked shortlists with explainable match tiers' },
      { name: 'HRYantra Brain assistant', detail: 'In-app operator for CRM actions and workspace briefs' },
      { name: 'Smart search parse', detail: 'Natural-language filters on leads, jobs, and candidates' },
      { name: 'Location intelligence', detail: 'Address search, map pick, and reverse geocode for leads' },
      { name: 'CV & document AI', detail: 'Parsing, ATS scoring, and resume preview proxy' },
    ],
  },
];

export const phase2ModuleIcons = [
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
  { label: 'Integrations', icon: Link2 },
  { label: 'HQ Admin', icon: Shield },
] as const;

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

export const phase2Stats = [
  { value: '30+', label: 'CRM modules', icon: GitBranch },
  { value: '4-pass', label: 'AI matching', icon: Sparkles },
  { value: 'Multi-DB', label: 'Tenant isolation', icon: Shield },
  { value: 'Phase 1', label: 'Portal bridge', icon: Link2 },
] as const;
