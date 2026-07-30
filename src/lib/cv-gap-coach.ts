export type CvGapCoachItem = {
  id: string;
  keyword: string;
  whyNeeded: string;
  askInUserLanguage: string;
  tip: string;
  /** Concepts/topics recruiters expect you can talk about for this skill. */
  conceptsLearned: string[];
  /** What JD/company screens usually need to shortlist you. */
  jdShortlistNeeds: string;
  applyTarget: 'skills' | 'experience' | 'summary';
};

type CoachPreset = Omit<CvGapCoachItem, 'id' | 'keyword'>;

const KEYWORD_COACH: Record<string, CoachPreset> = {
  jest: {
    whyNeeded:
      'Testing keywords prove you ship quality, not only features — a common ATS + interview filter.',
    askInUserLanguage:
      'In your own words: have you written or run automated tests? What broke, what did you check, and what got fixed?',
    tip: 'Mention the tool once plus one outcome (bugs caught, faster releases).',
    conceptsLearned: ['unit tests', 'mocks/spies', 'test runners', 'assertions', 'CI test gates'],
    jdShortlistNeeds:
      'JDs that say “strong testing culture” shortlist CVs that show Jest/RTL usage with a concrete quality outcome.',
    applyTarget: 'experience',
  },
  'react testing library': {
    whyNeeded: 'Shows you test UI the way users use it — a frequent frontend shortlist signal.',
    askInUserLanguage:
      'Did you ever test a screen or button the way a user clicks it? What were you trying to prove?',
    tip: 'Describe the user action and what “pass” looked like.',
    conceptsLearned: ['queries by role/text', 'user-event', 'async waits', 'accessibility-friendly tests'],
    jdShortlistNeeds:
      'Product companies shortlist candidates who write user-centric tests, not only snapshot/unit checks.',
    applyTarget: 'experience',
  },
  'web vitals': {
    whyNeeded: 'Performance metrics prove real-user speed awareness — strong for product JDs.',
    askInUserLanguage:
      'Did a page feel slow? What did you change, and how did it feel afterward?',
    tip: 'Even approximate outcomes help (“users stopped complaining”).',
    conceptsLearned: ['LCP', 'CLS', 'INP/FID', 'lazy loading', 'bundle size'],
    jdShortlistNeeds:
      'Roles mentioning performance/Core Web Vitals shortlist people who can name a metric and a fix.',
    applyTarget: 'experience',
  },
  typescript: {
    whyNeeded: 'TypeScript is a hard filter on many engineering JDs.',
    askInUserLanguage:
      'Have you used typed code? What mistakes did types help you catch earlier?',
    tip: 'Say what you typed (API responses, props, forms) and why it helped.',
    conceptsLearned: ['interfaces/types', 'generics basics', 'strict null checks', 'typing API responses'],
    jdShortlistNeeds:
      '“TypeScript required” JDs shortlist CVs that show typed React/Node work, not only JavaScript.',
    applyTarget: 'skills',
  },
  react: {
    whyNeeded: 'React is often a hard ATS filter — missing it can drop you before a human reads the CV.',
    askInUserLanguage:
      'What did you build with React? Who used it, and what problem did it solve? Which concepts did you actually use (state, forms, lists)?',
    tip: 'Name the feature plus concepts like useState/useEffect if you used them.',
    conceptsLearned: [
      'components & props',
      'useState / useEffect',
      'controlled forms',
      'conditional rendering',
      'lists & keys',
      'lifting state',
    ],
    jdShortlistNeeds:
      'Frontend JDs shortlist for React fluency: hooks, state, reusable components, and shipping UI for real users — not just “knows React” as a tag.',
    applyTarget: 'skills',
  },
  'react js': {
    whyNeeded: 'React.js is a primary shortlist keyword for UI roles.',
    askInUserLanguage:
      'Tell me what you learned in React.js — forms, state, API data on screen? What did you build?',
    tip: 'Include hooks/concepts you practiced, not only the library name.',
    conceptsLearned: [
      'JSX',
      'useState',
      'useEffect',
      'props vs state',
      'event handling',
      'component composition',
    ],
    jdShortlistNeeds:
      'Companies shortlist React.js candidates who can explain hooks and build interactive UI from a JD feature list.',
    applyTarget: 'skills',
  },
  'react.js': {
    whyNeeded: 'React.js is a primary shortlist keyword for UI roles.',
    askInUserLanguage:
      'Tell me what you learned in React.js — forms, state, API data on screen? What did you build?',
    tip: 'Include hooks/concepts you practiced, not only the library name.',
    conceptsLearned: [
      'JSX',
      'useState',
      'useEffect',
      'props vs state',
      'event handling',
      'component composition',
    ],
    jdShortlistNeeds:
      'Companies shortlist React.js candidates who can explain hooks and build interactive UI from a JD feature list.',
    applyTarget: 'skills',
  },
  javascript: {
    whyNeeded: 'JavaScript fundamentals still gatekeep most frontend shortlists.',
    askInUserLanguage:
      'What JS concepts did you use in a project — arrays, async/await, DOM, modules?',
    tip: 'Connect one concept to a real feature.',
    conceptsLearned: ['ES6+', 'async/await', 'array methods', 'closures basics', 'DOM events'],
    jdShortlistNeeds:
      'JDs asking for strong JS shortlist people who show problem-solving with language fundamentals, not only frameworks.',
    applyTarget: 'skills',
  },
  accessibility: {
    whyNeeded: 'Accessibility is increasingly required in enterprise JDs.',
    askInUserLanguage:
      'Did you improve keyboard use, labels, or contrast? What changed for users?',
    tip: 'Mention the barrier and the fix.',
    conceptsLearned: ['semantic HTML', 'ARIA labels', 'keyboard nav', 'contrast'],
    jdShortlistNeeds:
      'Inclusive-product JDs shortlist candidates who mention a11y work beyond visual design.',
    applyTarget: 'experience',
  },
  'system design': {
    whyNeeded: 'Shows architecture thinking for mid+ roles.',
    askInUserLanguage:
      'Have you designed how parts of an app talk (API, cache, DB)? Explain like to a friend.',
    tip: 'Problem → pieces → trade-off.',
    conceptsLearned: ['APIs', 'caching', 'data modeling', 'scalability trade-offs'],
    jdShortlistNeeds:
      'Senior/IC JDs shortlist for clear system boundaries and trade-off language.',
    applyTarget: 'summary',
  },
  leadership: {
    whyNeeded: 'Ownership language helps you pass hiring-manager skim.',
    askInUserLanguage:
      'Did you guide juniors, own a release, or decide when things were unclear?',
    tip: 'Decision + people impact.',
    conceptsLearned: ['mentoring', 'ownership', 'prioritization', 'stakeholder updates'],
    jdShortlistNeeds:
      'Lead/IC hybrid JDs shortlist for evidence of ownership, not only task completion.',
    applyTarget: 'experience',
  },
  sql: {
    whyNeeded: 'SQL appears in many fullstack and product-engineering postings.',
    askInUserLanguage:
      'Have you queried or cleaned data for a report, bug, or feature?',
    tip: 'Business question + what the query unlocked.',
    conceptsLearned: ['SELECT/JOIN', 'filters', 'aggregations', 'indexes awareness'],
    jdShortlistNeeds:
      'Data-aware roles shortlist CVs that show SQL used to answer a real product/business question.',
    applyTarget: 'experience',
  },
  python: {
    whyNeeded: 'Python is common for automation, data, and backend-adjacent work.',
    askInUserLanguage:
      'Did you automate something or build a small tool? What time did it save?',
    tip: 'Repetitive task + outcome.',
    conceptsLearned: ['scripts', 'APIs', 'data cleaning', 'automation'],
    jdShortlistNeeds:
      'Automation/data JDs shortlist practical Python outcomes over course certificates alone.',
    applyTarget: 'experience',
  },
  aws: {
    whyNeeded: 'Cloud keywords often gatekeep modern engineering shortlists.',
    askInUserLanguage:
      'Have you deployed or monitored anything on cloud? What went wrong and how did you recover?',
    tip: 'Service name + reliability outcome.',
    conceptsLearned: ['deployments', 'IAM basics', 'monitoring', 'storage/compute'],
    jdShortlistNeeds:
      'Cloud JDs shortlist hands-on service names plus an incident/recovery or deploy story.',
    applyTarget: 'skills',
  },
  docker: {
    whyNeeded: 'Containers show consistent environments across team machines/CI.',
    askInUserLanguage:
      'Did Docker help avoid “works on my machine”? What problem did packaging solve?',
    tip: 'Local setup or CI packaging.',
    conceptsLearned: ['images/containers', 'Dockerfile basics', 'local parity', 'CI packaging'],
    jdShortlistNeeds:
      'DevOps-flavored JDs shortlist Docker when tied to reproducible builds or onboarding speed.',
    applyTarget: 'experience',
  },
  figma: {
    whyNeeded: 'Helps match UI collaboration roles.',
    askInUserLanguage:
      'How did you use design files — handoff, spacing, catching mismatches?',
    tip: 'One handoff win.',
    conceptsLearned: ['design handoff', 'spacing/layout', 'component specs', 'feedback loops'],
    jdShortlistNeeds:
      'Design-collab JDs shortlist engineers who reduce redesign loops with Figma fluency.',
    applyTarget: 'experience',
  },
  nextjs: {
    whyNeeded: 'Next.js is a frequent requirement for modern React product teams.',
    askInUserLanguage:
      'Did you build pages/routing/API routes with Next.js? What shipped?',
    tip: 'Routing, SSR/SSG, or API route in plain words.',
    conceptsLearned: ['App/Pages router', 'SSR/SSG basics', 'API routes', 'image/perf patterns'],
    jdShortlistNeeds:
      'Next.js JDs shortlist for production app delivery (routing + rendering strategy), not course titles.',
    applyTarget: 'skills',
  },
  'next.js': {
    whyNeeded: 'Next.js is a frequent requirement for modern React product teams.',
    askInUserLanguage:
      'Did you build pages/routing/API routes with Next.js? What shipped?',
    tip: 'Routing, SSR/SSG, or API route in plain words.',
    conceptsLearned: ['App/Pages router', 'SSR/SSG basics', 'API routes', 'image/perf patterns'],
    jdShortlistNeeds:
      'Next.js JDs shortlist for production app delivery (routing + rendering strategy), not course titles.',
    applyTarget: 'skills',
  },
};

function normalizeSkillKey(keyword: string) {
  return keyword.trim().toLowerCase().replace(/\s+/g, ' ');
}

function defaultCoach(keyword: string): CoachPreset {
  return {
    whyNeeded: `“${keyword}” is missing from your CV. Roles that list it may skip you in ATS or human skim if you never wrote what you learned.`,
    askInUserLanguage: `In everyday language: what did you learn about “${keyword}”? Which concepts did you practice, and what did you build or fix with it?`,
    tip: 'Write concepts + a small story. We turn it into a skill write-up for shortlisting.',
    conceptsLearned: ['core concepts', 'practical usage', 'troubleshooting', 'project application'],
    jdShortlistNeeds: `Job descriptions asking for ${keyword} shortlist candidates who show learned concepts and applied outcomes — not only the keyword tag.`,
    applyTarget: 'skills',
  };
}

export function buildCvGapCoachItems(missingKeywords: string[]): CvGapCoachItem[] {
  return missingKeywords.slice(0, 8).map((keyword) => {
    const key = normalizeSkillKey(keyword);
    const preset =
      KEYWORD_COACH[key] ||
      KEYWORD_COACH[key.replace(/\.js$/i, '')] ||
      KEYWORD_COACH[`${key} js`] ||
      defaultCoach(keyword);
    return {
      id: `gap-${key.replace(/[^a-z0-9]+/g, '-')}`,
      keyword,
      ...preset,
    };
  });
}

export function buildExperienceCoachItems(input: {
  hasExperience: boolean;
  weakOrEmptyBullets: boolean;
  roleHint?: string;
}): CvGapCoachItem[] {
  const items: CvGapCoachItem[] = [];
  if (!input.hasExperience) {
    items.push({
      id: 'exp-first-role',
      keyword: 'Professional experience',
      whyNeeded:
        'Without at least one role story, recruiters cannot judge your impact. Internships, freelance, and college projects all count.',
      askInUserLanguage:
        'Tell me about any work you did — job, internship, freelance, or a project others used. What was your job in plain words, and what changed because of you?',
      tip: 'Include company/school name if you remember it, and one concrete result.',
      conceptsLearned: ['ownership', 'delivery', 'collaboration', 'outcomes'],
      jdShortlistNeeds:
        'Most JDs shortlist for proof of delivery in a real environment — even projects with users count.',
      applyTarget: 'experience',
    });
  } else if (input.weakOrEmptyBullets) {
    items.push({
      id: 'exp-strengthen-bullets',
      keyword: input.roleHint || 'Impact bullets',
      whyNeeded:
        'Your experience section needs clearer outcomes. Vague lines get skipped in a 6-second skim.',
      askInUserLanguage:
        'Pick one project you are proud of. Explain: what was missing, what you did, and how you knew it worked.',
      tip: 'Numbers help but are optional.',
      conceptsLearned: ['problem framing', 'actions taken', 'measurable or observable result'],
      jdShortlistNeeds:
        'Hiring managers shortlist impact stories that match JD responsibilities, not duty lists.',
      applyTarget: 'experience',
    });
  }
  return items;
}

function capitalize(text: string) {
  const t = text.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function cleanUserStory(raw: string): string {
  return String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
}

export type SkillWriteupContext = {
  userAnswer?: string;
  targetRole?: string;
  company?: string;
  jobDescriptionSnippet?: string;
};

/**
 * Local rich skill write-up: concepts learned + JD shortlist angle (not keyword-only).
 */
export function buildSkillWriteup(
  item: CvGapCoachItem,
  ctx: SkillWriteupContext = {},
): string {
  const concepts = item.conceptsLearned.slice(0, 5).join(', ');
  const story = cleanUserStory(ctx.userAnswer || '');
  const roleBit = ctx.targetRole
    ? `Aligned to ${ctx.targetRole}${ctx.company ? ` at ${ctx.company}` : ''} shortlists`
    : 'Aligned to common JD shortlist needs';

  let learnedLine = story
    ? capitalize(
        story
          .replace(/^(i|i'm|i am)\s+/i, '')
          .replace(/\bi\s+/gi, '')
          .replace(/\bmy\s+/gi, 'the '),
      )
    : `Hands-on with ${concepts}.`;

  if (!/[.!?]$/.test(learnedLine)) learnedLine += '.';

  return `${item.keyword}: Learned and applied ${concepts}. ${learnedLine} ${roleBit}: ${item.jdShortlistNeeds}`;
}

export function buildAiSkillCoachPrompt(
  item: CvGapCoachItem,
  ctx: SkillWriteupContext = {},
): string {
  return [
    `Write a resume SKILL write-up for "${item.keyword}" (NOT just the keyword name).`,
    `Include: (1) what was learned / concepts, (2) how it was applied, (3) why companies/JDs shortlist for it.`,
    `Concepts to cover if relevant: ${item.conceptsLearned.join(', ')}.`,
    `JD shortlist angle: ${item.jdShortlistNeeds}`,
    ctx.targetRole ? `Target role: ${ctx.targetRole}` : '',
    ctx.company ? `Company: ${ctx.company}` : '',
    ctx.jobDescriptionSnippet
      ? `Job description signals: ${ctx.jobDescriptionSnippet.slice(0, 500)}`
      : '',
    ctx.userAnswer
      ? `Candidate's own words (reframe professionally, keep truth): ${ctx.userAnswer}`
      : 'Candidate did not add personal story yet — write a credible learning-focused skill line they can edit.',
    'Return 1-3 dense sentences. No markdown. No bullet list. Do not invent fake company names or fake metrics.',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Turns casual user language into a resume-ready framed line (does not auto-apply).
 */
export function frameUserExperienceAnswer(
  userAnswer: string,
  item: Pick<CvGapCoachItem, 'keyword' | 'applyTarget' | 'conceptsLearned' | 'jdShortlistNeeds'>,
): { framed: string; skillWriteup?: string } {
  const story = cleanUserStory(userAnswer);
  if (!story && item.applyTarget === 'skills') {
    return {
      framed: '',
      skillWriteup: buildSkillWriteup(item as CvGapCoachItem, {}),
    };
  }
  if (!story) {
    return { framed: '' };
  }

  let body = story
    .replace(/^(i|i'm|i am)\s+/i, '')
    .replace(/\bi\s+/gi, '')
    .replace(/\bmy\s+/gi, 'the ')
    .replace(/\bdon't\b/gi, 'do not')
    .replace(/\bcant\b/gi, 'cannot');

  if (
    !/^(built|shipped|led|owned|designed|improved|reduced|increased|created|developed|implemented|automated|tested|deployed|collaborated|delivered|optimized|fixed|resolved|launched|learned)/i.test(
      body,
    )
  ) {
    if (/test|qa|bug|jest|rtl/i.test(body) || /test/i.test(item.keyword)) {
      body = `Validated quality by ${body}`;
    } else if (/slow|performance|vitals|load|speed/i.test(body)) {
      body = `Improved performance by ${body}`;
    } else if (/learn|concept|hook|usestate|useeffect/i.test(body)) {
      body = `Applied concepts by ${body}`;
    } else if (/team|mentor|lead|junior/i.test(body)) {
      body = `Owned delivery by ${body}`;
    } else {
      body = `Delivered impact by ${body}`;
    }
  }

  body = capitalize(body);
  if (!/[.!?]$/.test(body)) body += '.';

  const keyword = item.keyword.trim();
  const alreadyMentions =
    keyword.length > 0 && body.toLowerCase().includes(keyword.toLowerCase());
  if (
    !alreadyMentions &&
    item.applyTarget !== 'skills' &&
    keyword &&
    !/professional experience|impact bullets/i.test(keyword)
  ) {
    body = body.replace(/\.$/, '') + ` (using ${keyword}).`;
  }

  if (item.applyTarget === 'skills') {
    return {
      framed: body,
      skillWriteup: buildSkillWriteup(item as CvGapCoachItem, { userAnswer: story }),
    };
  }

  if (item.applyTarget === 'summary') {
    return { framed: body };
  }

  return { framed: `- ${body}` };
}

/** Append a skill write-up into the skills text without collapsing to a bare keyword. */
export function mergeSkillWriteup(existingSkills: string, writeup: string): string {
  const next = writeup.trim();
  if (!next) return existingSkills;
  const current = existingSkills.trim();
  if (!current) return next;
  // If only a bare keyword exists, replace that keyword line/token with the write-up
  const keyword = next.split(':')[0]?.trim();
  if (keyword) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const bareOnly = new RegExp(`(^|,\\s*|\\n)${escaped}(?=,|\\n|$)`, 'i');
    if (bareOnly.test(current) && !current.toLowerCase().includes(`${keyword.toLowerCase()}:`)) {
      return current.replace(bareOnly, (_m, prefix: string) => `${prefix}${next}`);
    }
    if (current.toLowerCase().includes(next.toLowerCase())) return current;
  }
  return `${current}\n${next}`;
}
