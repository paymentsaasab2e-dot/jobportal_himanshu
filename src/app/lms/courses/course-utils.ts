import type { LmsCourseModule } from '../data/ai-mock';

export type FlatCourseLesson = {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  estMin: number;
};

export function flattenCourseLessons(modules: LmsCourseModule[]): FlatCourseLesson[] {
  const out: FlatCourseLesson[] = [];
  for (const m of modules) {
    for (const l of m.lessons) {
      out.push({
        moduleId: m.id,
        moduleTitle: m.title,
        lessonId: l.id,
        lessonTitle: l.title,
        estMin: l.estMin,
      });
    }
  }
  return out;
}

export function parseDurationToMinutes(raw: string) {
  const v = raw.trim().toLowerCase();
  if (v.endsWith('h')) {
    const n = Number(v.replace('h', ''));
    if (!Number.isNaN(n)) return Math.round(n * 60);
  }
  if (v.endsWith('m')) {
    const n = Number(v.replace('m', ''));
    if (!Number.isNaN(n)) return Math.round(n);
  }
  const n = Number(v);
  if (!Number.isNaN(n)) return Math.round(n);
  return 0;
}

export function normalizePct(p: number | null | undefined) {
  const n = typeof p === 'number' ? p : 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function courseStatusFromPct(pct: number): 'not_started' | 'in_progress' | 'completed' {
  if (pct >= 100) return 'completed';
  if (pct > 0) return 'in_progress';
  return 'not_started';
}

