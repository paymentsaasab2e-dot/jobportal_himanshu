'use client';

import Link from 'next/link';
import { ClipboardList, HelpCircle, RotateCcw } from 'lucide-react';
import { LMS_CARD_CLASS, LMS_CARD_INTERACTIVE } from '../constants';
import { LmsEmptyState } from '../components/states/LmsEmptyState';
import { LmsSkeleton } from '../components/states/LmsSkeleton';
import { LmsStatusBadge } from '../components/ux/LmsStatusBadge';
import { buildQuizAttemptHref, buildQuizPreviewHref, buildQuizResultHref, type QuizPreviewSource } from './quiz-utils';
import type { LmsQuizCatalogItem, LmsQuizDifficulty, LmsQuizSkill } from '../data/ai-mock';

export function difficultyBadge(difficulty: LmsQuizDifficulty) {
  const map = {
    Easy: 'bg-emerald-100 text-emerald-800',
    Medium: 'bg-amber-100 text-amber-800',
    Hard: 'bg-rose-100 text-rose-800',
  } as const;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[difficulty]}`}>
      {difficulty}
    </span>
  );
}

export function HeatmapBar({ pct, tier }: { pct: number; tier: 'strong' | 'building' | 'risk' }) {
  const segs = 10;
  const filled = Math.round((pct / 100) * segs);
  const empty = segs - filled;
  const fillClass =
    tier === 'strong' ? 'bg-emerald-500' : tier === 'building' ? 'bg-amber-500' : 'bg-rose-500';
  const trackClass = tier === 'strong' ? 'bg-emerald-100' : tier === 'building' ? 'bg-amber-100' : 'bg-rose-100';

  return (
    <div className="flex h-2.5 w-full max-w-[200px] gap-px overflow-hidden rounded-sm bg-gray-100" aria-hidden>
      {Array.from({ length: filled }).map((_, index) => (
        <div key={`filled-${index}`} className={`min-w-0 flex-1 ${fillClass}`} />
      ))}
      {Array.from({ length: empty }).map((_, index) => (
        <div key={`empty-${index}`} className={`min-w-0 flex-1 ${trackClass} opacity-60`} />
      ))}
    </div>
  );
}

export function LmsQuizzesPageFallback() {
  return (
    <div className={LMS_CARD_CLASS}>
      <LmsSkeleton lines={5} />
    </div>
  );
}

type QuizPreviewSectionProps = {
  quiz: LmsQuizCatalogItem | null;
  exists: boolean;
  previewSource: QuizPreviewSource | null;
  previewSkill: string | null;
  previewBackHref: string;
  previewAttempt?: { bestScore?: number } | null;
  previewQuestionCount: number;
  reasonLines: string[];
};

export function QuizPreviewSection({
  quiz,
  exists,
  previewSource,
  previewSkill,
  previewBackHref,
  previewAttempt,
  previewQuestionCount,
  reasonLines,
}: QuizPreviewSectionProps) {
  if (!quiz || !exists) {
    return (
      <section id="quiz-preview">
        <LmsEmptyState
          title="That quiz is not available right now"
          body="The selected quiz mapping is missing or unsupported. Choose another quiz from the grid below."
          action={
            <Link
              href={previewBackHref}
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            >
              Back to quizzes
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section id="quiz-preview" className="space-y-4">
      <div className={`${LMS_CARD_CLASS} border-sky-100 bg-sky-50/30`}>
        <div className="min-w-0 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
              {previewSource ? (
                <LmsStatusBadge
                  label={previewSource === 'recommended' ? 'AI recommended' : previewSource}
                  tone={previewSource === 'recommended' ? 'success' : 'info'}
                />
              ) : null}
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">{quiz.topic}</p>
            <p className="mt-3 text-sm font-normal leading-relaxed text-gray-600">{quiz.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {difficultyBadge(quiz.difficulty)}
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              <ClipboardList className="h-3.5 w-3.5" strokeWidth={2} />
              {previewQuestionCount} questions
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              {quiz.estMinutes} min
            </span>
            {previewAttempt?.bestScore != null ? (
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                Best score: {previewAttempt.bestScore}%
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.25fr,0.95fr]">
            <div>
              <p className="text-sm font-bold text-gray-900">Why this quiz?</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm font-normal text-gray-600">
                {reasonLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Weak areas addressed</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {quiz.weakConcepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href={buildQuizAttemptHref(quiz.id, previewSkill)}
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            >
              Start now
            </Link>
            {previewAttempt ? (
              <Link
                href={buildQuizResultHref(quiz.id, previewSkill)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
              >
                View latest result
              </Link>
            ) : null}
            <Link
              href={previewBackHref}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            >
              Back to quizzes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type RetryQuizCardProps = {
  quiz: LmsQuizCatalogItem & {
    skill: LmsQuizSkill;
    label: string;
    lastScore: number | null;
    reviewQuizId: string | null;
    reviewAvailable: boolean;
  };
  onOpen: (quizId: string, source: QuizPreviewSource, skill?: string | null) => void;
};

export function RetryQuizCard({ quiz, onOpen }: RetryQuizCardProps) {
  const previewHref = buildQuizPreviewHref(quiz.id, { skill: quiz.skill, source: 'retry' });

  return (
    <div
      className={LMS_CARD_INTERACTIVE}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(quiz.id, 'retry', quiz.skill)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(quiz.id, 'retry', quiz.skill);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-700">
          <RotateCcw className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">{quiz.title}</h2>
              <LmsStatusBadge label="Retry recommended" tone="warning" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{quiz.topic}</p>
            <p className="mt-1 text-sm text-gray-500">{quiz.label}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {difficultyBadge(quiz.difficulty)}
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              {quiz.questions} questions
            </span>
            {quiz.lastScore != null ? (
              <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                Based on last attempt: {quiz.lastScore}%
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {quiz.weakConcepts.slice(0, 3).map((concept) => (
              <span
                key={concept}
                className="rounded-full border border-rose-100 bg-white px-3 py-1 text-[11px] font-semibold text-gray-700"
              >
                {concept}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={previewHref}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            >
              Start targeted retry
            </Link>
            {quiz.reviewAvailable && quiz.reviewQuizId ? (
              <Link
                href={buildQuizResultHref(quiz.reviewQuizId, quiz.skill)}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
              >
                Review last mistakes
              </Link>
            ) : (
              <span className="inline-flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-500">
                No review available yet
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type QuizCatalogCardProps = {
  quiz: LmsQuizCatalogItem;
  bestScore?: number;
  skill: string | null;
  onOpen: (quizId: string, source: QuizPreviewSource, skill?: string | null) => void;
};

export function QuizCatalogCard({ quiz, bestScore, skill, onOpen }: QuizCatalogCardProps) {
  return (
    <div
      className={LMS_CARD_INTERACTIVE}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(quiz.id, 'catalog', skill)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(quiz.id, 'catalog', skill);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-violet-700">
          <HelpCircle className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-lg font-bold leading-snug text-gray-900">{quiz.title}</h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{quiz.topic}</p>
            <p className="mt-2 text-sm font-normal text-gray-600">{quiz.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {difficultyBadge(quiz.difficulty)}
            <span className="inline-flex items-center gap-1.5 text-sm font-normal text-gray-500">
              <ClipboardList className="h-4 w-4 text-gray-400" strokeWidth={2} />
              {quiz.questions} questions
            </span>
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              {quiz.estMinutes} min
            </span>
            {bestScore != null ? <span className="text-sm font-semibold text-emerald-700">Best: {bestScore}%</span> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen(quiz.id, 'catalog', skill);
              }}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            >
              Start practice
            </button>
            {bestScore != null ? (
              <Link
                href={buildQuizResultHref(quiz.id, skill)}
                onClick={(event) => event.stopPropagation()}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
              >
                View latest result
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
