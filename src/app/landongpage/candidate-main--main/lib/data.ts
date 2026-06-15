// ─────────────────────────────────────────
//   HR YANTRA PHASE 1 — CANDIDATE PORTAL DATA
// ─────────────────────────────────────────

export const portalRoutes = {
  home: '/en',
  exploreJobs: '/en/explore-jobs',
  searchJobs: '/en/searchjobs',
  whatsappLogin: '/en/whatsapp',
  profile: '/en/profile',
  dashboard: '/en/candidate-dashboard',
  applications: '/en/applications',
  resumeBuilder: '/en/lms/resume-builder',
  interviewPrep: '/en/lms/interview-prep',
  courses: '/en/lms/courses',
  atsCheck: '/en/ats-check',
  uploadCv: '/en/uploadcv',
  contact: '/en/contact',
  services: '/en/services',
} as const

export const candidate = {
  name: 'HR Yantra',
  shortName: 'HY',
  title: 'AI-Powered Candidate Portal',
  tagline: 'Find the job that fits you perfectly.',
  subtitle:
    'HR Yantra AI matches you to roles that suit your skills, experience, and goals — explore jobs, build your profile, track applications, and prepare for interviews in one Phase 1 portal.',
  heroBadge: 'HR Yantra AI — Powered Job Search',
  heroLine1: 'Find the job that',
  heroLine2: 'fits you perfectly.',
  heroAccent: 'Every application counts.',
  email: 'support@hrayantra.com',
  linkedin: 'https://linkedin.com/company/hrayantra',
  twitter: 'https://twitter.com/hrayantra',
  location: 'India & Remote',
  available: true,
  liveJobsLabel: 'Live openings on portal',
  ctaPrimary: 'Explore Jobs',
  ctaSecondary: 'Sign in with WhatsApp',
}

type Metric = {
  label: string
  value: number
  suffix: string
  color: string
  decimals?: number
  prefix?: string
}

export const heroMetrics: Metric[] = [
  { label: 'AI Role Matches', value: 42, suffix: '', color: '#28A8E1' },
  { label: 'Profile Views', value: 28, suffix: '', color: '#28A8DF' },
  { label: 'CV Fit Score', value: 91, suffix: '%', color: '#0EA5E9' },
  { label: 'Resume Readiness', value: 88, suffix: '%', color: '#10B981' },
  { label: 'Application Progress', value: 76, suffix: '%', color: '#38BDF8' },
  { label: 'Interview Slots', value: 5, suffix: '', color: '#6366F1' },
]

export const commandCenterStats = [
  { id: 'matches', label: 'AI Job Matches', value: '42', unit: '', status: 'live', trend: 'Roles aligned to your profile on Explore Jobs.' },
  { id: 'applications', label: 'Active Applications', value: '18', unit: '', status: 'active', trend: 'Tracked in Applications with live status updates.' },
  { id: 'profile', label: 'Profile Completion', value: '94%', unit: '', status: 'excellent', trend: 'Complete your candidate profile for better recruiter visibility.' },
  { id: 'resume', label: 'Resume Builder Score', value: '88', unit: '', status: 'growing', trend: 'Improve ATS readiness with LMS Resume Builder.' },
  { id: 'interviews', label: 'Interview Prep Sessions', value: '12', unit: '', status: 'excellent', trend: 'Mock interviews and question banks in LMS.' },
  { id: 'ats', label: 'ATS Check Pass Rate', value: '92%', unit: '', status: 'excellent', trend: 'Scan your CV before applying to open roles.' },
  { id: 'courses', label: 'Learning Paths Started', value: '6', unit: '', status: 'active', trend: 'Upskill with courses and career-path planning.' },
  { id: 'response', label: 'Recruiter Response Rate', value: '58%', unit: '', status: 'growing', trend: 'Stronger profiles get more responses from tenant recruiters.' },
]

export const activityFeed = [
  { id: 1, type: 'metrics', message: 'Application moved to Interview — Full Stack Developer', time: 'now', status: 'success' },
  { id: 2, type: 'research', message: 'Recruiter viewed your profile — Product Manager role', time: '1m ago', status: 'success' },
  { id: 3, type: 'accessibility', message: 'Resume tailored for job — Finance Analyst opening', time: '2m ago', status: 'success' },
  { id: 4, type: 'product', message: 'AI match score improved — better fit for Pune roles', time: '3m ago', status: 'success' },
  { id: 5, type: 'performance', message: 'Pre-screen assessment completed — Operations role', time: '4m ago', status: 'success' },
  { id: 6, type: 'feedback', message: 'Mock interview finished — communication readiness up', time: '5m ago', status: 'success' },
  { id: 7, type: 'deploy', message: 'New job posted — React Developer (Remote)', time: '6m ago', status: 'success' },
  { id: 8, type: 'design', message: 'Profile synced from Phase 2 CRM pipeline', time: '7m ago', status: 'success' },
  { id: 9, type: 'report', message: 'Follow-up reminder — Sales Executive application', time: '8m ago', status: 'info' },
  { id: 10, type: 'metrics', message: 'Shortlisted — Customer Success role pool', time: '9m ago', status: 'info' },
  { id: 11, type: 'research', message: 'Hiring manager opened application — HR Business Partner', time: '10m ago', status: 'success' },
  { id: 12, type: 'performance', message: 'Skill added to profile — Excel & business analysis', time: '11m ago', status: 'success' },
]

export const expertiseSkills = [
  { id: 'software', label: 'Software', angle: 0, color: '#28A8E1', category: 'Technology' },
  { id: 'product', label: 'Product', angle: 32, color: '#28A8DF', category: 'Product' },
  { id: 'design', label: 'Design', angle: 65, color: '#0EA5E9', category: 'Design' },
  { id: 'data', label: 'Data & AI', angle: 97, color: '#38BDF8', category: 'Data' },
  { id: 'marketing', label: 'Marketing', angle: 130, color: '#0284C7', category: 'Marketing' },
  { id: 'sales', label: 'Sales', angle: 162, color: '#7DD3FC', category: 'Sales' },
  { id: 'finance', label: 'Finance', angle: 195, color: '#0369A1', category: 'Finance' },
  { id: 'healthcare', label: 'Healthcare', angle: 228, color: '#38BDF8', category: 'Healthcare' },
  { id: 'operations', label: 'Operations', angle: 260, color: '#28A8E1', category: 'Operations' },
  { id: 'education', label: 'Education', angle: 293, color: '#28A8DF', category: 'Education' },
  { id: 'consulting', label: 'Consulting', angle: 325, color: '#0EA5E9', category: 'Consulting' },
]

export const impactChartData = [
  { month: 'Jan', users: 120, revenue: 8, adoption: 55, conversion: 18 },
  { month: 'Feb', users: 185, revenue: 14, adoption: 61, conversion: 22 },
  { month: 'Mar', users: 260, revenue: 20, adoption: 66, conversion: 28 },
  { month: 'Apr', users: 340, revenue: 28, adoption: 70, conversion: 32 },
  { month: 'May', users: 420, revenue: 36, adoption: 74, conversion: 38 },
  { month: 'Jun', users: 510, revenue: 44, adoption: 78, conversion: 42 },
  { month: 'Jul', users: 620, revenue: 52, adoption: 82, conversion: 48 },
  { month: 'Aug', users: 710, revenue: 61, adoption: 85, conversion: 52 },
  { month: 'Sep', users: 840, revenue: 72, adoption: 88, conversion: 58 },
  { month: 'Oct', users: 960, revenue: 84, adoption: 90, conversion: 64 },
  { month: 'Nov', users: 1080, revenue: 96, adoption: 92, conversion: 70 },
  { month: 'Dec', users: 1240, revenue: 108, adoption: 94, conversion: 76 },
]

export const caseStudies = [
  {
    id: 'explore-jobs',
    tag: 'Explore Jobs',
    title: 'Discover and Apply to Roles Posted on the Portal',
    challenge: 'Candidates bounce between job boards without knowing which openings are active, verified, and matched to their profile on HR Yantra.',
    research: 'The Explore Jobs page lists live tenant-posted roles with AI match hints, salary visibility, work mode, and one-click apply when your profile is ready.',
    strategy: 'Search by title and location, open job details, tailor your resume in LMS, and submit applications tracked in your dashboard.',
    results: [
      { metric: 'Live Jobs', value: '500+', detail: 'Open on portal' },
      { metric: 'Match Score', value: '91%', detail: 'Profile fit' },
      { metric: 'Apply Flow', value: '1-Click', detail: 'When profile ready' },
      { metric: 'Tracking', value: '100%', detail: 'In Applications' },
    ],
    color: '#28A8E1',
    bgColor: 'rgba(40,168,225,0.06)',
  },
  {
    id: 'profile-lms',
    tag: 'Profile & LMS',
    title: 'Build a Recruiter-Ready Profile and Resume',
    challenge: 'Incomplete profiles and generic CVs reduce visibility when recruiters search the Phase 1 candidate pool and Phase 2 CRM tenants.',
    research: 'HR Yantra combines Profile, Upload CV, ATS Check, and LMS Resume Builder so candidates improve keywords, skills, and formatting before applying.',
    strategy: 'Complete personal details, run ATS check, use AI resume editor, and sync improvements back to your portal candidate record.',
    results: [
      { metric: 'ATS Score', value: '92', detail: 'After optimization' },
      { metric: 'Profile', value: '94%', detail: 'Completion' },
      { metric: 'Skills', value: '24+', detail: 'Verified tags' },
      { metric: 'Time Saved', value: '8h', detail: 'Vs manual edits' },
    ],
    color: '#FC9620',
    bgColor: 'rgba(252,150,32,0.06)',
  },
  {
    id: 'applications-pipeline',
    tag: 'Applications',
    title: 'Track Every Application, Assessment, and Interview',
    challenge: 'Candidates lose track of screening tests, recruiter messages, and interview stages across multiple employer pipelines.',
    research: 'Applications and Candidate Dashboard show status timelines, pre-screen assessments, interview prep links, and placement progress from Phase 2 sync.',
    strategy: 'Monitor active applications, complete assessments from apply flow, and use LMS Interview Prep before recruiter rounds.',
    results: [
      { metric: 'Visibility', value: '96%', detail: 'Status clarity' },
      { metric: 'Assessments', value: 'Done', detail: 'In apply flow' },
      { metric: 'Interviews', value: '5', detail: 'Scheduled' },
      { metric: 'Response', value: '58%', detail: 'Recruiter replies' },
    ],
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.06)',
  },
]

export const experiences = [
  {
    id: 'signup',
    company: 'WhatsApp Sign-In',
    role: 'Step 1: Join the Portal',
    period: 'Day 1',
    description: 'Sign in with WhatsApp, verify your number, and land on your candidate dashboard with personalized job recommendations.',
    highlights: ['Quick OTP login', 'Secure session', 'Dashboard access'],
    color: '#28A8E1',
  },
  {
    id: 'profile',
    company: 'Profile & CV Setup',
    role: 'Step 2: Complete Your Profile',
    period: 'Week 1',
    description: 'Add experience, education, skills, and upload your CV. Run ATS Check and improve your resume in LMS Resume Builder.',
    highlights: ['Profile 94% complete', 'ATS optimized', 'Skills tagged'],
    color: '#28A8DF',
  },
  {
    id: 'explore',
    company: 'Explore Jobs',
    role: 'Step 3: Search & Apply',
    period: 'Week 2',
    description: 'Browse live openings from agency tenants, filter by location and role type, and apply with tailored CVs and screening flows.',
    highlights: ['42 AI matches', 'Remote & hybrid roles', 'Tracked applications'],
    color: '#0EA5E9',
  },
  {
    id: 'grow',
    company: 'LMS & Interview Prep',
    role: 'Step 4: Prepare & Progress',
    period: 'Ongoing',
    description: 'Use courses, mock interviews, career path planning, and application tracking until offer and placement stages.',
    highlights: ['Mock interviews', 'Application timeline', 'Recruiter visibility'],
    color: '#38BDF8',
  },
]

export const designSystemMetrics = [
  { label: 'Profile Completion', value: 94, suffix: '%', color: '#28A8E1' },
  { label: 'ATS Resume Score', value: 92, suffix: '%', color: '#28A8DF' },
  { label: 'Interview Readiness', value: 88, suffix: '%', color: '#0EA5E9' },
  { label: 'Application Tracking', value: 96, suffix: '%', color: '#10B981' },
  { label: 'AI Match Quality', value: 91, suffix: '%', color: '#6366F1' },
  { label: 'LMS Progress', value: 78, suffix: '%', color: '#38BDF8' },
]

export const testimonials = [
  {
    id: 1,
    quote: 'I used Explore Jobs and the resume builder on HR Yantra — within a week I had multiple interview calls for React roles in Pune. The application tracker kept everything organized.',
    name: 'Priya Sharma',
    title: 'Frontend Developer',
    company: 'Hired via HR Yantra',
    avatar: '/avatars/sarah.jpg',
    logo: '/logos/company1.svg',
  },
  {
    id: 2,
    quote: 'The ATS check and profile completion score showed exactly what to fix. Recruiters started viewing my profile after I synced skills and experience from the dashboard.',
    name: 'Rahul Mehta',
    title: 'Product Analyst',
    company: 'Hired via HR Yantra',
    avatar: '/avatars/marcus.jpg',
    logo: '/logos/company2.svg',
  },
  {
    id: 3,
    quote: 'As a recruiter using Phase 2 CRM, candidates from the HR Yantra portal arrive with clearer profiles, assessment results, and application history — it saves hours of screening.',
    name: 'Anita Desai',
    title: 'Talent Acquisition Lead',
    company: 'Agency tenant on HR Yantra',
    avatar: '/avatars/priya.jpg',
    logo: '/logos/company3.svg',
  },
  {
    id: 4,
    quote: 'Mock interviews in LMS and the pre-screen assessment flow helped me prepare before real rounds. I could see every stage in Applications without chasing email threads.',
    name: 'James Wilson',
    title: 'DevOps Engineer',
    company: 'Hired via HR Yantra',
    avatar: '/avatars/james.jpg',
    logo: '/logos/company4.svg',
  },
]

export const techStack = [
  { name: 'Explore Jobs', category: 'Portal', color: '#28A8E1', icon: '🔍' },
  { name: 'Candidate Dashboard', category: 'Portal', color: '#28A8DF', icon: '📊' },
  { name: 'Applications', category: 'Tracking', color: '#0EA5E9', icon: '📋' },
  { name: 'Profile & CV', category: 'Portal', color: '#0284C7', icon: '👤' },
  { name: 'ATS Check', category: 'AI Tools', color: '#38BDF8', icon: '✓' },
  { name: 'Resume Builder', category: 'LMS', color: '#6366F1', icon: '📝' },
  { name: 'Interview Prep', category: 'LMS', color: '#8B5CF6', icon: '🎤' },
  { name: 'Courses', category: 'LMS', color: '#10B981', icon: '📚' },
  { name: 'Career Path', category: 'LMS', color: '#14B8A6', icon: '🧭' },
  { name: 'WhatsApp Login', category: 'Auth', color: '#25D366', icon: '💬' },
  { name: 'Phase 2 CRM Sync', category: 'Enterprise', color: '#0F172A', icon: '🔗' },
  { name: 'Pre-Screen Tests', category: 'Assessments', color: '#F59E0B', icon: '⚡' },
]

export const whyHireComparisons = [
  {
    others: 'Generic job boards with outdated listings',
    candidate: 'Live jobs from HR Yantra tenant agencies',
    detail: 'Explore Jobs shows current openings posted by recruiters on Phase 2 CRM.',
  },
  {
    others: 'Apply without knowing fit',
    candidate: 'AI match score on profile and roles',
    detail: 'See how your skills align before you spend time on an application.',
  },
  {
    others: 'No idea where applications stand',
    candidate: 'Applications hub with live status',
    detail: 'Track screening, assessments, interviews, and offers in one timeline.',
  },
  {
    others: 'Resume rejected by ATS silently',
    candidate: 'ATS Check + Resume Builder in LMS',
    detail: 'Improve keywords and formatting before you apply.',
  },
  {
    others: 'Unprepared for interview rounds',
    candidate: 'LMS mock interviews & question banks',
    detail: 'Practice by role, company, and skill area inside the portal.',
  },
  {
    others: 'Profile scattered across tools',
    candidate: 'One candidate profile for Phase 1 & 2',
    detail: 'Your portal profile syncs with recruiter CRM when tenants engage you.',
  },
]

export const heroSocialProof = [
  { value: '500+', label: 'Live Openings' },
  { value: '91%', label: 'Avg Match Score' },
  { value: '42', label: 'AI Matches' },
  { value: '94%', label: 'Profile Ready' },
]
