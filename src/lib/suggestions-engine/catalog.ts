/** Shared recommendation catalog — courses, links, keyword matching. */

export type CoursePick = {
  id: string;
  title: string;
  href: string;
  effectiveness: number;
  paid: boolean;
  reason: string;
  keywords: string[];
};

export const SUGGESTION_COURSE_CATALOG: CoursePick[] = [
  {
    id: 'c1',
    title: 'Frontend Interview Readiness',
    href: '/lms/courses/c1',
    effectiveness: 94,
    paid: true,
    reason: 'Best for React / frontend interview loops.',
    keywords: ['frontend', 'react', 'ui', 'javascript', 'typescript', 'developer', 'engineer'],
  },
  {
    id: 'c5',
    title: 'System Design Warm-up',
    href: '/lms/courses/c5',
    effectiveness: 91,
    paid: true,
    reason: 'Architecture & scale questions — high impact for senior roles.',
    keywords: ['backend', 'system', 'design', 'architect', 'senior', 'lead', 'java', 'node'],
  },
  {
    id: 'c4',
    title: 'Professional Communication',
    href: '/lms/courses/c4',
    effectiveness: 88,
    paid: true,
    reason: 'Behavioral & leadership presentation skills.',
    keywords: ['communication', 'behavioral', 'manager', 'lead', 'product', 'pm'],
  },
  {
    id: 'c2',
    title: 'UI Craft & Accessibility',
    href: '/lms/courses/c2',
    effectiveness: 90,
    paid: true,
    reason: 'Design-system depth for UI / product design tracks.',
    keywords: ['design', 'ux', 'ui', 'figma', 'product designer'],
  },
  {
    id: 'c3',
    title: 'Data Literacy for Product Roles',
    href: '/lms/courses/c3',
    effectiveness: 87,
    paid: true,
    reason: 'SQL & analytics signal for data-heavy roles.',
    keywords: ['data', 'analyst', 'analytics', 'sql', 'python', 'bi'],
  },
  {
    id: 'c6',
    title: 'Career Narrative Lab',
    href: '/lms/courses/c6',
    effectiveness: 86,
    paid: true,
    reason: 'Storytelling for graduates and career switchers.',
    keywords: ['career', 'narrative', 'story', 'graduate', 'fresher'],
  },
];

export function pickCoursesForText(text: string, limit = 2): Omit<CoursePick, 'keywords'>[] {
  const hay = text.toLowerCase();
  const scored = SUGGESTION_COURSE_CATALOG.map((course) => {
    const hits = course.keywords.filter((k) => hay.includes(k)).length;
    return { course, score: hits };
  });
  scored.sort(
    (a, b) =>
      b.score - a.score || b.course.effectiveness - a.course.effectiveness,
  );
  const matched = scored.filter((s) => s.score > 0).map((s) => s.course);
  const picks = (matched.length ? matched : SUGGESTION_COURSE_CATALOG).slice(0, limit);
  return picks.map(({ keywords: _k, ...rest }) => rest);
}
