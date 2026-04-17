import type { InterviewPrepData } from '../types/interview.types';

export const interviewData: InterviewPrepData = {
  goal: 'Frontend Developer',
  readiness: 73,
  nextAction: 'Practice React Performance Interview',

  todayFocus: ['Complete 1 quiz', 'Review 1 weak topic', 'Attend 1 session'],

  feedback: {
    strengths: ['Clear structure in answers', 'Good use of examples', 'Calm pacing'],
    improvements: ['Deep dives on trade-offs', 'Estimation under time pressure'],
  },

  revisionTopics: [
    { id: 'rev-1', title: 'Caching strategies & CDN edge cases', type: 'technical' },
    { id: 'rev-2', title: 'React concurrent features', type: 'technical' },
    { id: 'rev-3', title: 'Behavioral outcomes storytelling', type: 'behavioral' },
    { id: 'rev-4', title: 'System boundary design', type: 'system' },
  ],

  confidenceScore: 72,

  scores: {
    overall: 73,
    technical: 76,
    behavioral: 81,
    systemDesign: 58,
    communication: 74,
  },

  aiInsight:
    'Connected (mock): System design + async patterns detected from notes — prioritize scalability drills before your next UI screen.',

  questionGenerator: [
    {
      id: 'hr',
      title: 'HR questions',
      description: 'Behavioral prompts tailored to your saved target companies (mock).',
    },
    {
      id: 'technical',
      title: 'Technical questions',
      description: 'Language and framework drills matched to your resume stack.',
    },
    {
      id: 'system',
      title: 'System design',
      description: 'Scenario cards with hints and follow-up questions.',
    },
    {
      id: 'company',
      title: 'Company-specific',
      description: 'Culture and product questions using public signals only (mock).',
    },
  ],

  questionBank: [
    {
      title: 'HR',
      description: 'Behavioral prompts, culture fit, and salary conversations.',
      count: '120+ prompts',
    },
    {
      title: 'Technical',
      description: 'Language fundamentals, debugging stories, and code walkthroughs.',
      count: '200+ prompts',
    },
    {
      title: 'System design',
      description: 'High-level architecture, trade-offs, and scaling discussions.',
      count: '45+ scenarios',
    },
  ],

  suggestedCompanies: ['Stripe', 'Notion', 'Figma', 'Linear', 'Vercel'],
};

export const mockInterviewDifficulties = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const mockInterviewRoles = [
  'UI Engineer',
  'Frontend Developer',
  'Full-stack Engineer',
  'Product Designer (tech)',
] as const;

import type { MockQuestion, CompanyInfo } from '../types/interview.types';

export const mockCompanyResearch: Record<string, CompanyInfo> = {
  stripe: {
    slug: 'stripe',
    name: 'Stripe',
    overview: 'Financial infrastructure platform focused on API-first developer experience.',
    culture: ['Operating with extreme rigor', 'Clear, precise written communication', 'Developer-first thinking'],
    productTopics: ['Payment gateways', 'Idempotency', 'Dashboard performance', 'Micro-frontends'],
    sampleQuestions: [
      {
        id: 'c1',
        category: 'behavioral',
        prompt: 'Tell me about a time you had to write a highly reliable piece of code. What was at stake?',
        hint: 'Focus on error handling, retries, and defensive programming.',
        followUp: ['How did you test it?', 'What happened when failures occurred?'],
        difficulty: 'Intermediate',
        rubric: 'Looking for a culture of rigor and ownership.'
      }
    ],
    revisionTips: ['Revise idempotency keys', 'Study their API design principles', 'Prepare to write clean, bug-free code over fast hacks']
  },
  notion: {
    slug: 'notion',
    name: 'Notion',
    overview: 'All-in-one workspace blending notes, docs, and project management.',
    culture: ['Craft and polish', 'Ownership of end-to-end features', 'Design sensibility'],
    productTopics: ['Rich text editing (contenteditable)', 'CRDTs for real-time sync', 'Virtualization for large lists', 'Drag-and-drop'],
    sampleQuestions: [
      {
        id: 'c2',
        category: 'technical',
        prompt: 'How would you build a rich text editor from scratch? What are the biggest performance bottlenecks?',
        hint: 'Mention range selection, AST representation, and DOM manipulation.',
        followUp: ['How do you handle real-time collaboration?'],
        difficulty: 'Advanced',
        rubric: 'Looking for deep DOM knowledge and architecture.'
      }
    ],
    revisionTips: ['Study Contenteditable quirks', 'Revise React performance profiling', 'Understand local-first data models']
  },
  figma: {
    slug: 'figma',
    name: 'Figma',
    overview: 'Collaborative design platform known for multiplayer editing and design-system workflows.',
    culture: ['Craft with speed', 'Cross-functional product thinking', 'Strong user empathy'],
    productTopics: ['Realtime collaboration', 'Canvas rendering', 'Design systems', 'Plugin ecosystems'],
    sampleQuestions: [
      {
        id: 'c3',
        category: 'technical',
        prompt: 'How would you keep a large collaborative design canvas responsive while many users are editing at once?',
        hint: 'Talk through rendering strategy, optimistic updates, and local-first constraints.',
        followUp: ['What would you virtualize first?', 'How would you debug cross-client desync?'],
        difficulty: 'Advanced',
        rubric: 'Looking for UI performance depth plus multiplayer systems awareness.',
      },
    ],
    revisionTips: ['Practice canvas performance trade-offs', 'Review realtime state synchronization', 'Prepare examples of design-system ownership'],
  },
  linear: {
    slug: 'linear',
    name: 'Linear',
    overview: 'Issue tracking product focused on speed, polish, and high-signal product execution.',
    culture: ['Polish matters', 'Thoughtful product trade-offs', 'Fast, focused execution'],
    productTopics: ['Perceived performance', 'Keyboard-first workflows', 'List virtualization', 'Offline-friendly UX'],
    sampleQuestions: [
      {
        id: 'c4',
        category: 'behavioral',
        prompt: 'Tell me about a time you made a product feel faster without changing the backend response time.',
        hint: 'Focus on UX framing, loading states, optimistic UI, and instrumentation.',
        followUp: ['How did you measure the impact?', 'What trade-offs did you make?'],
        difficulty: 'Intermediate',
        rubric: 'Looking for product taste, performance intuition, and measurable outcomes.',
      },
    ],
    revisionTips: ['Study perceived-performance patterns', 'Revise keyboard accessibility', 'Prepare stories about shipping polished details'],
  },
  vercel: {
    slug: 'vercel',
    name: 'Vercel',
    overview: 'Frontend cloud platform centered on developer experience, performance, and modern web tooling.',
    culture: ['Developer-first clarity', 'High leverage tooling', 'Strong performance standards'],
    productTopics: ['Edge rendering', 'Build pipelines', 'Observability for frontend teams', 'Performance budgets'],
    sampleQuestions: [
      {
        id: 'c5',
        category: 'system',
        prompt: 'How would you explain the trade-offs between edge rendering and server rendering for a high-traffic marketing site?',
        hint: 'Cover caching, personalization, cold starts, and debugging complexity.',
        followUp: ['When would static generation still win?', 'How would you monitor regressions?'],
        difficulty: 'Advanced',
        rubric: 'Looking for platform trade-off thinking grounded in frontend performance.',
      },
    ],
    revisionTips: ['Review caching hierarchies', 'Practice explaining rendering strategies clearly', 'Prepare frontend performance stories with metrics'],
  }
};

export const generateMockQuestions = (kind: string): MockQuestion[] => {
  const isSys = kind === 'system';
  const isHr = kind === 'hr';
  const isCompany = kind === 'company';
  
  if (isSys) {
    return [
      {
        id: `q-${Date.now()}-1`, category: 'system', prompt: 'Design the frontend for a real-time collaborative document editor like Google Docs.',
        hint: 'Think about state management, network synchronization (WebSockets), and conflict resolution.',
        followUp: ['How do you handle offline mode?', 'How would you scale this for 100+ concurrent users typing?'],
        difficulty: 'Advanced', rubric: 'Clear separation of UI state, network layer, and data conflict resolution.'
      },
      {
        id: `q-${Date.now()}-2`, category: 'system', prompt: 'Design a high-performance news feed for a mobile-first web app.',
        hint: 'Consider infinite scrolling, virtual lists, media loading, and caching.',
        followUp: ['What if the user loses connectivity?', 'How do you prevent memory leaks over time?'],
        difficulty: 'Intermediate', rubric: 'Usage of virtualization, Intersection Observer, and efficient image loading.'
      }
    ];
  }
  
  if (isHr) {
    return [
      {
        id: `q-${Date.now()}-1`, category: 'hr', prompt: 'Tell me about a time you strongly disagreed with a product manager on a feature design.',
        hint: 'Use the STAR format. Emphasize data, user empathy, and compromise rather than just being right.',
        followUp: ['What was the final outcome?', 'How did it affect your working relationship?'],
        difficulty: 'Beginner', rubric: 'Shows maturity, communication skills, and focus on business goals.'
      },
      {
        id: `q-${Date.now()}-2`, category: 'hr', prompt: 'Describe a project that failed or missed its deadline. Why, and what did you learn?',
        hint: 'Pick a real failure, take accountability, and focus heavily on the learning and process improvements.',
        followUp: ['Would you do anything differently today?', 'How did stakeholders react?'],
        difficulty: 'Intermediate', rubric: 'Looking for extreme ownership, not blaming tools or team members.'
      }
    ];
  }

  if (isCompany) {
    return [
      {
        id: `q-${Date.now()}-1`, category: 'company', prompt: 'Why do you want to work at our company compared to a larger competitor?',
        hint: 'Focus on mission alignment, culture of impact, and a specific feature you admire.',
        followUp: ['What is one thing you think we can improve?'],
        difficulty: 'Intermediate', rubric: 'Shows genuine research and excitement rather than generic copy-paste answers.'
      }
    ];
  }

  // Technical default
  return [
    {
      id: `q-${Date.now()}-1`, category: 'technical', prompt: 'Explain the React rendering lifecycle and specifically how Concurrent Mode changes it.',
      hint: 'Differentiate between render phase and commit phase. Mention interruptible rendering.',
      followUp: ['When would you use useTransition or useDeferredValue?'],
      difficulty: 'Advanced', rubric: 'Accurate understanding of React fiber, interruptibility, and avoiding UI blocking.'
    },
    {
      id: `q-${Date.now()}-2`, category: 'technical', prompt: 'How do you handle authentication in a Next.js App Router application?',
      hint: 'Mention Server Actions, Middleware bounds, and HTTP-only cookies.',
      followUp: ['What are the security risks of storing tokens in localStorage?'],
      difficulty: 'Intermediate', rubric: 'Understands SSR security, middleware routing, and cookie handling.'
    }
  ];
};
