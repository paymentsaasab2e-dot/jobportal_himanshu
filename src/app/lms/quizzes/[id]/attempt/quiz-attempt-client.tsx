"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
} from "lucide-react";
import { LMS_CARD_CLASS } from "../../../constants";
import { lmsQuizBank } from "../../../data/ai-mock";
import { LmsCtaButton } from "../../../components/ux/LmsCtaButton";
import { useLmsToast } from "../../../components/ux/LmsToastProvider";
import { useLmsState } from "../../../state/LmsStateProvider";

type StoredAttempt = {
  quizId: string;
  answers: Record<string, number>;
  score?: number;
  durationSec?: number;
  startedAt?: number;
  completedAt?: number;
};

const noopSubscribe = () => () => {};
const EMPTY_ANSWERS: Record<string, number> = {};

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

export function QuizAttemptClient({ quizId }: { quizId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useLmsToast();
  const { setSelectedSkill, setQuizAttempt } = useLmsState();

  const quiz = lmsQuizBank[quizId];
  const skillFromUrl = search.get("skill");
  const storedAttemptRaw = useSyncExternalStore(
    noopSubscribe,
    () => readStoredAttemptRaw(quizId),
    () => null
  );
  const storedAttempt = useMemo(() => {
    if (!storedAttemptRaw) return null;
    try {
      const parsed = JSON.parse(storedAttemptRaw) as StoredAttempt;
      return parsed?.quizId === quizId ? parsed : null;
    } catch {
      return null;
    }
  }, [quizId, storedAttemptRaw]);

  const questions = quiz?.questions ?? [];
  const [index, setIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, number> | null>(null);
  const [startedAtFallback] = useState<number>(() => Date.now());
  const answers = useMemo(
    () => draftAnswers ?? storedAttempt?.answers ?? EMPTY_ANSWERS,
    [draftAnswers, storedAttempt?.answers]
  );
  const startedAt = storedAttempt?.startedAt ?? startedAtFallback;
  const [confirmExit, setConfirmExit] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (skillFromUrl) setSelectedSkill(skillFromUrl);
  }, [setSelectedSkill, skillFromUrl]);

  useEffect(() => {
    try {
      const payload: StoredAttempt = { quizId, answers, startedAt };
      sessionStorage.setItem(storageKey(quizId), JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [quizId, answers, startedAt]);

  if (!quiz || questions.length === 0) {
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
            This quiz could not be found or has no active questions.
          </p>
          <Link
            href="/lms/quizzes"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#208bc0]"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const answeredCount = Object.keys(answers).length;

  const select = (optIndex: number) => {
    setConfirmSubmit(false);
    setDraftAnswers((prev) => ({ ...(prev ?? answers), [q.id]: optIndex }));
  };

  const canSubmit = answeredCount === questions.length;

  const handleExit = () => {
    if (answeredCount > 0 && !canSubmit && !confirmExit) {
      setConfirmExit(true);
      return;
    }
    router.push("/lms/quizzes");
  };

  const submit = (submittedAt: number) => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    const correct = questions.reduce((acc, question) => {
      const chosen = answers[question.id];
      return acc + (chosen === question.correctIndex ? 1 : 0);
    }, 0);
    const score = questions.length
      ? Math.round((correct / questions.length) * 100)
      : 0;
    const completedAt = Math.max(startedAt, Math.round(performance.timeOrigin + submittedAt));
    const durSec = Math.max(0, Math.round((completedAt - startedAt) / 1000));
    setQuizAttempt(quizId, score, durSec);

    try {
      const payload: StoredAttempt = {
        quizId,
        answers,
        score,
        durationSec: durSec,
        startedAt,
        completedAt,
      };
      sessionStorage.setItem(storageKey(quizId), JSON.stringify(payload));
    } catch {
      // ignore
    }

    toast.push({
      title: "Quiz submitted",
      message: `Score: ${score}% (mock).`,
      tone: score >= 70 ? "success" : "info",
    });
    router.push(
      `/lms/quizzes/${quizId}/result?duration=${durSec}${
        skillFromUrl ? `&skill=${encodeURIComponent(skillFromUrl)}` : ""
      }`,
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between min-w-0">
        <h1 className="text-xl font-bold text-gray-900 truncate pr-4">
          {quiz.title}
        </h1>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <X className="w-4 h-4" /> Exit
        </button>
      </div>

      {confirmExit && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-between">
          <p className="text-sm text-amber-800 font-medium">
            You have unanswered questions. Are you sure you want to abandon this
            setup?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmExit(false)}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push("/lms/quizzes")}
              className="text-sm font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
            >
              Leave Anyway
            </button>
          </div>
        </div>
      )}

      <div
        className={`${LMS_CARD_CLASS} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="rounded-full bg-violet-50 border border-violet-100 px-3 py-1">
            Question {index + 1} / {questions.length}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{answeredCount} answered</span>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
          Mock timer running
        </div>
      </div>

      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#28A8E1] transition-[width] duration-300"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <div
        className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md`}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
          Prompt
        </p>
        <h2 className="mt-2 text-lg font-bold text-gray-900 leading-snug">
          {q.prompt}
        </h2>

        <ul className="mt-5 space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                    selected
                      ? "border-[#28A8E1]/40 bg-[#28A8E1]/10 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm"
                  } focus:outline-none focus:ring-4 focus:ring-blue-100`}
                >
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5">
                      {selected ? (
                        <CheckCircle2
                          className="h-5 w-5 text-[#28A8E1]"
                          strokeWidth={2}
                          aria-hidden
                        />
                      ) : (
                        <Circle
                          className="h-5 w-5 text-gray-300"
                          strokeWidth={2}
                          aria-hidden
                        />
                      )}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {opt}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <LmsCtaButton
          variant="secondary"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          leftIcon={<ChevronLeft className="h-4 w-4" strokeWidth={2} />}
        >
          Previous
        </LmsCtaButton>
        {index < questions.length - 1 ? (
          <LmsCtaButton
            variant="primary"
            onClick={() =>
              setIndex((i) => Math.min(questions.length - 1, i + 1))
            }
            leftIcon={<ChevronRight className="h-4 w-4" strokeWidth={2} />}
          >
            Next
          </LmsCtaButton>
        ) : (
          <LmsCtaButton
            variant="primary"
            onClick={() => setConfirmSubmit(true)}
            disabled={!canSubmit}
          >
            Review and submit
          </LmsCtaButton>
        )}
      </div>

      {confirmSubmit ? (
        <div className={`${LMS_CARD_CLASS} border-sky-100 bg-sky-50/40 space-y-4`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Submit confirmation
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              Ready to lock this attempt?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You answered {answeredCount} of {questions.length} questions. Once
              you submit, we will open your result summary and review state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
            <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
              All questions answered
            </span>
            <span className="rounded-full border border-sky-100 bg-white px-3 py-1">
              Topic: {quiz.skill}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <LmsCtaButton
              variant="secondary"
              onClick={() => setConfirmSubmit(false)}
            >
              Back to questions
            </LmsCtaButton>
            <LmsCtaButton
              variant="primary"
              onClick={(event) => submit(event.timeStamp)}
              loading={isSubmitting}
            >
              Confirm submit
            </LmsCtaButton>
          </div>
        </div>
      ) : null}

      {!canSubmit ? (
        <p className="text-xs font-medium text-gray-500">
          Answer all questions to submit. This is a frontend-only mock flow.
        </p>
      ) : null}
    </div>
  );
}
