import {
  lmsNormalizeQuizSkill,
  lmsQuizBank,
  lmsQuizCatalogById,
  lmsQuizIdForSkill,
  lmsQuizSkillLabel,
  lmsQuizSkillMeta,
  type LmsQuizCatalogItem,
  type LmsQuizSkill,
} from '../data/ai-mock';

export type QuizPreviewSource = 'recommended' | 'retry' | 'catalog' | 'skill' | 'mastery' | 'recent' | 'result';

function withHash(path: string, hash?: string) {
  if (!hash) return path;
  return `${path}${hash.startsWith('#') ? hash : `#${hash}`}`;
}

export function getQuizCatalogItem(quizId: string): LmsQuizCatalogItem | null {
  return lmsQuizCatalogById[quizId] ?? null;
}

export function normalizeQuizSkill(skill: string | null | undefined): LmsQuizSkill | null {
  return lmsNormalizeQuizSkill(skill);
}

export function getQuizSkillLabel(skill: string | null | undefined) {
  return lmsQuizSkillLabel(skill);
}

export function getQuizSkillMeta(skill: string | null | undefined) {
  const normalized = lmsNormalizeQuizSkill(skill);
  return normalized ? lmsQuizSkillMeta[normalized] : null;
}

export function buildQuizAttemptHref(quizId: string, skill?: string | null) {
  const params = new URLSearchParams();
  const normalizedSkill = lmsNormalizeQuizSkill(skill);
  if (normalizedSkill) params.set('skill', normalizedSkill);
  const query = params.toString();
  return `/lms/quizzes/${quizId}/attempt${query ? `?${query}` : ''}`;
}

export function buildQuizResultHref(quizId: string, skill?: string | null) {
  const params = new URLSearchParams();
  const normalizedSkill = lmsNormalizeQuizSkill(skill);
  if (normalizedSkill) params.set('skill', normalizedSkill);
  const query = params.toString();
  return `/lms/quizzes/${quizId}/result${query ? `?${query}` : ''}`;
}

export function buildQuizPreviewHref(
  quizId: string,
  options?: {
    skill?: string | null;
    source?: QuizPreviewSource;
  }
) {
  const params = new URLSearchParams();
  params.set('preview', quizId);
  const normalizedSkill = lmsNormalizeQuizSkill(options?.skill ?? lmsQuizBank[quizId]?.skill ?? null);
  if (normalizedSkill) params.set('skill', normalizedSkill);
  if (options?.source) params.set('source', options.source);
  return withHash(`/lms/quizzes?${params.toString()}`, 'quiz-preview');
}

export function buildSkillFocusHref(skill: string | null | undefined) {
  const normalizedSkill = lmsNormalizeQuizSkill(skill);
  if (!normalizedSkill) return '/lms/quizzes';
  return withHash(`/lms/quizzes?skill=${encodeURIComponent(normalizedSkill)}`, 'skill-focus');
}

export function buildSuggestedLessonsHref(input: { skill?: string | null; quizId?: string | null }) {
  const normalizedSkill =
    lmsNormalizeQuizSkill(input.skill) ??
    lmsNormalizeQuizSkill(input.quizId ? lmsQuizBank[input.quizId]?.skill : null);
  const fallbackQuizId = input.quizId && lmsQuizCatalogById[input.quizId] ? input.quizId : normalizedSkill ? lmsQuizIdForSkill(normalizedSkill) : 'q2';
  const quiz = lmsQuizCatalogById[fallbackQuizId];
  const skillMeta = normalizedSkill ? lmsQuizSkillMeta[normalizedSkill] : null;
  const params = new URLSearchParams();

  if (quiz?.courseFocus) params.set('focus', quiz.courseFocus);
  if (skillMeta?.label) params.set('topic', skillMeta.label);
  if (quiz?.recommendedCourseId) params.set('recommendedCourseId', quiz.recommendedCourseId);
  params.set('from', 'quizzes');

  const query = params.toString();
  return `/lms/courses${query ? `?${query}` : ''}`;
}

export function getRelatedPracticeQuizId(quizId: string) {
  const catalog = lmsQuizCatalogById[quizId];
  if (!catalog) return null;

  const related = catalog.relatedQuizIds.find((candidateId) => candidateId !== quizId && candidateId in lmsQuizCatalogById);
  if (related) return related;

  const currentSkill = lmsQuizBank[quizId]?.skill;
  if (!currentSkill) return null;

  const fallback = Object.keys(lmsQuizCatalogById).find(
    (candidateId) => candidateId !== quizId && lmsQuizBank[candidateId]?.skill === currentSkill
  );
  return fallback ?? null;
}

export function formatDurationLabel(durationSec: number | null | undefined) {
  if (durationSec == null || Number.isNaN(durationSec)) return null;
  if (durationSec < 60) return `${Math.max(1, Math.round(durationSec))} sec`;
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
}

export function scoreInsight(score: number) {
  if (score >= 85) return 'Strong signal - keep stretching with harder follow-up sets.';
  if (score >= 70) return 'Solid progress - one targeted drill should keep momentum up.';
  if (score >= 50) return 'Mixed understanding - focus on missed concepts before the next attempt.';
  return 'High-priority review area - start with a guided retry and suggested lesson.';
}
