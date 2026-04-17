// ─── Central service definitions for the Services module ───
// All 7 services defined once, consumed across landing, detail, recommendation,
// request, and "my services" pages.

export type ServiceCategory = 'resume' | 'profile' | 'assessment' | 'interview' | 'learning';

export interface ServiceDefinition {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;          // Tailwind color token base, e.g. "blue"
  iconKey: string;             // maps to Lucide icon key
  category: ServiceCategory;
  shortDescription: string;
  previewDeliverables: [string, string, string];
  fullDeliverables: string[];
  whoItIsFor: string[];
  requiredInputs: string[];
  howItWorksSteps: { step: number; title: string; description: string }[];
  expectedOutcomes: string[];
  relatedServiceSlugs: string[];
  recommendationReasons: string[];
  ctaLabel: string;
}

export const SERVICES: ServiceDefinition[] = [
  {
    id: 'svc-1',
    slug: 'ai-resume-review',
    title: 'AI Resume Review',
    subtitle: 'Get instant AI-powered feedback on your resume',
    badge: 'AI Powered',
    badgeColor: 'violet',
    iconKey: 'scan-search',
    category: 'resume',
    shortDescription:
      'Upload your resume and receive an instant, detailed analysis covering ATS readiness, keyword optimization, and actionable improvement tips — all powered by AI.',
    previewDeliverables: [
      'ATS readiness check',
      'Keyword gap insights',
      'Resume improvement tips',
    ],
    fullDeliverables: [
      'ATS compatibility score (0–100)',
      'Keyword gap analysis with suggestions',
      'Section-by-section quality assessment',
      'Grammar and formatting check',
      'Bullet point impact audit',
      'Actionable improvement recommendations',
    ],
    whoItIsFor: [
      'Job seekers preparing to apply',
      'Candidates unsure about ATS compatibility',
      'Anyone wanting quick resume feedback',
    ],
    requiredInputs: [
      'Upload your current resume (PDF/DOCX)',
      'Target role (optional)',
      'Experience level',
    ],
    howItWorksSteps: [
      { step: 1, title: 'Upload resume', description: 'Share your current resume in PDF or DOCX format.' },
      { step: 2, title: 'AI analyzes', description: 'Our AI engine scans and evaluates your resume across multiple dimensions.' },
      { step: 3, title: 'Review results', description: 'Get a detailed report with scores, insights, and recommendations.' },
      { step: 4, title: 'Take action', description: 'Apply the suggested improvements or use our CV editor to fix issues.' },
    ],
    expectedOutcomes: [
      'Understand how your resume performs against ATS systems',
      'Identify gaps in keywords and content',
      'Get a clear improvement roadmap',
    ],
    relatedServiceSlugs: ['resume-writing-upgrade', 'job-specific-cv-optimization'],
    recommendationReasons: ['Resume needs improvement', 'ATS score below target'],
    ctaLabel: 'Analyze Resume',
  },
  {
    id: 'svc-2',
    slug: 'resume-writing-upgrade',
    title: 'Resume Writing & Upgrade',
    subtitle: 'Professional resume upgrade by career experts',
    badge: 'Expert Guided',
    badgeColor: 'emerald',
    iconKey: 'file-pen-line',
    category: 'resume',
    shortDescription:
      'Work with experienced career professionals to rebuild or upgrade your resume with stronger content, better structure, and improved presentation.',
    previewDeliverables: [
      'Stronger resume content',
      'Better structure and clarity',
      'Improved presentation',
    ],
    fullDeliverables: [
      'Complete resume rewrite or upgrade',
      'Optimized content for target roles',
      'Professional formatting and structure',
      'Keyword-enriched bullet points',
      'Cover letter template (bonus)',
      'Two revision rounds included',
    ],
    whoItIsFor: [
      'Candidates with outdated resumes',
      'Career changers needing a fresh start',
      'Professionals targeting senior roles',
    ],
    requiredInputs: [
      'Upload current resume (PDF/DOCX)',
      'Target role',
      'Years of experience',
      'Industry',
      'Short career summary',
    ],
    howItWorksSteps: [
      { step: 1, title: 'Submit details', description: 'Share your current resume and target role information.' },
      { step: 2, title: 'Expert reviews', description: 'A career professional analyzes your resume and career goals.' },
      { step: 3, title: 'Receive upgrade', description: 'Get a professionally rewritten resume tailored to your target role.' },
      { step: 4, title: 'Review & refine', description: 'Request up to two rounds of revisions to finalize.' },
    ],
    expectedOutcomes: [
      'A polished, professional resume ready for applications',
      'Better alignment with target role requirements',
      'Improved interview callback rate',
    ],
    relatedServiceSlugs: ['ai-resume-review', 'job-specific-cv-optimization'],
    recommendationReasons: ['Resume needs major update', 'Targeting new roles'],
    ctaLabel: 'Upgrade Resume',
  },
  {
    id: 'svc-3',
    slug: 'job-specific-cv-optimization',
    title: 'Job-Specific CV Optimization',
    subtitle: 'Tailor your CV to match specific job requirements',
    badge: 'Role Based',
    badgeColor: 'amber',
    iconKey: 'crosshair',
    category: 'resume',
    shortDescription:
      'Optimize your resume for a specific job posting by aligning keywords, skills, and experience descriptions to match what recruiters are looking for.',
    previewDeliverables: [
      'Role-based keyword matching',
      'Job-fit improvement suggestions',
      'Stronger application targeting',
    ],
    fullDeliverables: [
      'Job description analysis',
      'Keyword matching report',
      'Tailored resume version for the specific role',
      'Skills alignment recommendations',
      'Application strength score',
      'Cover letter guidance for the role',
    ],
    whoItIsFor: [
      'Candidates applying to specific positions',
      'Anyone wanting to beat ATS for a target role',
      'Job seekers with multiple target roles',
    ],
    requiredInputs: [
      'Upload current resume (PDF/DOCX)',
      'Job description or job posting link',
      'Target role title',
    ],
    howItWorksSteps: [
      { step: 1, title: 'Share job details', description: 'Paste the job description or share the job link.' },
      { step: 2, title: 'Upload resume', description: 'We compare your resume against the job requirements.' },
      { step: 3, title: 'Get optimized CV', description: 'Receive a tailored CV version aligned to the specific role.' },
      { step: 4, title: 'Apply confidently', description: 'Submit your optimized resume to the job opening.' },
    ],
    expectedOutcomes: [
      'Higher ATS match score for the target role',
      'Better-aligned resume content',
      'Increased interview chances for the specific position',
    ],
    relatedServiceSlugs: ['ai-resume-review', 'resume-writing-upgrade'],
    recommendationReasons: ['Active job applications', 'Resume not matching target roles'],
    ctaLabel: 'Optimize for Job',
  },
  {
    id: 'svc-4',
    slug: 'linkedin-profile-optimization',
    title: 'LinkedIn Profile Optimization',
    subtitle: 'Boost your professional profile visibility',
    badge: 'Profile Boost',
    badgeColor: 'blue',
    iconKey: 'user-round-check',
    category: 'profile',
    shortDescription:
      'Improve your LinkedIn profile to attract more recruiter attention with a stronger headline, optimized summary, and better keyword visibility.',
    previewDeliverables: [
      'Better profile headline',
      'Improved summary section',
      'Recruiter visibility tips',
    ],
    fullDeliverables: [
      'Optimized headline and tagline',
      'Rewritten About/summary section',
      'Skills and endorsement recommendations',
      'Experience section enhancement',
      'Keyword optimization for recruiter search',
      'Profile completeness checklist',
    ],
    whoItIsFor: [
      'Candidates with incomplete LinkedIn profiles',
      'Professionals seeking more recruiter attention',
      'Anyone targeting passive job opportunities',
    ],
    requiredInputs: [
      'LinkedIn URL (optional)',
      'Current headline',
      'Summary/About text',
      'Target role',
      'Key skills',
    ],
    howItWorksSteps: [
      { step: 1, title: 'Share profile info', description: 'Provide your current LinkedIn details or profile URL.' },
      { step: 2, title: 'Profile audit', description: 'We analyze your profile for strengths and gaps.' },
      { step: 3, title: 'Get recommendations', description: 'Receive a detailed report with rewritten sections.' },
      { step: 4, title: 'Update & grow', description: 'Apply the changes and track your profile performance.' },
    ],
    expectedOutcomes: [
      'Increased recruiter profile views',
      'Stronger professional brand',
      'Higher visibility in recruiter searches',
    ],
    relatedServiceSlugs: ['resume-writing-upgrade', 'skill-assessment'],
    recommendationReasons: ['Profile can be stronger', 'Low recruiter visibility'],
    ctaLabel: 'Optimize Profile',
  },
  {
    id: 'svc-5',
    slug: 'skill-assessment',
    title: 'Skill Assessment Service',
    subtitle: 'Evaluate your expertise with structured assessments',
    badge: 'Assessment',
    badgeColor: 'rose',
    iconKey: 'clipboard-check',
    category: 'assessment',
    shortDescription:
      'Take a structured skill assessment to understand your strengths, identify weaknesses, and get personalized recommendations for improvement.',
    previewDeliverables: [
      'Skill score overview',
      'Strength and weakness breakdown',
      'Improvement recommendations',
    ],
    fullDeliverables: [
      'Comprehensive skill scorecard',
      'Strength analysis with evidence',
      'Weakness identification with suggestions',
      'Industry benchmarking comparison',
      'Learning path recommendations',
      'Shareable skill badge/certificate',
    ],
    whoItIsFor: [
      'Candidates preparing for technical interviews',
      'Career changers evaluating readiness',
      'Professionals wanting a skills benchmark',
    ],
    requiredInputs: [
      'Skill or domain to assess',
      'Current role level',
      'Assessment type (technical / behavioral)',
      'Target role (optional)',
    ],
    howItWorksSteps: [
      { step: 1, title: 'Select domain', description: 'Choose the skill area you want to assess.' },
      { step: 2, title: 'Take assessment', description: 'Complete a structured test tailored to your level.' },
      { step: 3, title: 'Get your scores', description: 'Receive detailed scores with strengths and weaknesses.' },
      { step: 4, title: 'Plan improvement', description: 'Follow the personalized learning recommendations.' },
    ],
    expectedOutcomes: [
      'Clear understanding of skill proficiency levels',
      'Targeted improvement plan',
      'Confidence in interview readiness',
    ],
    relatedServiceSlugs: ['mock-interview', 'upskilling-certification'],
    recommendationReasons: ['Skill gap detected', 'Interview preparation needed'],
    ctaLabel: 'Start Assessment',
  },
  {
    id: 'svc-6',
    slug: 'mock-interview',
    title: 'Mock Interview Service',
    subtitle: 'Practice with structured mock sessions',
    badge: 'Expert Guided',
    badgeColor: 'emerald',
    iconKey: 'message-square-more',
    category: 'interview',
    shortDescription:
      'Get interview-ready with structured mock sessions, expert feedback, and actionable tips to boost your confidence and performance.',
    previewDeliverables: [
      'Practice interview session',
      'Structured feedback',
      'Confidence improvement tips',
    ],
    fullDeliverables: [
      'Full-length mock interview session',
      'Structured feedback report',
      'Answer improvement suggestions',
      'Body language and communication tips',
      'Role-specific question preparation',
      'Follow-up practice recommendations',
    ],
    whoItIsFor: [
      'Candidates with upcoming interviews',
      'First-time job seekers',
      'Professionals returning after a career break',
    ],
    requiredInputs: [
      'Interview type (technical / behavioral / HR)',
      'Role or domain',
      'Experience level',
      'Preferred schedule',
      'Resume upload (optional)',
    ],
    howItWorksSteps: [
      { step: 1, title: 'Book a session', description: 'Choose your interview type and preferred time.' },
      { step: 2, title: 'Practice live', description: 'Join a structured mock interview with an expert.' },
      { step: 3, title: 'Get feedback', description: 'Receive detailed feedback, scores, and tips.' },
      { step: 4, title: 'Improve & repeat', description: 'Apply the learnings and book follow-up sessions.' },
    ],
    expectedOutcomes: [
      'Improved interview confidence',
      'Better answer structuring',
      'Higher interview success rate',
    ],
    relatedServiceSlugs: ['skill-assessment', 'upskilling-certification'],
    recommendationReasons: ['Interview preparation recommended', 'Upcoming interviews'],
    ctaLabel: 'Book Mock Interview',
  },
  {
    id: 'svc-7',
    slug: 'upskilling-certification',
    title: 'Upskilling & Certification Services',
    subtitle: 'Guided learning paths to grow your skills',
    badge: 'Learning',
    badgeColor: 'sky',
    iconKey: 'graduation-cap',
    category: 'learning',
    shortDescription:
      'Explore curated learning paths, certification suggestions, and skill growth roadmaps tailored to your career goals and target roles.',
    previewDeliverables: [
      'Recommended learning paths',
      'Certification suggestions',
      'Skill growth roadmap',
    ],
    fullDeliverables: [
      'Personalized learning path',
      'Industry-relevant certification recommendations',
      'Skill growth roadmap with milestones',
      'Resource recommendations (courses, books, projects)',
      'Progress tracking guidance',
      'Career impact projections',
    ],
    whoItIsFor: [
      'Candidates wanting structured learning',
      'Professionals targeting certifications',
      'Career changers exploring new domains',
    ],
    requiredInputs: [
      'Target role',
      'Current skill level',
      'Learning goal',
      'Preferred domain',
      'Available time per week',
    ],
    howItWorksSteps: [
      { step: 1, title: 'Set your goal', description: 'Define your target role and learning objectives.' },
      { step: 2, title: 'Get a roadmap', description: 'Receive a personalized learning path with milestones.' },
      { step: 3, title: 'Start learning', description: 'Access recommended resources and begin your journey.' },
      { step: 4, title: 'Track progress', description: 'Monitor your skill growth and adjust as needed.' },
    ],
    expectedOutcomes: [
      'Clear skill development direction',
      'Certification readiness',
      'Measurable progress toward career goals',
    ],
    relatedServiceSlugs: ['skill-assessment', 'mock-interview'],
    recommendationReasons: ['Skill development opportunity', 'Career growth potential'],
    ctaLabel: 'Explore Learning Paths',
  },
];

// ─── Helper utilities ───

export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function getServicesByCategory(category: ServiceCategory | 'all'): ServiceDefinition[] {
  if (category === 'all') return SERVICES;
  return SERVICES.filter((s) => s.category === category);
}

export function getRelatedServices(slug: string): ServiceDefinition[] {
  const service = getServiceBySlug(slug);
  if (!service) return [];
  return service.relatedServiceSlugs
    .map((s) => getServiceBySlug(s))
    .filter((s): s is ServiceDefinition => !!s);
}

/** Mock: returns 3 recommended services. */
export function getRecommendedServices(): ServiceDefinition[] {
  return [SERVICES[0], SERVICES[4], SERVICES[5]];
}

export const SERVICE_CATEGORIES = [
  { key: 'all' as const, label: 'All Services' },
  { key: 'resume' as const, label: 'Resume' },
  { key: 'profile' as const, label: 'Profile' },
  { key: 'assessment' as const, label: 'Assessment' },
  { key: 'interview' as const, label: 'Interview' },
  { key: 'learning' as const, label: 'Learning' },
];
