"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { LMS_CARD_CLASS } from "../../../constants";
import { LmsStatusBadge } from "../../../components/ux/LmsStatusBadge";
import { LmsSkeleton } from "../../../components/states/LmsSkeleton";
import {
  buildQuizAttemptHref,
  formatDurationLabel,
  getQuizSkillLabel,
  scoreInsight,
} from "../../quiz-utils";
import { fetchAttemptResult, type QuizAttemptResult } from "../../../api/client";

function optionLabel(options: string[], index: number | null | undefined) {
  if (index == null || index < 0 || index >= options.length) return "Not answered";
  return options[index];
}

export function QuizResultClient({ quizId }: { quizId: string }) {
  const search = useSearchParams();
  const attemptId = search.get("attemptId");
  const skillFromUrl = search.get("skill");
  const durationFromUrl = Number(search.get("duration") ?? "0");

  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      setError("No attempt id found for this result.");
      return;
    }

    let active = true;
    void fetchAttemptResult(quizId, attemptId)
      .then((data) => {
        if (!active) return;
        if (!data) {
          setError("This quiz result could not be found.");
          setResult(null);
          return;
        }
        setResult(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load quiz result.");
        setResult(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [quizId, attemptId]);

  const score = Math.round(result?.score ?? 0);
  const topicLabel = getQuizSkillLabel(skillFromUrl) ?? "Quiz";
  const durationSec = durationFromUrl || result?.timeTakenSeconds || 0;
  const formattedDuration = formatDurationLabel(durationSec);
  const completedAt = result?.completedAt ?? null;

  const breakdown = useMemo(() => result?.breakdown ?? [], [result?.breakdown]);
  const correctCount = result?.correctCount ?? breakdown.filter((row) => row.isCorrect).length;
  const totalQuestions = result?.totalQuestions ?? breakdown.length;

  if (loading) {
    return <LmsSkeleton lines={10} />;
  }

  if (!result || error) {
    return (
      <div className="space-y-8 pb-8">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 py-20">
          <p className="font-medium text-gray-500">
            {error || "Session attempt could not be verified or the quiz does not exist."}
          </p>
          <Link
            href="/lms/quizzes"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#208bc0]"
          >
            Back to quizzes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${LMS_CARD_CLASS} border-violet-100 bg-violet-50/20`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Award className="mt-0.5 h-5 w-5 text-violet-700" strokeWidth={2} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Result summary</p>
              <h2 className="profile-page-section-title mt-1">{result.quizTitle}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>{topicLabel}</span>
                <span className="text-gray-300">-</span>
                <span>
                  {correctCount} / {totalQuestions} correct
                </span>
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
                <span className="application-detail-title">{score}%</span>
                <LmsStatusBadge
                  label={score >= 70 ? "Ready to build on" : "Needs another drill"}
                  tone={score >= 70 ? "success" : "warning"}
                />
              </div>
              <p className="mt-3 text-sm text-gray-700">{scoreInsight(score)}</p>
            </div>
          </div>
          <Link
            href={buildQuizAttemptHref(quizId, skillFromUrl)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            Retry quiz
          </Link>
        </div>
      </div>

      <div className="space-y-3" id="review">
        <h2 className="text-lg font-bold tracking-tight text-gray-900">Review answers</h2>
        <p className="text-sm text-gray-600">
          Your selected answer and the correct answer are shown for each question.
        </p>
        <ul className="space-y-3">
          {breakdown.map((row, index) => {
            const chosenText = optionLabel(row.options, row.chosenIndex);
            const correctText = optionLabel(row.options, row.correctOptionIndex);

            return (
              <li
                key={row.id}
                className={`${LMS_CARD_CLASS} ${row.isCorrect ? "border-emerald-100" : "border-rose-100"}`}
              >
                <div className="flex items-start gap-3">
                  {row.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" strokeWidth={2} aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 text-rose-700" strokeWidth={2} aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gray-900">{row.text}</p>

                    <div className="mt-4 space-y-2">
                      <div
                        className={`rounded-xl border px-4 py-3 ${
                          row.isCorrect
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-rose-200 bg-rose-50"
                        }`}
                      >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          Your answer
                        </p>
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            row.isCorrect ? "text-emerald-900" : "text-rose-900"
                          }`}
                        >
                          {chosenText}
                        </p>
                      </div>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                          Correct answer
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-900">{correctText}</p>
                      </div>
                    </div>

                    {row.explanation ? (
                      <p className="mt-3 text-sm text-gray-600">
                        <span className="font-semibold text-gray-800">Explanation: </span>
                        {row.explanation}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/lms/quizzes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to quizzes
        </Link>
      </div>
    </div>
  );
}
