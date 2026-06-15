'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Award, RotateCcw } from 'lucide-react';
import { LmsPageHeader } from '../components/LmsPageHeader';
import { LmsStatusBadge } from '../components/ux/LmsStatusBadge';
import { QuizPreviewSection } from './quiz-page-helpers';
import {
  buildQuizAttemptHref,
  buildQuizPreviewHref,
  formatQuizDifficulty,
  getQuizSkillLabel,
  normalizeQuizSkill,
  type QuizPreviewSource,
} from './quiz-utils';
import { fetchCompletedQuizzes, fetchQuizDetail } from '../api/client';
import { LmsSkeleton } from '../components/states/LmsSkeleton';
import { QuizTopicGenerator } from './components/QuizTopicGenerator';
import { LmsEmptyState } from '../components/states/LmsEmptyState';

type CompletedQuizItem = {
  id: string;
  title: string;
  description?: string;
  topic: string;
  topicLabel: string;
  questions: number;
  estMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  weakConcepts: string[];
  bestScore: number;
  latestScore: number;
  attemptCount: number;
  lastAttemptId: string | null;
  lastAttemptedDate: string | null;
};

type PreviewQuizItem = CompletedQuizItem;

function mapCompletedQuiz(q: any): CompletedQuizItem {
  return {
    id: q.id,
    title: q.title,
    description: q.description,
    topic: q.skillTags?.[0] || q.category || 'general',
    topicLabel: getQuizSkillLabel(q.skillTags?.[0] || q.category || 'general'),
    questions: q.questionsCount || 5,
    estMinutes: q.estimatedMinutes || 10,
    difficulty: formatQuizDifficulty(q.difficulty),
    weakConcepts: [],
    bestScore: Math.round(q.bestScore ?? q.latestScore ?? 0),
    latestScore: Math.round(q.latestScore ?? q.bestScore ?? 0),
    attemptCount: q.attemptCount ?? 1,
    lastAttemptId: q.lastAttemptId ?? null,
    lastAttemptedDate: q.lastAttemptedDate ?? null,
  };
}

function scoreTone(score: number): 'success' | 'warning' | 'neutral' {
  if (score >= 70) return 'success';
  if (score >= 50) return 'warning';
  return 'neutral';
}

function buildResultHref(quiz: CompletedQuizItem) {
  const params = new URLSearchParams();
  if (quiz.topic) params.set('skill', quiz.topic);
  if (quiz.lastAttemptId) params.set('attemptId', quiz.lastAttemptId);
  const query = params.toString();
  return `/lms/quizzes/${quiz.id}/result${query ? `?${query}` : ''}`;
}

function formatAttemptDate(value: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function LmsQuizzesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');
  const previewSource = (searchParams.get('source') as QuizPreviewSource | null) ?? null;
  const selectedSkill = normalizeQuizSkill(searchParams.get('skill'));

  const [completedQuizzes, setCompletedQuizzes] = useState<CompletedQuizItem[]>([]);
  const [previewQuiz, setPreviewQuiz] = useState<PreviewQuizItem | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCompletedQuizzes = useCallback(async () => {
    try {
      const data = await fetchCompletedQuizzes();
      setCompletedQuizzes((data || []).map(mapCompletedQuiz));
    } catch (err) {
      console.error(err);
      setCompletedQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompletedQuizzes();
  }, [loadCompletedQuizzes]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void loadCompletedQuizzes();
      }
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [loadCompletedQuizzes]);

  useEffect(() => {
    if (!previewId) {
      setPreviewQuiz(null);
      return;
    }

    const fromCompleted = completedQuizzes.find((quiz) => quiz.id === previewId);
    if (fromCompleted) {
      setPreviewQuiz(fromCompleted);
      return;
    }

    let active = true;
    void fetchQuizDetail(previewId).then((data) => {
      if (!active || !data) {
        if (active) setPreviewQuiz(null);
        return;
      }
      setPreviewQuiz(mapCompletedQuiz({ ...data, bestScore: 0, latestScore: 0, attemptCount: 0 }));
    });

    return () => {
      active = false;
    };
  }, [previewId, completedQuizzes]);

  const previewBackHref = '/lms/quizzes';
  const previewQuestionCount = previewQuiz ? previewQuiz.questions : 0;
  const previewAttempt = previewQuiz
    ? { bestScore: previewQuiz.bestScore > 0 ? previewQuiz.bestScore : undefined }
    : null;

  const openQuizPreview = (quizId: string, source: QuizPreviewSource, skill?: string | null) => {
    router.push(buildQuizPreviewHref(quizId, { skill, source }));
  };

  if (loading) return <div className="space-y-4"><LmsSkeleton lines={8} /></div>;

  return (
    <div className="space-y-10">
      <LmsPageHeader
        title="Quizzes"
        subtitle="Type a topic to get OpenAI suggestions, then generate 5 AI practice quizzes instantly."
      />

      {previewId ? (
        <QuizPreviewSection
          quiz={previewQuiz as any}
          exists={Boolean(previewQuiz)}
          previewSource={previewSource}
          previewSkill={selectedSkill}
          previewBackHref={previewBackHref}
          previewAttempt={previewAttempt}
          previewQuestionCount={previewQuestionCount}
          reasonLines={
            previewQuiz
              ? [
                  previewQuiz.description || `Practice quiz focused on ${previewQuiz.topicLabel}.`,
                  `${previewQuiz.questions} questions · ${previewQuiz.estMinutes} min estimated.`,
                ]
              : []
          }
        />
      ) : null}

      <QuizTopicGenerator />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Completed quizzes</h2>
          {completedQuizzes.length > 0 ? (
            <p className="text-sm text-gray-500">{completedQuizzes.length} completed</p>
          ) : null}
        </div>

        {completedQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {completedQuizzes.map((quiz) => {
              const attemptedOn = formatAttemptDate(quiz.lastAttemptedDate);
              const tone = scoreTone(quiz.bestScore);

              return (
                <div
                  key={quiz.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-gray-900">{quiz.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{quiz.description}</p>
                    </div>
                    <div
                      className={`shrink-0 rounded-2xl px-3 py-2 text-center ${
                        tone === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : tone === 'warning'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide">Best</p>
                      <p className="text-xl font-bold tabular-nums">{quiz.bestScore}%</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <LmsStatusBadge
                      label={`Latest: ${quiz.latestScore}%`}
                      tone={scoreTone(quiz.latestScore)}
                    />
                    <span className="text-xs font-medium text-gray-500">
                      {quiz.questions} questions · {quiz.estMinutes} min
                    </span>
                    {quiz.attemptCount > 1 ? (
                      <span className="text-xs font-medium text-gray-500">
                        {quiz.attemptCount} attempts
                      </span>
                    ) : null}
                    {attemptedOn ? (
                      <span className="text-xs font-medium text-gray-500">Completed {attemptedOn}</span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={buildResultHref(quiz)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                    >
                      <Award className="h-4 w-4" />
                      View result
                    </Link>
                    <Link
                      href={buildQuizAttemptHref(quiz.id, quiz.topic)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry quiz
                    </Link>
                    <button
                      type="button"
                      onClick={() => openQuizPreview(quiz.id, 'recent', quiz.topic)}
                      className="inline-flex items-center justify-center rounded-xl border border-transparent px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <LmsEmptyState
            title="No completed quizzes yet"
            body="Generate a quiz above, complete it, and your score will appear here."
          />
        )}
      </section>
    </div>
  );
}
