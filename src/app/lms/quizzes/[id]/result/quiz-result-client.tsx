"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { LMS_CARD_CLASS } from "../../../constants";
import { lmsQuizBank } from "../../../data/ai-mock";
import { LmsStatusBadge } from "../../../components/ux/LmsStatusBadge";
import { useLmsState } from "../../../state/LmsStateProvider";
import { useLmsToast } from "../../../components/ux/LmsToastProvider";
import {
  buildQuizPreviewHref,
  buildSuggestedLessonsHref,
  formatDurationLabel,
  getQuizCatalogItem,
  getQuizSkillLabel,
  scoreInsight,
} from "../../quiz-utils";

type StoredAttempt = {
  quizId: string;
  answers: Record<string, number>;
  score?: number;
  durationSec?: number;
  startedAt?: number;
  completedAt?: number;
};

const noopSubscribe = () => () => {};

function storageKey(quizId: string) {
  return `lmsQuizAttempt:${quizId}`;
}

function readStoredAttemptRaw(quizId: string) {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(storageKey(quizId));
  } catch {
    return null;
  }
}

export function QuizResultClient({ quizId }: { quizId: string }) {
  const search = useSearchParams();
  const durationFromUrl = Number(search.get("duration") ?? "0");
  const skillFromUrl = search.get("skill");
  const quiz = lmsQuizBank[quizId];
  const quizMeta = getQuizCatalogItem(quizId);
  const toast = useLmsToast();
  const { state, addPlannedItem } = useLmsState();
  const isLoaded = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const attemptRaw = useSyncExternalStore(
    noopSubscribe,
    () => readStoredAttemptRaw(quizId),
    () => null
  );
  const attempt = useMemo(() => {
    if (!attemptRaw) return null;
    try {
      const parsed = JSON.parse(attemptRaw) as StoredAttempt;
      return parsed?.quizId === quizId ? parsed : null;
    } catch {
      return null;
    }
  }, [attemptRaw, quizId]);

  const attemptSummary = state.quizAttempts[quizId];
  const score = attemptSummary?.score ?? attempt?.score ?? 0;
  const questions = useMemo(() => quiz?.questions ?? [], [quiz]);
  const topicLabel = getQuizSkillLabel(skillFromUrl ?? quiz?.skill ?? null) ?? quizMeta?.topic ?? "Quiz";
  const durationSec = durationFromUrl || attemptSummary?.durationSec || attempt?.durationSec || 0;
  const formattedDuration = formatDurationLabel(durationSec);
  const completedAt = attemptSummary?.completedAt ?? attempt?.completedAt ?? null;
  const relatedQuizId = quizMeta?.relatedQuizIds.find((candidateId) => candidateId in lmsQuizBank) ?? null;

  const breakdown = useMemo(() => {
    const answers = attempt?.answers ?? {};
    const rows = questions.map((q) => {
      const chosen = answers[q.id];
      const ok = chosen === q.correctIndex;
      return { q, chosen, ok };
    });
    const correct = rows.filter((r) => r.ok).length;
    return { rows, correct };
  }, [attempt?.answers, questions]);

  const weakPrompts = breakdown.rows
    .filter((row) => !row.ok)
    .map((row) => row.q.prompt)
    .slice(0, 3);

  if (!isLoaded) return null;

  if (!quiz || !attempt) {
    return (
      <div className="space-y-8 pb-8">
        <div className="min-w-0">
          <Link
            href="/lms/quizzes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to quizzes
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border border-gray-100 rounded-3xl">
          <p className="text-gray-500 font-medium">
            Session attempt could not be verified or the quiz does not exist.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href={buildQuizPreviewHref(quizId, { skill: skillFromUrl, source: "result" })}
              className="inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50"
            >
              Reopen quiz details
            </Link>
            <Link
              href="/lms/quizzes"
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#208bc0]"
            >
              Back to quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${LMS_CARD_CLASS} border-violet-100 bg-violet-50/20`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Award
              className="h-5 w-5 text-violet-700 mt-0.5"
              strokeWidth={2}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Result summary
              </p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {quiz.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>{topicLabel}</span>
                <span className="text-gray-300">-</span>
                <span>{breakdown.correct} / {questions.length} correct</span>
                {formattedDuration ? (
                  <>
                    <span className="text-gray-300">-</span>
                    <span>{formattedDuration}</span>
                  </>
                ) : null}
                {completedAt ? (
                  <>
                    <span className="text-gray-300">-</span>
                    <span>{new Date(completedAt).toLocaleString()}</span>
                  </>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-3xl font-bold text-gray-900">{score}%</span>
                <LmsStatusBadge
                  label={score >= 70 ? "Ready to build on" : "Needs another drill"}
                  tone={score >= 70 ? "success" : "warning"}
                />
                {typeof attemptSummary?.bestScore === "number" ? (
                  <span className="rounded-full border border-violet-100 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                    Best score: {attemptSummary.bestScore}%
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-gray-700">{scoreInsight(score)}</p>
              {weakPrompts.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {weakPrompts.map((prompt) => (
                    <span
                      key={prompt}
                      className="rounded-full border border-violet-100 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
                    >
                      {prompt}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <Link
            href={buildQuizPreviewHref(quizId, { skill: skillFromUrl ?? quiz.skill, source: "result" })}
            className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
          >
            Retry quiz
          </Link>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <a
            href="#review"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
          >
            Review answers
          </a>
          <Link
            href={`/lms/quizzes?skill=${encodeURIComponent(quiz.skill)}#retry-weak-topics`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition-all duration-200 hover:bg-amber-100"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Retry weak topics
          </Link>
          {relatedQuizId ? (
            <Link
              href={buildQuizPreviewHref(relatedQuizId, {
                skill: lmsQuizBank[relatedQuizId]?.skill ?? quiz.skill,
                source: "result",
              })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#28A8E1]/20 bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-95 hover:shadow-md"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
              Practice related quiz
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
            >
              Practice related quiz
            </button>
          )}
          <Link
            href={buildSuggestedLessonsHref({ quizId, skill: quiz.skill })}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-900 transition-all duration-200 hover:bg-violet-100"
          >
            <BookOpen className="h-4 w-4" strokeWidth={2} />
            View suggested lessons
          </Link>
        </div>
      </div>

      <div className="space-y-3" id="review">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Review answers
        </h2>
        <ul className="space-y-3">
          {breakdown.rows.map(({ q, chosen, ok }) => (
            <li
              key={q.id}
              className={`${LMS_CARD_CLASS} ${
                ok ? "border-emerald-100" : "border-rose-100"
              }`}
            >
              <div className="flex items-start gap-3">
                {ok ? (
                  <CheckCircle2
                    className="h-5 w-5 text-emerald-700 mt-0.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : (
                  <XCircle
                    className="h-5 w-5 text-rose-700 mt-0.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">{q.prompt}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    Your answer:{" "}
                    <span
                      className={`font-semibold ${
                        ok ? "text-emerald-800" : "text-rose-800"
                      }`}
                    >
                      {chosen != null ? q.options[chosen] : "Not answered"}
                    </span>
                  </p>
                  {!ok ? (
                    <p className="mt-1 text-sm text-gray-600">
                      Correct:{" "}
                      <span className="font-semibold text-emerald-800">
                        {q.options[q.correctIndex]}
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm font-normal text-gray-500">
                    {q.explanation}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className={`${LMS_CARD_CLASS} border-violet-100 bg-violet-50/20 space-y-4`}>
        <div className="flex items-start gap-3">
          <Sparkles
            className="h-5 w-5 text-violet-700 mt-0.5"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">Next steps</p>
            <p className="mt-1 text-sm font-normal text-gray-600">
              Keep the follow-up tight: review the weak concepts, run one more
              targeted quiz, and reinforce it with a suggested lesson.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={`/lms/quizzes?skill=${encodeURIComponent(quiz.skill)}#retry-weak-topics`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
          >
            Retry weak topics
          </Link>
          {relatedQuizId ? (
            <Link
              href={buildQuizPreviewHref(relatedQuizId, {
                skill: lmsQuizBank[relatedQuizId]?.skill ?? quiz.skill,
                source: "result",
              })}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            >
              Practice related quiz
            </Link>
          ) : (
            <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-500">
              No related quiz mapped yet
            </span>
          )}
          <Link
            href={buildSuggestedLessonsHref({ quizId, skill: quiz.skill })}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
          >
            View suggested lessons
          </Link>
          <Link
            href="/lms/quizzes"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
          >
            Back to quizzes
          </Link>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <Link
          href="/lms/quizzes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to quizzes
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#28A8E1] hover:underline"
          onClick={() => {
            const label =
              score < 100
                ? `Review missed quiz topics: ${quiz.title}`
                : `Review: ${quiz.title}`;
            addPlannedItem({
              id: `quiz:${quizId}:review-${Date.now()}`,
              type: "quiz",
              label,
              href: buildQuizPreviewHref(quizId, { skill: quiz.skill, source: "result" }),
              sourceModule: "quizzes",
              sourceLabel: "Quiz Performance",
              context:
                score < 100
                  ? `Recommended review based on your recent quiz attempt (${score}%). Focus on: ${weakPrompts.join(" / ")}.`
                  : `Continue practicing to maintain your mastery of ${quiz.title}.`,
            });
            toast.push({
              title: "Added to plan",
              message: "Quiz review added to Career Path plan.",
              tone: "success",
            });
          }}
        >
          Add this practice to your plan
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
