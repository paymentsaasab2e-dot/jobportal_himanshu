/**
 * Centralized mock data for LMS AI-layer UI.
 * Replace with API/model responses when backend is ready.
 */

import type { AIRecommendationItem } from '../components/ai';

export const dashboardAIScores = [
  {
    id: 'interview-readiness',
    title: 'Interview readiness',
    score: 78,
    supportingText: 'Strong on take-home narratives; add one more system design dry run.',
    visual: 'ring' as const,
  },
  {
    id: 'resume-strength',
    title: 'Resume strength',
    score: 84,
    supportingText: 'Impact bullets read well; keyword coverage for UI roles is good.',
    visual: 'bar' as const,
  },
  {
    id: 'weekly-goal',
    title: 'Weekly learning goal',
    score: 55,
    supportingText: 'You’re halfway through this week’s goal—two short modules left.',
    visual: 'bar' as const,
  },
];

export const dashboardPrimaryInsight = {
  title: 'Personalized coaching tip',
  recommendation:
    'You are strong in React fundamentals, but should revise system design before your next UI Engineer interview.',
  badge: 'High priority',
  ctaLabel: 'Open system design path',
};

export const dashboardNextActions = [
  { id: 'resume', label: 'Improve Resume' },
  { id: 'questions', label: 'Generate Questions' },
  { id: 'notes', label: 'Summarize Notes' },
  { id: 'mock', label: 'Start Mock Interview' },
];

export const dashboardModuleRecommendations: AIRecommendationItem[] = [
  {
    id: 'm1',
    label: 'React performance patterns',
    text: 'Suggested module based on your goal: Frontend Developer and recent quiz gaps.',
    ctaLabel: 'Add to queue',
  },
  {
    id: 'm2',
    label: 'Behavioral STAR drills',
    text: 'Short daily practice to lift interview readiness before upcoming screens.',
    ctaLabel: 'Start module',
  },
  {
    id: 'm3',
    label: 'API design basics',
    text: 'Complements your system design revision plan for the next two weeks.',
    ctaLabel: 'Preview outline',
  },
];

export const dashboardRolePath = {
  title: 'Role-focused path',
  recommendation:
    'Your learning path is tuned for a UI Engineer track: polish system design, then schedule a mock focused on component architecture.',
  badge: 'UI Engineer',
  ctaLabel: 'View full path',
};

export const interviewQuestionGeneratorCards = [
  {
    id: 'hr',
    title: 'HR questions',
    description: 'Behavioral prompts tailored to your saved target companies (mock).',
    cta: 'Generate set',
  },
  {
    id: 'tech',
    title: 'Technical questions',
    description: 'Language and framework drills matched to your resume stack.',
    cta: 'Generate set',
  },
  {
    id: 'sd',
    title: 'System design',
    description: 'Scenario cards with hints and follow-up questions.',
    cta: 'Generate set',
  },
  {
    id: 'co',
    title: 'Company-specific',
    description: 'Culture and product questions using public signals only (mock).',
    cta: 'Generate set',
  },
];

export const interviewMockDifficulties = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const interviewMockRoles = [
  'UI Engineer',
  'Frontend Developer',
  'Full-stack Engineer',
  'Product Designer (tech)',
] as const;

export const interviewFeedbackSummary = {
  strengths: ['Clear structure in answers', 'Good use of examples', 'Calm pacing'],
  weakAreas: ['Deep dives on trade-offs', 'Estimation under time pressure'],
  confidenceScore: 72,
};

export const interviewRevisionTopics = [
  'Caching strategies & CDN edge cases',
  'React concurrent features & when to use them',
  'Leading with outcomes in behavioral answers',
  'Drawing system boundaries in 5 minutes',
];

export type CourseIconKey = 'code2' | 'palette' | 'lineChart' | 'bookOpen';

export const lmsCoursesWithAI: Array<{
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate';
  progress: number | null;
  iconKey: CourseIconKey;
  aiContext: string;
}> = [
  {
    id: 'c1',
    title: 'Frontend interview readiness',
    description: 'Components, state, and how to explain your projects under pressure.',
    duration: '4h',
    level: 'Intermediate',
    progress: 62,
    iconKey: 'code2',
    aiContext: 'Recommended for your Frontend Developer goal.',
  },
  {
    id: 'c2',
    title: 'UI craft & accessibility',
    description: 'Layout, contrast, and inclusive patterns hiring teams notice.',
    duration: '3h',
    level: 'Beginner',
    progress: null,
    iconKey: 'palette',
    aiContext: 'Suggested because of interview prep gaps in accessibility talking points.',
  },
  {
    id: 'c3',
    title: 'Data literacy for product roles',
    description: 'Metrics, experiments, and communicating impact with numbers.',
    duration: '5h',
    level: 'Intermediate',
    progress: 18,
    iconKey: 'lineChart',
    aiContext: 'Best next course based on your recent quiz performance.',
  },
  {
    id: 'c4',
    title: 'Professional communication',
    description: 'Email, async updates, and stakeholder updates that build trust.',
    duration: '2h',
    level: 'Beginner',
    progress: null,
    iconKey: 'bookOpen',
    aiContext: 'Recommended for your Frontend Developer goal.',
  },
  {
    id: 'c5',
    title: 'System design warm-up',
    description: 'APIs, caching, and scaling vocabulary before deep dives.',
    duration: '6h',
    level: 'Intermediate',
    progress: null,
    iconKey: 'code2',
    aiContext: 'Suggested because of interview prep gaps.',
  },
  {
    id: 'c6',
    title: 'Career narrative lab',
    description: 'Turn scattered experience into a clear story for recruiters.',
    duration: '2.5h',
    level: 'Beginner',
    progress: 100,
    iconKey: 'bookOpen',
    aiContext: 'Completed — AI suggests a refresher before your next application wave.',
  },
];

export type LmsCourseLesson = {
  id: string;
  title: string;
  estMin: number;
};

export type LmsCourseModule = {
  id: string;
  title: string;
  lessons: LmsCourseLesson[];
};

export const lmsCourseContent: Record<string, { modules: LmsCourseModule[] }> = {
  c1: {
    modules: [
      {
        id: 'm1',
        title: 'Narratives that pass screens',
        lessons: [
          { id: 'l1', title: 'What interviewers listen for', estMin: 8 },
          { id: 'l2', title: 'Explaining trade-offs clearly', estMin: 12 },
        ],
      },
      {
        id: 'm2',
        title: 'React performance in practice',
        lessons: [
          { id: 'l3', title: 'Rendering model refresher', estMin: 10 },
          { id: 'l4', title: 'Memoization & pitfalls', estMin: 14 },
          { id: 'l5', title: 'Measuring: Web Vitals', estMin: 9 },
        ],
      },
    ],
  },
  c2: {
    modules: [
      {
        id: 'm1',
        title: 'Inclusive UI basics',
        lessons: [
          { id: 'l1', title: 'Contrast and semantics', estMin: 9 },
          { id: 'l2', title: 'Keyboard interactions', estMin: 11 },
        ],
      },
    ],
  },
  c3: {
    modules: [
      {
        id: 'm1',
        title: 'Metrics for product conversations',
        lessons: [
          { id: 'l1', title: 'North star metrics', estMin: 10 },
          { id: 'l2', title: 'Experiments and confidence', estMin: 12 },
        ],
      },
    ],
  },
  c4: {
    modules: [
      {
        id: 'm1',
        title: 'Communication habits',
        lessons: [
          { id: 'l1', title: 'Async updates that land', estMin: 7 },
          { id: 'l2', title: 'Stakeholder framing', estMin: 9 },
        ],
      },
    ],
  },
  c5: {
    modules: [
      {
        id: 'm1',
        title: 'System design warm-up',
        lessons: [
          { id: 'l1', title: 'APIs and boundaries', estMin: 12 },
          { id: 'l2', title: 'Caching vocabulary', estMin: 10 },
          { id: 'l3', title: 'Scaling trade-offs (lite)', estMin: 14 },
        ],
      },
    ],
  },
  c6: {
    modules: [
      {
        id: 'm1',
        title: 'Career narrative lab',
        lessons: [
          { id: 'l1', title: 'Impact bullets that scan', estMin: 10 },
          { id: 'l2', title: 'STAR without rambling', estMin: 12 },
        ],
      },
    ],
  },
};

export type LmsLessonType = 'video' | 'reading' | 'exercise' | 'mock';

export const lmsCourseMeta: Record<
  string,
  {
    category: 'Frontend' | 'Design' | 'Data' | 'Communication' | 'System Design' | 'Career';
    skills: string[];
    keywords: string[];
    outcomes: string[];
    whyRecommended: string;
    recommendedNextId: string | null;
  }
> = {
  c1: {
    category: 'Frontend',
    skills: ['React', 'Problem Solving', 'Interview Communication'],
    keywords: ['frontend', 'react', 'interview', 'architecture'],
    outcomes: [
      'Explain component decisions clearly in interviews',
      'Use structured thinking for technical prompts',
      'Answer frontend architecture follow-ups with confidence',
    ],
    whyRecommended: 'You are targeting frontend roles and recent signals showed interview communication gaps.',
    recommendedNextId: 'c5',
  },
  c2: {
    category: 'Design',
    skills: ['Accessibility', 'UI Craft', 'Design Systems'],
    keywords: ['ui', 'accessibility', 'design', 'a11y'],
    outcomes: [
      'Ship accessible UI patterns confidently',
      'Identify and fix contrast and semantics issues',
      'Discuss design-system trade-offs during interviews',
    ],
    whyRecommended: 'Accessibility talking points are currently underrepresented in your prep.',
    recommendedNextId: 'c1',
  },
  c3: {
    category: 'Data',
    skills: ['Metrics', 'Experimentation', 'Product Thinking'],
    keywords: ['metrics', 'data', 'product', 'experiments'],
    outcomes: [
      'Choose practical metrics for frontend initiatives',
      'Communicate product impact with simple data narratives',
      'Frame A/B test outcomes clearly',
    ],
    whyRecommended: 'Recent quiz performance suggests this is the best next area for impact storytelling.',
    recommendedNextId: 'c4',
  },
  c4: {
    category: 'Communication',
    skills: ['Stakeholder Communication', 'Async Collaboration'],
    keywords: ['communication', 'stakeholder', 'updates', 'collaboration'],
    outcomes: [
      'Write concise async updates',
      'Communicate blockers and trade-offs early',
      'Present technical status to mixed audiences',
    ],
    whyRecommended: 'Strong communication improves interview outcomes and cross-team execution quality.',
    recommendedNextId: 'c6',
  },
  c5: {
    category: 'System Design',
    skills: ['API Design', 'Caching', 'Scalability Basics'],
    keywords: ['system design', 'scaling', 'caching', 'apis'],
    outcomes: [
      'Handle common system design interview prompts',
      'Reason about trade-offs in caching and APIs',
      'Sketch architecture under time pressure',
    ],
    whyRecommended: 'System design remains your highest-priority weak area from LMS signals.',
    recommendedNextId: 'c1',
  },
  c6: {
    category: 'Career',
    skills: ['Storytelling', 'Resume Narrative', 'Behavioral Interviews'],
    keywords: ['career', 'narrative', 'behavioral', 'resume'],
    outcomes: [
      'Craft a coherent personal narrative for interviews',
      'Translate work into measurable outcomes',
      'Improve confidence in behavioral rounds',
    ],
    whyRecommended: 'Use this as a refresher before application sprints and mock loops.',
    recommendedNextId: 'c1',
  },
};

export const lmsLessonContent: Record<
  string,
  {
    type: LmsLessonType;
    intro: string;
    keyTakeaways: string[];
    practiceTask: string;
    resources: string[];
  }
> = {
  'c1:l1': {
    type: 'video',
    intro: 'Learn what interviewers evaluate in frontend rounds and how to structure your response quickly.',
    keyTakeaways: ['Signal clarity before detail', 'State trade-offs explicitly', 'Anchor with concrete outcomes'],
    practiceTask: 'Record a 90-second answer to “Tell me about your recent frontend project.”',
    resources: ['Mock rubric: frontend answer quality', 'Prompt bank: architecture follow-ups'],
  },
  'c1:l2': {
    type: 'exercise',
    intro: 'Practice explaining trade-offs in state management, rendering, and API orchestration.',
    keyTakeaways: ['Name options', 'Compare trade-offs', 'Pick and defend one path'],
    practiceTask: 'Write three trade-off comparisons for a dashboard feature architecture.',
    resources: ['Template: trade-off table', 'Checklist: concise technical explanations'],
  },
  'c1:l3': {
    type: 'reading',
    intro: 'Revisit the rendering model and identify typical causes of expensive rerenders.',
    keyTakeaways: ['State boundaries matter', 'Memoization is contextual', 'Measure before optimizing'],
    practiceTask: 'Annotate one component tree with likely rerender hotspots.',
    resources: ['Render profiling cheat sheet', 'React performance glossary'],
  },
  'c1:l4': {
    type: 'exercise',
    intro: 'Apply memoization patterns correctly and avoid stale values/over-memoization.',
    keyTakeaways: ['Memoize intentionally', 'Watch dependencies', 'Prefer simpler data flow first'],
    practiceTask: 'Refactor a noisy component with selective memoization and explain why.',
    resources: ['Hook dependency checklist', 'Common memoization anti-patterns'],
  },
  'c1:l5': {
    type: 'mock',
    intro: 'Translate performance work into measurable product impact using web vitals framing.',
    keyTakeaways: ['Use baseline → improvement framing', 'Report user-facing impact', 'Tie metrics to decisions'],
    practiceTask: 'Draft a mock interview answer using one performance before/after story.',
    resources: ['Web vitals quick reference', 'Impact-story template'],
  },
};

export type LmsQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  skill: 'javascript' | 'react' | 'system' | 'behavioral' | 'data';
};

export type LmsQuizSkill = LmsQuizQuestion['skill'];
export type LmsQuizDifficulty = 'Easy' | 'Medium' | 'Hard';

export type LmsQuizCatalogItem = {
  id: string;
  title: string;
  questions: number;
  difficulty: LmsQuizDifficulty;
  topic: string;
  description: string;
  estMinutes: number;
  whyRecommended: string;
  weakConcepts: string[];
  recommendedCourseId: string | null;
  courseFocus: string;
  relatedQuizIds: string[];
};

export type LmsQuizSkillMeta = {
  label: string;
  summary: string;
  weakConcepts: string[];
  defaultQuizId: string;
  recommendedCourseId: string | null;
  courseFocus: string;
  retryLabel: string;
  emptyMessage: string;
  suggestedLessonsLabel: string;
};

export const lmsQuizBank: Record<string, { title: string; skill: LmsQuizSkill; questions: LmsQuizQuestion[] }> =
  {
    q1: {
      title: 'JavaScript essentials',
      skill: 'javascript',
      questions: [
        {
          id: 'q1-1',
          prompt: 'What does `let` change compared to `var`?',
          options: ['Block scoping and TDZ behavior', 'It makes variables immutable', 'It hoists differently (never hoists)', 'It disables closures'],
          correctIndex: 0,
          explanation: '`let` is block-scoped and has a temporal dead zone until initialized.',
          skill: 'javascript',
        },
        {
          id: 'q1-2',
          prompt: 'Which is true about `===`?',
          options: ['It performs type coercion', 'It compares without type coercion', 'It always returns true for objects', 'It compares object deep equality'],
          correctIndex: 1,
          explanation: '`===` compares values without coercing types.',
          skill: 'javascript',
        },
      ],
    },
    q2: {
      title: 'React & hooks',
      skill: 'react',
      questions: [
        {
          id: 'q2-1',
          prompt: 'When does `useEffect` run by default?',
          options: ['Only on mount', 'After every render', 'Before render', 'Only when state changes'],
          correctIndex: 1,
          explanation: 'Without a dependency array, it runs after every render.',
          skill: 'react',
        },
        {
          id: 'q2-2',
          prompt: 'What does `key` help React do?',
          options: ['Prevent re-renders', 'Identify items across renders for reconciliation', 'Make lists sortable', 'Enable SSR'],
          correctIndex: 1,
          explanation: 'Keys help React match list items between renders.',
          skill: 'react',
        },
      ],
    },
    q3: {
      title: 'Async & networking',
      skill: 'javascript',
      questions: [
        {
          id: 'q3-1',
          prompt: 'Promises are scheduled on…',
          options: ['Call stack only', 'Microtask queue', 'Macrotask queue only', 'GPU thread'],
          correctIndex: 1,
          explanation: 'Promise reactions are queued as microtasks.',
          skill: 'javascript',
        },
      ],
    },
    q4: {
      title: 'Behavioral scenarios',
      skill: 'behavioral',
      questions: [
        {
          id: 'q4-1',
          prompt: 'In STAR, what should the “Result” emphasize?',
          options: ['Only feelings', 'Impact and measurable outcomes when possible', 'Tools used only', 'Team size only'],
          correctIndex: 1,
          explanation: 'The result should show impact; numbers help but clarity matters most.',
          skill: 'behavioral',
        },
      ],
    },
    q5: {
      title: 'SQL & data modeling',
      skill: 'data',
      questions: [
        {
          id: 'q5-1',
          prompt: 'What does a primary key guarantee?',
          options: ['Nulls allowed', 'Uniqueness per row', 'Sorted rows', 'Automatic indexing always in every DB'],
          correctIndex: 1,
          explanation: 'Primary keys uniquely identify rows (nulls not allowed).',
          skill: 'data',
        },
      ],
    },
    q6: {
      title: 'System design quiz',
      skill: 'system',
      questions: [
        {
          id: 'q6-1',
          prompt: 'A CDN primarily helps with…',
          options: ['Compute scaling only', 'Reducing latency by serving content closer to users', 'Database normalization', 'Encrypting traffic'],
          correctIndex: 1,
          explanation: 'CDNs reduce latency and offload origin by caching at edge locations.',
          skill: 'system',
        },
      ],
    },
  };

export const lmsQuizSkillMeta: Record<LmsQuizSkill, LmsQuizSkillMeta> = {
  javascript: {
    label: 'JavaScript',
    summary: 'Tighten scope, async flow, and debugging fundamentals before your next frontend screen.',
    weakConcepts: ['Scope and closures', 'Promise timing and microtasks', 'Async error handling'],
    defaultQuizId: 'q1',
    recommendedCourseId: 'c1',
    courseFocus: 'frontend',
    retryLabel: 'Based on recent JavaScript misses',
    emptyMessage: 'Complete a JavaScript quiz to unlock targeted retry guidance.',
    suggestedLessonsLabel: 'Frontend interview readiness',
  },
  react: {
    label: 'React',
    summary: 'Keep sharpening hooks, rendering behavior, and component reasoning.',
    weakConcepts: ['Effect dependencies', 'Reconciliation and keys', 'State update timing'],
    defaultQuizId: 'q2',
    recommendedCourseId: 'c1',
    courseFocus: 'react',
    retryLabel: 'Retry recommended from your React attempts',
    emptyMessage: 'Take a React quiz first and we will surface a more precise drill here.',
    suggestedLessonsLabel: 'Frontend interview readiness',
  },
  system: {
    label: 'System design',
    summary: 'Focus on caching, APIs, and scaling trade-offs before architecture rounds.',
    weakConcepts: ['Caching layers', 'CDN and latency trade-offs', 'Service boundaries'],
    defaultQuizId: 'q6',
    recommendedCourseId: 'c5',
    courseFocus: 'system design',
    retryLabel: 'Missed concepts from recent system design practice',
    emptyMessage: 'No system design retry is available until you finish a scored quiz.',
    suggestedLessonsLabel: 'System design warm-up',
  },
  behavioral: {
    label: 'Behavioral',
    summary: 'Practice clearer STAR outcomes and stronger stakeholder storytelling.',
    weakConcepts: ['STAR result framing', 'Conflict follow-ups', 'Ownership storytelling'],
    defaultQuizId: 'q4',
    recommendedCourseId: 'c6',
    courseFocus: 'career narrative',
    retryLabel: 'Refresh the stories that felt weakest last time',
    emptyMessage: 'Finish a behavioral set and we will tailor the follow-up drill.',
    suggestedLessonsLabel: 'Career narrative lab',
  },
  data: {
    label: 'Data',
    summary: 'Review SQL basics and modeling language for data-fluent product conversations.',
    weakConcepts: ['Primary keys and constraints', 'Normalization basics', 'Metrics trade-offs'],
    defaultQuizId: 'q5',
    recommendedCourseId: 'c3',
    courseFocus: 'metrics',
    retryLabel: 'Retry based on data-modeling misses',
    emptyMessage: 'Complete a data quiz to unlock a smarter retry recommendation.',
    suggestedLessonsLabel: 'Data literacy for product roles',
  },
};

export function lmsNormalizeQuizSkill(skill: string | null | undefined): LmsQuizSkill | null {
  if (!skill) return null;
  const normalized = skill.trim().toLowerCase();
  if (normalized === 'javascript' || normalized === 'js' || normalized === 'async') return 'javascript';
  if (normalized === 'react' || normalized === 'hooks') return 'react';
  if (normalized === 'system' || normalized === 'system design' || normalized === 'system-design') return 'system';
  if (normalized === 'behavioral' || normalized === 'behavioural') return 'behavioral';
  if (normalized === 'data' || normalized === 'sql') return 'data';
  return null;
}

export function lmsQuizSkillLabel(skill: string | null | undefined) {
  const normalized = lmsNormalizeQuizSkill(skill);
  return normalized ? lmsQuizSkillMeta[normalized].label : null;
}

export function lmsQuizIdForSkill(skill: string | null) {
  const normalized = lmsNormalizeQuizSkill(skill);
  return normalized ? lmsQuizSkillMeta[normalized].defaultQuizId : 'q2';
}

export const quizzesAIRecommended = {
  quizId: 'q3',
  title: 'Full-stack JavaScript deep dive',
  topic: 'JavaScript & async',
  questions: 20,
  difficulty: 'Medium' as const,
  blurb: 'Top pick based on your last two quiz attempts and career path focus.',
  estMinutes: 10,
  whyThisQuiz: [
    'You scored 42% in System Design',
    'Missed “scalability” questions in the last attempt',
    'Required for the next interview stage on your target role',
  ],
};

export const quizzesRetryWeak = [
  { id: 'q1', title: 'JavaScript essentials', topic: 'JavaScript', questions: 24, difficulty: 'Easy' as const },
  { id: 'q2', title: 'React & hooks', topic: 'React', questions: 18, difficulty: 'Medium' as const },
];

export const quizzesMasteryByTopic = [
  { topic: 'JavaScript', slug: 'javascript', pct: 68 },
  { topic: 'React', slug: 'react', pct: 74 },
  { topic: 'System design', slug: 'system', pct: 42 },
  { topic: 'Behavioral', slug: 'behavioral', pct: 81 },
];

export const quizzesRecentPerformance = { score: 76, label: 'Last quiz · 2 days ago' };

export const quizzesCatalog: LmsQuizCatalogItem[] = [
  {
    id: 'q1',
    title: 'JavaScript essentials',
    questions: 24,
    difficulty: 'Easy',
    topic: 'JavaScript',
    description: 'Core language fundamentals, scoping rules, coercion, and quick debugging checks.',
    estMinutes: 8,
    whyRecommended: 'A reliable reset when language basics are dragging down frontend quiz performance.',
    weakConcepts: ['let vs var scoping', 'strict equality checks', 'truthy vs falsy edge cases'],
    recommendedCourseId: 'c1',
    courseFocus: 'frontend',
    relatedQuizIds: ['q3', 'q2'],
  },
  {
    id: 'q2',
    title: 'React & hooks',
    questions: 18,
    difficulty: 'Medium',
    topic: 'React',
    description: 'Hooks behavior, rendering decisions, list reconciliation, and component-level trade-offs.',
    estMinutes: 10,
    whyRecommended: 'Ideal when you need stronger confidence in React interview fundamentals.',
    weakConcepts: ['useEffect timing', 'keys and reconciliation', 'state update flow'],
    recommendedCourseId: 'c1',
    courseFocus: 'react',
    relatedQuizIds: ['q1'],
  },
  {
    id: 'q3',
    title: 'Async & networking',
    questions: 15,
    difficulty: 'Hard',
    topic: 'JavaScript',
    description: 'Promises, microtasks, fetch behavior, and async reasoning under interview pressure.',
    estMinutes: 12,
    whyRecommended: 'Strong follow-up when async flow questions have started costing points.',
    weakConcepts: ['Promise queues', 'await behavior', 'networking error handling'],
    recommendedCourseId: 'c1',
    courseFocus: 'frontend',
    relatedQuizIds: ['q1', 'q2'],
  },
  {
    id: 'q4',
    title: 'Behavioral scenarios',
    questions: 12,
    difficulty: 'Easy',
    topic: 'Behavioral',
    description: 'Short STAR-based prompts to tighten story clarity, ownership, and measurable outcomes.',
    estMinutes: 6,
    whyRecommended: 'Best for improving recruiter screens and conversational confidence quickly.',
    weakConcepts: ['result framing', 'conflict examples', 'stakeholder alignment'],
    recommendedCourseId: 'c6',
    courseFocus: 'career narrative',
    relatedQuizIds: [],
  },
  {
    id: 'q5',
    title: 'SQL & data modeling',
    questions: 20,
    difficulty: 'Medium',
    topic: 'Data',
    description: 'Schema basics, keys, relational thinking, and practical data vocabulary for product roles.',
    estMinutes: 11,
    whyRecommended: 'A useful bridge between analytics basics and product-impact communication.',
    weakConcepts: ['primary keys', 'table relationships', 'basic normalization'],
    recommendedCourseId: 'c3',
    courseFocus: 'metrics',
    relatedQuizIds: ['q6'],
  },
  {
    id: 'q6',
    title: 'System design quiz',
    questions: 10,
    difficulty: 'Hard',
    topic: 'System design',
    description: 'Caching, APIs, traffic patterns, and architecture trade-offs for interview warm-ups.',
    estMinutes: 14,
    whyRecommended: 'High-impact practice when architecture trade-offs are your current weak spot.',
    weakConcepts: ['CDN usage', 'caching strategies', 'service boundaries'],
    recommendedCourseId: 'c5',
    courseFocus: 'system design',
    relatedQuizIds: ['q5'],
  },
];

export const lmsQuizCatalogById = Object.fromEntries(
  quizzesCatalog.map((quiz) => [quiz.id, quiz] as const)
) as Record<string, LmsQuizCatalogItem>;

export const quizzesAIExplanation =
  'Based on your progress, revise JavaScript closures and React rendering before taking the advanced quiz.';

export const eventsRecommendedIntro =
  'Live sessions aligned with your UI Engineer preparation goal (mock recommendations).';

export const eventsWithAI: Array<{
  id: string;
  title: string;
  date: string;
  mode: 'Online' | 'Offline';
  type: string;
  matchLabel: string;
  whyAttend: string[];
  registeredCount: number;
  startsIn: string;
  overview: string;
  speaker: string;
  status: 'upcoming' | 'past';
  skill: string;
}> = [
  {
    id: 'evt-101',
    title: 'UI portfolio critique live',
    date: 'Thu, Mar 27 · 4:00 PM',
    mode: 'Online',
    type: 'Workshop',
    matchLabel: 'Highly relevant for your UI Engineer preparation',
    whyAttend: ['Sharpens portfolio round stories', 'Common format in UI interviews'],
    registeredCount: 23,
    startsIn: 'Starts in 2 days',
    overview: 'Join leading UI designers as they tear down and critique real portfolio submissions live. Excellent preparation for your upcoming portfolio rounds.',
    speaker: 'Alex Morgan, Lead Designer at Vercel',
    status: 'upcoming',
    skill: 'react',
  },
  {
    id: 'evt-102',
    title: 'Meet the talent team',
    date: 'Sat, Mar 29 · 10:00 AM',
    mode: 'Offline',
    type: 'Networking',
    matchLabel: 'Matches your networking goal this month',
    whyAttend: ['Practice elevator pitch', 'Learn hiring bar signals'],
    registeredCount: 41,
    startsIn: 'Starts in 4 days',
    overview: 'An exclusive offline mixer where you can speed-network directly with our internal talent acquisition partners and learn inside hiring tips.',
    speaker: 'Talent Acquisition Team',
    status: 'upcoming',
    skill: 'behavioral',
  },
  {
    id: 'evt-103',
    title: 'Negotiation office hours',
    date: 'Tue, Apr 1 · 7:00 PM',
    mode: 'Online',
    type: 'Office hours',
    matchLabel: 'Suggested after your recent offer-stage notes',
    whyAttend: ['Aligns with salary research notes', 'Q&A on competing offers'],
    registeredCount: 58,
    startsIn: 'Starts in 6 days',
    overview: 'Drop-in session for answering all your pressing questions about equity, base combinations, and effectively playing competing offers.',
    speaker: 'Jordan Lee, Compensation Expert',
    status: 'upcoming',
    skill: 'salary',
  },
  {
    id: 'evt-104',
    title: 'Networking breakfast',
    date: 'Fri, Apr 4 · 8:30 AM',
    mode: 'Offline',
    type: 'Meetup',
    matchLabel: 'Good fit for local hiring market research',
    whyAttend: ['Local hiring intel', 'Warm intros practice'],
    registeredCount: 17,
    startsIn: 'Starts in 9 days',
    overview: 'Informal breakfast for tech professionals. Build organic relationships in your local tech hub without the pressure of forced networking.',
    speaker: 'Community Lead',
    status: 'upcoming',
    skill: 'behavioral',
  },
  {
    id: 'evt-105',
    title: 'Tech talk: AI in hiring',
    date: 'Wed, Apr 9 · 6:00 PM',
    mode: 'Online',
    type: 'Webinar',
    matchLabel: 'Optional — broaden context on recruiter tooling',
    whyAttend: ['Context on how recruiters screen', 'Low time commitment'],
    registeredCount: 120,
    startsIn: 'Starts in 14 days',
    overview: 'Webinar diving into how modern Applicant Tracking Systems parse and flag your resume. We will cover keyword optimization strategies.',
    speaker: 'Samira Dev, ML Engineer',
    status: 'upcoming',
    skill: 'resume',
  },
  {
    id: 'evt-106',
    title: 'Campus hiring prep',
    date: 'Mon, Apr 14 · 3:00 PM',
    mode: 'Offline',
    type: 'Bootcamp',
    matchLabel: 'Relevant if you are targeting new-grad pipelines',
    whyAttend: ['Resume + OA patterns', 'Group mock practice'],
    registeredCount: 34,
    startsIn: 'Starts in 19 days',
    overview: 'Intensive half-day session focused exclusively on breaking the entry-level barrier and standing out in campus pipelines.',
    speaker: 'University Recruiting Team',
    status: 'upcoming',
    skill: 'system-design',
  },
  {
    id: 'evt-past-1',
    title: 'System Design Patterns 2026',
    date: 'Mon, Feb 10 · 2:00 PM',
    mode: 'Online',
    type: 'Masterclass',
    matchLabel: 'Past popular event on System Design',
    whyAttend: ['High-level architecture review', 'Trends analysis'],
    registeredCount: 310,
    startsIn: 'Event finished',
    overview: 'A deep dive into the latest scalable design patterns used by hyper-growth startups.',
    speaker: 'Elena Rust, Staff Engineer',
    status: 'past',
    skill: 'system-design',
  }
];

export const resumeAIScores = [
  { id: 'ats', title: 'ATS score', score: 82, text: 'Structure and headings parse cleanly in mock scans.' },
  { id: 'kw', title: 'Keyword coverage', score: 76, text: 'Strong on UI stack; add 2–3 testing keywords.' },
  { id: 'impact', title: 'Impact writing', score: 71, text: 'Bullets show outcomes—tighten metrics on recent role.' },
];

export const resumeAIImprovements = [
  'Quantify the design system adoption impact on your last team.',
  'Add “accessibility” and “design tokens” if targeting design-engineering roles.',
  'Move certifications above skills for ATS variants that weight them higher.',
];

export const resumeAIChips = [
  { id: 'bullets', label: 'Improve bullet points' },
  { id: 'kw', label: 'Add missing keywords' },
  { id: 'tailor', label: 'Tailor for job' },
  { id: 'summary', label: 'Rewrite summary' },
];

export const notesAIChips = [
  { id: 'sum', label: 'Summarize notes' },
  { id: 'flash', label: 'Convert to flashcards' },
  { id: 'quiz', label: 'Generate quiz' },
  { id: 'keys', label: 'Extract key concepts' },
  { id: 'interview', label: 'Convert to interview answers' },
  { id: 'mockq', label: 'Generate mock questions' },
  { id: 'eli5', label: 'Explain like interviewer' },
];

export const notesAIInsight = {
  title: 'Note-taking pattern',
  recommendation:
    'Your recent notes are focused on React and system design. Consider taking the Frontend Architecture quiz next.',
  badge: 'Insight',
  ctaLabel: 'Open quizzes',
};

export const careerAITarget = {
  role: 'Frontend Developer',
  readinessScore: 73,
  strengths: ['HTML', 'CSS', 'React'],
  gaps: ['Testing', 'Performance', 'System design'],
  nextStep:
    'Complete the React Performance course and take one mock interview focused on component architecture.',
  roadmapMilestones: [
    { id: '1', label: 'Foundations', done: true },
    { id: '2', label: 'Depth', done: true },
    { id: '3', label: 'Interview ready', done: false },
    { id: '4', label: 'Offer', done: false },
  ],
};

/** Persistent “AI Career Engine” strip — all LMS routes */
export const lmsCareerEngine = {
  goalLabel: 'Frontend Developer',
  progressPct: 73,
  readinessStage: 'Interview Ready',
  nextAction: 'Practice React Performance Quiz',
  nextActionHref: '/lms/quizzes',
};

export const lmsDailyMomentum = {
  title: "Today's focus",
  items: [
    { id: 'quiz', text: 'Complete 1 quiz', optional: false as const },
    { id: 'weak', text: 'Review 1 weak topic', optional: false as const },
    { id: 'session', text: 'Attend 1 session (optional)', optional: true as const },
  ],
};

/** Cross-page intelligence copy (mock “memory”) */
export const lmsSharedIntelligence = {
  weakTopicSummary: 'System design & async patterns from quizzes + notes',
  notesToQuizzes: 'Last 3 notes mention React rendering → quiz queue updated',
  resumeToReadiness: 'Resume keyword gaps reduce interview readiness by ~6% (mock)',
  careerAdaptive:
    'Path auto-prioritizes weak topics from quizzes and highlights matching events.',
};

export const quizzesSkillHeatmap = [
  {
    topic: 'JavaScript',
    pct: 68,
    tier: 'building' as const,
    slug: 'javascript',
    hoverMistakes: 'Hoisting + microtask ordering',
    hoverSuggestion: 'Try the JavaScript essentials practice set',
  },
  {
    topic: 'React',
    pct: 74,
    tier: 'strong' as const,
    slug: 'react',
    hoverMistakes: 'Fewer misses on hooks',
    hoverSuggestion: 'Level up with React optimization quiz',
  },
  {
    topic: 'System design',
    pct: 42,
    tier: 'risk' as const,
    slug: 'system',
    hoverMistakes: 'Scalability & caching prompts',
    hoverSuggestion: 'Start system design warm-up + live workshop',
  },
  {
    topic: 'Behavioral',
    pct: 81,
    tier: 'strong' as const,
    slug: 'behavioral',
    hoverMistakes: 'STAR endings sometimes vague',
    hoverSuggestion: 'Generate HR question set',
  },
];

export const quizzesLastSessionFeedback = {
  improvementPct: 12,
  weakAreas: ['Async handling', 'Memoization'],
  nextQuizTitle: 'React optimization quiz',
  nextStepCta: 'Start practice (12 min)',
};

export const quizzesEngagement = {
  streakDays: 4,
  confidenceLabel: 'Medium → Improving',
};

export const notesLearningEngineOutput = {
  concepts: ['Closure scope rules', 'React render batching', 'Memoization trade-offs'],
  quizQuestions: [
    'When should you prefer useCallback vs inline handlers?',
    'Walk through a stale closure bug in a timer.',
  ],
  weakArea: 'Explaining async flow in interviews under time pressure',
};

export const notesSmartLinkDemo = {
  trigger: 'React rendering issue',
  related: [
    { label: 'React rendering quiz', href: '/lms/quizzes' },
    { label: 'Performance course', href: '/lms/courses' },
  ],
};

export const notesEmptyState = {
  title: 'Start your first note',
  body: 'Your notes feed quizzes, resume coaching, and career path priorities. In guided mode we estimate up to 30% better quiz targeting once notes exist.',
  cta: 'Create your first note',
};

export type NoteType = 'Interview Prep' | 'Learning Notes' | 'Company Research' | 'Salary Research';

/** Set to `false` to preview the empty-state UX locally. */
export const LMS_NOTES_SEED_ENABLED = true;

export const notesUserNotes: Array<{
  id: string;
  title: string;
  updated: string;
  type: NoteType;
}> = [
  { id: 'n1', title: 'Talking points for NovaTech screen', updated: '2 hours ago', type: 'Interview Prep' },
  { id: 'n2', title: 'Salary range research — senior IC', updated: 'Yesterday', type: 'Salary Research' },
  { id: 'n3', title: 'Questions to ask hiring manager', updated: 'Mar 18, 2026', type: 'Company Research' },
  { id: 'n4', title: 'Study list: system design', updated: 'Mar 15, 2026', type: 'Learning Notes' },
];

export const resumeRecruiterSimulation = {
  scanSeconds: 6,
  missingKeywords: ['Jest', 'React Testing Library', 'Web Vitals'],
  weakBullets: ['Led frontend work on dashboard', 'Improved performance'],
};

export const resumeJobMatch = {
  title: 'Frontend Engineer',
  company: 'XYZ Labs',
  score: 78,
  improve: ['Add testing keywords', 'Highlight performance work with metrics'],
};

export const resumeBeforeAfter = {
  before: 'Responsible for building UI components for the product team.',
  after:
    'Shipped 12 reusable UI primitives, cutting feature dev time ~18% and improving Lighthouse performance score from 72 → 91.',
};

export const resumeAtsRisks = [
  'Missing measurable impact on 2 bullets',
  'Summary reads generic — add role-specific hook',
];

export type CareerMissionStep = {
  id: string;
  label: string;
  href?: string;
};

export const CAREER_STEP_IDS = {
  javascriptQuiz: 'career-quiz-javascript',
  uiCraftCourse: 'career-course-ui-craft',
  reactQuiz: 'career-quiz-react',
  learningNote: 'career-note-learning',
  frontendReadinessCourse: 'career-course-frontend-readiness',
  mockInterview: 'career-mock-interview',
  systemDesignQuiz: 'career-quiz-system-design',
  resumeSync: 'career-resume-sync',
  salaryResearchNote: 'career-note-salary-research',
  negotiationEvent: 'career-event-negotiation',
  networkingEvent: 'career-event-networking',
} as const;

export const careerMissionRoadmap = [
  {
    id: 'p1',
    title: 'Phase 1 · Foundations',
    steps: [
      {
        id: CAREER_STEP_IDS.javascriptQuiz,
        label: 'Score 70%+ on the JavaScript essentials quiz',
        href: '/lms/quizzes/q1/attempt?skill=javascript',
      },
      {
        id: CAREER_STEP_IDS.uiCraftCourse,
        label: 'Finish the UI craft & accessibility course',
        href: '/lms/courses/c2',
      },
    ] satisfies CareerMissionStep[],
  },
  {
    id: 'p2',
    title: 'Phase 2 · Depth',
    steps: [
      {
        id: CAREER_STEP_IDS.reactQuiz,
        label: 'Complete the React & hooks quiz',
        href: '/lms/quizzes/q2/attempt?skill=react',
      },
      {
        id: CAREER_STEP_IDS.learningNote,
        label: 'Save a structured learning note',
        href: '/lms/notes/new?type=Learning%20Notes',
      },
      {
        id: CAREER_STEP_IDS.frontendReadinessCourse,
        label: 'Finish the Frontend interview readiness course',
        href: '/lms/courses/c1',
      },
    ] satisfies CareerMissionStep[],
  },
  {
    id: 'p3',
    title: 'Phase 3 · Interview ready',
    steps: [
      {
        id: CAREER_STEP_IDS.mockInterview,
        label: 'Complete 1 mock interview session',
        href: '/lms/interview-prep/mock-session?role=Frontend%20Developer&diff=Intermediate',
      },
      {
        id: CAREER_STEP_IDS.systemDesignQuiz,
        label: 'Score 60%+ on the system design quiz',
        href: '/lms/quizzes/q6/attempt?skill=system',
      },
      {
        id: CAREER_STEP_IDS.resumeSync,
        label: 'Save your resume and sync it to the career path',
        href: '/lms/resume-builder/editor',
      },
    ] satisfies CareerMissionStep[],
  },
  {
    id: 'p4',
    title: 'Phase 4 · Offer',
    steps: [
      {
        id: CAREER_STEP_IDS.salaryResearchNote,
        label: 'Create a salary research note',
        href: '/lms/notes/new?type=Salary%20Research',
      },
      {
        id: CAREER_STEP_IDS.negotiationEvent,
        label: 'Register for the negotiation office hours session',
        href: '/lms/events/evt-103',
      },
      {
        id: CAREER_STEP_IDS.networkingEvent,
        label: 'Register for a networking event',
        href: '/lms/events/evt-102',
      },
    ] satisfies CareerMissionStep[],
  },
] as const;

export const careerMissionSteps = careerMissionRoadmap.flatMap((phase) => phase.steps);
export const careerMissionStepIds = careerMissionSteps.map((step) => step.id);

export const careerMission = {
  headline: 'Mission: Become Frontend Developer',
  phases: [
    {
      id: 'p1',
      title: 'Phase 1 · Foundations',
      done: true,
      steps: ['Complete JavaScript quiz ≥ 70%', 'Finish HTML/CSS refresher module'],
    },
    {
      id: 'p2',
      title: 'Phase 2 · Depth',
      done: true,
      steps: ['Complete React quiz', 'Build 2 portfolio projects', 'Publish case study note'],
    },
    {
      id: 'p3',
      title: 'Phase 3 · Interview ready',
      done: false,
      steps: ['Practice 3 mock interviews', 'System design quiz ≥ 60%', 'Update resume for ATS'],
    },
    {
      id: 'p4',
      title: 'Phase 4 · Offer',
      done: false,
      steps: ['Salary research notes', 'Negotiation workshop', 'Reference prep'],
    },
  ],
  risk: {
    label: 'AI risk indicator',
    text: 'Low System Design score may affect interviews — path boosted related quizzes & events.',
  },
  timeline: [
    { week: 'Week 1', focus: 'JS fundamentals & closures' },
    { week: 'Week 2', focus: 'React depth + performance' },
    { week: 'Week 3', focus: 'Mock interviews + system design' },
  ],
  adaptiveCopy:
    'If quiz scores drop below 60% in any pillar, the roadmap re-orders modules and surfaces matching notes → quizzes → events automatically (mock behavior).',
};

export const lmsCrossPageFlowHint =
  'Flow: Notes → generate quiz → weak area drills → career path → events → resume refresh.';
