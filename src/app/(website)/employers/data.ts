import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  CircuitBoard,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Fingerprint,
  GitMerge,
  Globe2,
  HandCoins,
  LineChart,
  MapPinned,
  MessageSquareShare,
  Network,
  Radar,
  ReceiptText,
  ScanSearch,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  UsersRound,
  WalletCards,
} from 'lucide-react';

export type ModuleCard = {
  id: string;
  name: string;
  label: string;
  description: string;
  outcome: string;
  icon: LucideIcon;
  accent: string;
  glow: string;
};

export type DeepDiveModule = {
  id: string;
  name: string;
  label: string;
  kicker: string;
  headline: string;
  description: string;
  outcome: string;
  icon: LucideIcon;
  accent: string;
  surface: string;
  capabilities: string[];
  metrics: Array<{ label: string; value: string }>;
  workflow: string[];
  insight: string;
};

export const employerTrustBand = [
  {
    title: 'Recruit to payroll in one flow',
    text: 'One operating layer for hiring, onboarding, payroll, CRM, and reporting.',
    icon: GitMerge,
  },
  {
    title: 'AI where it saves time',
    text: 'Sharper JDs, faster shortlists, practical signals, and less manual follow-up.',
    icon: Sparkles,
  },
  {
    title: 'Role-based control',
    text: 'Founders, HR, recruiters, managers, finance, and employees each get the right view.',
    icon: ShieldCheck,
  },
  {
    title: 'Operational integrations',
    text: 'WhatsApp, email, calendars, payment gateways, Tally, SAP, biometric systems, and APIs.',
    icon: Network,
  },
  {
    title: 'Audit-ready visibility',
    text: 'Tracked workflows, company data isolation, and reports ready for finance and compliance.',
    icon: FileCheck2,
  },
] as const;

export const employerModules: ModuleCard[] = [
  {
    id: 'recruitos',
    name: 'SAASA RecruitOS',
    label: 'Recruitment System',
    description:
      'Move from manpower request to shortlist, interviews, invoicing, and onboarding handoff inside one workspace.',
    outcome: 'Faster hiring cycles with cleaner approvals and stronger candidate quality.',
    icon: ScanSearch,
    accent: 'from-sky-500 via-cyan-400 to-blue-600',
    glow: 'shadow-sky-200/70',
  },
  {
    id: 'peoplecore',
    name: 'SAASA PeopleCore',
    label: 'Employee Management',
    description:
      'Digitize onboarding, records, attendance, tasks, assets, leave, expenses, and training continuity.',
    outcome: 'Cleaner workforce operations with stronger accountability and growth visibility.',
    icon: UsersRound,
    accent: 'from-emerald-500 via-teal-400 to-cyan-500',
    glow: 'shadow-emerald-200/70',
  },
  {
    id: 'payflow',
    name: 'SAASA PayFlow',
    label: 'Payroll & Compliance',
    description:
      'Automate payroll with attendance sync, late marks, overtime, bonus inputs, payslips, and compliance reminders.',
    outcome: 'Fewer payroll errors, faster closure, and stronger finance confidence.',
    icon: BadgeIndianRupee,
    accent: 'from-indigo-500 via-violet-500 to-blue-600',
    glow: 'shadow-indigo-200/70',
  },
  {
    id: 'flowcrm',
    name: 'SAASA FlowCRM',
    label: 'CRM & Lead Operations',
    description:
      'Capture leads from ads, website, WhatsApp, plugins, and manual sources, then move them through disciplined follow-up workflows.',
    outcome: 'Reduced lead leakage with better assignment, follow-up discipline, and conversion reporting.',
    icon: MessageSquareShare,
    accent: 'from-orange-400 via-amber-400 to-rose-400',
    glow: 'shadow-orange-200/70',
  },
  {
    id: 'commandiq',
    name: 'SAASA CommandIQ',
    label: 'HR Analytics & Business Intelligence',
    description:
      'Give owners, HR, finance, and managers one command layer for workforce, payroll, hiring, training, and business signals.',
    outcome: 'Faster decisions with centralized visibility, predictive alerts, and exportable reporting.',
    icon: BarChart3,
    accent: 'from-slate-900 via-slate-700 to-sky-700',
    glow: 'shadow-slate-300/70',
  },
];

export const employerProblems = [
  'Hiring approvals live in chats, sheets, and disconnected emails.',
  'Onboarding records, employee files, and asset handovers lack a clean digital trail.',
  'Attendance, leave, travel claims, and task follow-ups are spread across multiple tools.',
  'Payroll teams depend on last-minute manual reconciliation and reminder chasing.',
  'Lead follow-up breaks when CRM capture is fragmented across ads, WhatsApp, and manual sources.',
  'Leadership sees outputs late because reporting lives in separate systems.',
] as const;

export const employerSolutions = [
  'A single employer operating layer across hiring, people operations, payroll, CRM, and analytics.',
  'Role-specific workspaces for recruiters, HR, line managers, finance, company owners, and employees.',
  'AI assistance for JD creation, candidate matching, payroll checks, performance insights, and skill-gap signals.',
  'Operational workflows with reminders, approvals, digital records, audit trails, exports, and mobile access.',
] as const;

export const employerDeepDiveModules: DeepDiveModule[] = [
  {
    id: 'recruitos',
    name: 'SAASA RecruitOS',
    label: 'Recruitment System',
    kicker: 'Recruit with more precision',
    headline: 'From manpower request to invoice-ready hiring workflows.',
    description:
      'Create employer workspaces, collect manpower requests from line managers, generate AI-enhanced JDs, publish jobs across channels, shortlist with matching logic, run assessments, schedule interviews, and move selected candidates smoothly into onboarding.',
    outcome: 'A recruitment engine built for control, speed, and quality hiring decisions.',
    icon: ScanSearch,
    accent: 'from-sky-500 via-cyan-400 to-blue-600',
    surface: 'from-sky-50 via-white to-cyan-50',
    capabilities: [
      'Employer registration and profile setup',
      'Manpower request approvals from line managers',
      'AI-enhanced JD creation and multi-platform publishing',
      'Candidate matching, shortlisting, assessments, and pre-screening',
      'Interview scheduling, panel coordination, invoicing, and payment support',
      'Handoff into onboarding without re-entering candidate data',
    ],
    metrics: [
      { label: 'Pipeline steps tracked', value: '7' },
      { label: 'Shortlist velocity', value: '2.3x' },
      { label: 'Approval lag reduced', value: '32%' },
    ],
    workflow: ['Requisition', 'AI JD', 'Publish', 'Match', 'Assess', 'Interview', 'Invoice'],
    insight: 'AI matching surfaces the strongest-fit candidates while managers retain final control.',
  },
  {
    id: 'peoplecore',
    name: 'SAASA PeopleCore',
    label: 'Employee Management',
    kicker: 'Run people operations with clarity',
    headline: 'Digital onboarding, attendance, tasks, performance, and employee 360 in one core system.',
    description:
      'Keep digital employee records, onboarding workflows, documents, asset allotments, manager assignments, probation reminders, task tracking, biometric attendance, GPS attendance for field teams, leave, travel expenses, performance scorecards, and training records inside one system of record.',
    outcome: 'Cleaner employee operations with structured records, stronger manager follow-through, and learning continuity.',
    icon: UsersRound,
    accent: 'from-emerald-500 via-teal-400 to-cyan-500',
    surface: 'from-emerald-50 via-white to-teal-50',
    capabilities: [
      'Onboarding checklists and digital employee records',
      'Document management, HR uploads, and asset receipts',
      'Department, role, manager, and probation assignments',
      'Task assignment, biometric attendance, and GPS attendance',
      'Leave, travel expense, and workflow approvals',
      'Performance scorecards, AI recommendations, employee 360, and training records',
    ],
    metrics: [
      { label: 'Attendance sync', value: 'Realtime' },
      { label: 'Profile depth', value: '360-view' },
      { label: 'Manager actions', value: 'Role based' },
    ],
    workflow: ['Onboard', 'Assign', 'Track', 'Attend', 'Approve', 'Review'],
    insight: 'Every employee record stays connected to attendance, assets, tasks, and performance history.',
  },
  {
    id: 'payflow',
    name: 'SAASA PayFlow',
    label: 'Payroll & Compliance',
    kicker: 'Close payroll with confidence',
    headline: 'Attendance-linked payroll with compliance discipline and finance visibility.',
    description:
      'Automate payroll using attendance, leave, overtime, late marks, and performance-linked bonus logic. Publish payslips, maintain salary history, support Tally and SAP readiness, and give HR plus finance reminder workflows before every payroll cycle.',
    outcome: 'Less reconciliation, fewer last-minute escalations, and stronger payroll trust.',
    icon: WalletCards,
    accent: 'from-indigo-500 via-violet-500 to-blue-600',
    surface: 'from-indigo-50 via-white to-violet-50',
    capabilities: [
      'Automated payroll engine with attendance-linked calculations',
      'Leave, overtime, late mark, and bonus handling',
      'Employee self-service dashboard, payslips, and salary history',
      'Tally and SAP integration readiness',
      'Country-wise compliance workflows and reporting',
      'HR + finance reminders before payroll closure',
    ],
    metrics: [
      { label: 'Payroll sync sources', value: 'Attendance + leave + bonus' },
      { label: 'Finance reminders', value: 'Pre-run' },
      { label: 'Audit readiness', value: 'Built in' },
    ],
    workflow: ['Attendance sync', 'Checks', 'Payroll run', 'Payslips', 'Compliance', 'Closure'],
    insight: 'Payroll closure becomes a controlled process instead of a monthly manual scramble.',
  },
  {
    id: 'flowcrm',
    name: 'SAASA FlowCRM',
    label: 'CRM & Lead Operations',
    kicker: 'Keep revenue ops connected',
    headline: 'Capture, assign, follow up, quote, and convert from one CRM operating flow.',
    description:
      'Capture leads from Meta Ads, Google Ads, website forms, WhatsApp, manual entry, and social profile plugins like LinkedIn. Assign them with role-based visibility, manage stages and reminders, and run document or quotation workflows with conversion reporting.',
    outcome: 'A CRM layer built for operational follow-through, not just contact storage.',
    icon: MessageSquareShare,
    accent: 'from-orange-400 via-amber-400 to-rose-400',
    surface: 'from-orange-50 via-white to-amber-50',
    capabilities: [
      'Lead capture from ads, forms, WhatsApp, manual, and plugin sources',
      'LinkedIn and social-profile style lead capture',
      'Role-based assignment and sales visibility',
      'Follow-up reminders, lead stages, and ownership tracking',
      'Document and quotation workflows',
      'Conversion reporting and pipeline discipline',
    ],
    metrics: [
      { label: 'Lead channels', value: 'Multi-source' },
      { label: 'Follow-up visibility', value: 'Role based' },
      { label: 'Pipeline reporting', value: 'Live' },
    ],
    workflow: ['Capture', 'Assign', 'Follow up', 'Quote', 'Convert', 'Report'],
    insight: 'Lead operations stay connected to action, documents, and visibility across the sales chain.',
  },
  {
    id: 'commandiq',
    name: 'SAASA CommandIQ',
    label: 'HR Analytics & Business Intelligence',
    kicker: 'See the whole system',
    headline: 'One command layer for workforce decisions, founder visibility, and predictive alerts.',
    description:
      'Centralize dashboards across recruitment, employees, payroll, training, CRM, and finance. Give entrepreneurs, owners, HR, finance, and managers role-based reporting with exportable views and AI signals such as attrition risk, budget alerts, skill-gap indicators, and learning ROI patterns.',
    outcome: 'Leadership gets faster decisions because the system tells one consistent operational story.',
    icon: Radar,
    accent: 'from-slate-900 via-slate-700 to-sky-700',
    surface: 'from-slate-100 via-white to-sky-50',
    capabilities: [
      'Centralized dashboards across modules',
      'Company-owner, HR, finance, and manager visibility',
      'Recruitment, employee, payroll, and training analytics',
      'AI attrition risk, budget alerts, and skill-gap signals',
      'Role-based reporting and exportable views',
      'Audit-friendly decision support across the business',
    ],
    metrics: [
      { label: 'Decision views', value: 'Founder to frontline' },
      { label: 'Predictive alerts', value: 'AI assisted' },
      { label: 'Exportable reports', value: 'Cross-module' },
    ],
    workflow: ['Collect', 'Compare', 'Alert', 'Decide', 'Export'],
    insight: 'CommandIQ turns isolated HR and finance data into one operating view for leadership.',
  },
];

export const connectedBusinessFlow = [
  { title: 'Lead', subtitle: 'Capture demand from campaigns, web forms, WhatsApp, plugins, and manual sources.' },
  { title: 'Recruit', subtitle: 'Open manpower requests, publish jobs, match candidates, and schedule interviews.' },
  { title: 'Hire', subtitle: 'Close approvals, invoices, payment support, and candidate handoff without rework.' },
  { title: 'Onboard', subtitle: 'Launch digital records, documents, assets, managers, and probation workflows.' },
  { title: 'Manage', subtitle: 'Track attendance, tasks, leave, travel, performance, and training continuity.' },
  { title: 'Pay', subtitle: 'Run attendance-linked payroll, payslips, reminders, and compliance reporting.' },
  { title: 'Analyze', subtitle: 'Review dashboards, AI signals, skill gaps, and leadership-ready decisions.' },
] as const;

export const employerRoles = [
  {
    title: 'Entrepreneur / Company Owner',
    summary: 'See hiring health, workforce movement, payroll exposure, CRM velocity, and decision-critical alerts in one view.',
    icon: Building2,
  },
  {
    title: 'HR Manager',
    summary: 'Manage hiring, records, onboarding, attendance, employee documents, and performance workflows with cleaner control.',
    icon: ClipboardList,
  },
  {
    title: 'Recruiter',
    summary: 'Move from requisition to shortlist, assessments, interviews, and conversion-ready candidate pipelines.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Line Manager',
    summary: 'Raise manpower requests, review hiring pipelines, assign tasks, and track role-specific team execution.',
    icon: Target,
  },
  {
    title: 'Finance / Payroll Officer',
    summary: 'Run payroll with synchronized attendance, approval reminders, compliance views, and finance-ready exports.',
    icon: CreditCard,
  },
  {
    title: 'Employee',
    summary: 'Access onboarding steps, records, attendance, leave, payslips, expenses, and self-service updates from one app.',
    icon: Smartphone,
  },
] as const;

export const employerAiFeatures = [
  {
    title: 'AI JD enhancement',
    copy: 'Convert manpower requests into sharper public-facing role descriptions with stronger clarity and consistency.',
    icon: Sparkles,
  },
  {
    title: 'AI candidate matching',
    copy: 'Score and surface stronger-fit applicants faster while keeping recruiter and manager decisions in control.',
    icon: ScanSearch,
  },
  {
    title: 'AI performance insights',
    copy: 'Turn scorecards and task signals into structured coaching suggestions and follow-up cues.',
    icon: Activity,
  },
  {
    title: 'AI payroll checks',
    copy: 'Highlight anomalies, missing attendance dependencies, and payroll readiness issues before the run closes.',
    icon: ReceiptText,
  },
  {
    title: 'AI analytics signals',
    copy: 'Surface attrition risk, budget alerts, skill gaps, and operational patterns that need management attention.',
    icon: LineChart,
  },
  {
    title: 'AI learning recommendations',
    copy: 'Turn skill gaps, performance signals, and training records into course suggestions and growth prompts.',
    icon: CircuitBoard,
  },
] as const;

export const employerIntegrationGroups = [
  {
    title: 'Communication and coordination',
    items: ['WhatsApp', 'Email', 'Google Calendar', 'Outlook', 'Zoom / video scheduling'],
    icon: Globe2,
  },
  {
    title: 'Finance and operations',
    items: ['Payment gateways', 'Tally readiness', 'SAP readiness', 'Payslip exports', 'Compliance reports'],
    icon: HandCoins,
  },
  {
    title: 'People systems and data',
    items: ['Biometric devices', 'GPS attendance', 'Document uploads', 'Webhooks', 'APIs and data exports'],
    icon: Fingerprint,
  },
] as const;

export const employerMobileHighlights = [
  'Manager approvals, attendance review, and workforce actions on the move',
  'Employee self-service for records, leave, expenses, tasks, and payroll visibility',
  'Founder-level visibility into alerts, dashboards, and operating signals without opening five tools',
] as const;

export const employerPlatformSignals = [
  {
    label: 'Unified modules',
    value: '5 core products',
    icon: Network,
  },
  {
    label: 'Primary business flow',
    value: 'Lead to analyze',
    icon: CalendarRange,
  },
  {
    label: 'Training continuity',
    value: 'Skill-gap to LMS',
    icon: ShieldCheck,
  },
  {
    label: 'Data confidence',
    value: 'Audit ready',
    icon: FileCheck2,
  },
  {
    label: 'Remote readiness',
    value: 'GPS + mobile',
    icon: MapPinned,
  },
] as const;
