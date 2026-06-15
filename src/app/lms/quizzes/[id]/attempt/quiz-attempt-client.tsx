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
  Loader2,
} from "lucide-react";
import { LMS_CARD_CLASS } from "../../../constants";
import { LmsCtaButton } from "../../../components/ux/LmsCtaButton";
import { useLmsToast } from "../../../components/ux/LmsToastProvider";
import { useLmsState } from "../../../state/LmsStateProvider";
import { fetchQuizDetail, submitQuizAttempt } from "../../../api/client";
import { LmsSkeleton } from "../../../components/states/LmsSkeleton";

type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
};

type LoadedQuiz = {
  title: string;
  skill?: string;
  questions: QuizQuestion[];
};

type StoredAttempt = {
  quizId: string;
  answers: Record<string, number>;
  score?: number;
  durationSec?: number;
  startedAt?: number;
  completedAt?: number;
  attemptId?: string;
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

  const [quiz, setQuiz] = useState<LoadedQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    let active = true;
    async function loadQuiz() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchQuizDetail(quizId);
        if (!active) return;
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
          setQuiz(null);
          return;
        }
        setQuiz({
          title: data.title,
          skill: data.skillTags?.[0] || skillFromUrl || undefined,
          questions: data.questions.map((question: any) => ({
            id: question.id,
            text: question.text,
            options: question.options || [],
          })),
        });
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load quiz");
        setQuiz(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadQuiz();
    return () => {
      active = false;
    };
  }, [quizId, skillFromUrl]);

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

  if (loading) {
    return <LmsSkeleton lines={8} />;
  }

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
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 py-20">
          <p className="font-medium text-gray-500">
            {loadError || "This quiz could not be found or has no active questions."}
          </p>
          <Link
            href="/lms/quizzes"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#208bc0]"
          >
            Return to quizzes
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

  const submit = async (submittedAt: number) => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);

    const completedAt = Math.max(startedAt, Math.round(performance.timeOrigin + submittedAt));
    const durSec = Math.max(0, Math.round((completedAt - startedAt) / 1000));

    try {
      const result = await submitQuizAttempt(quizId, {
        answerMap: answers,
        timeTakenSeconds: durSec,
      });

      const score = Math.round(result?.score ?? 0);
      setQuizAttempt(quizId, score, durSec);

      const payload: StoredAttempt = {
        quizId,
        answers,
        score,
        durationSec: durSec,
        startedAt,
        completedAt,
        attemptId: result?.attemptId,
      };
      sessionStorage.setItem(storageKey(quizId), JSON.stringify(payload));

      toast.push({
        title: "Quiz submitted",
        message: `Score: ${score}%`,
        tone: score >= 70 ? "success" : "info",
      });

      const params = new URLSearchParams();
      params.set("duration", String(durSec));
      if (result?.attemptId) params.set("attemptId", result.attemptId);
      if (skillFromUrl) params.set("skill", skillFromUrl);

      router.push(`/lms/quizzes/${quizId}/result?${params.toString()}`);
    } catch (error) {
      toast.push({
        title: "Submit failed",
        message: error instanceof Error ? error.message : "Could not submit quiz.",
        tone: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex min-w-0 items-center justify-between">
        <h1 className="truncate pr-4 text-xl font-bold text-gray-900">{quiz.title}</h1>
        <button
          onClick={handleExit}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <X className="h-4 w-4" /> Exit
        </button>
      </div>

      {confirmExit ? (
        <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            You have unanswered questions. Are you sure you want to leave?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmExit(false)}
              className="px-2 py-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push("/lms/quizzes")}
              className="px-2 py-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
            >
              Leave anyway
            </button>
          </div>
        </div>
      ) : null}

      <div className={`${LMS_CARD_CLASS} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1">
            Question {index + 1} / {questions.length}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">{answeredCount} answered</span>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Clock className="h-4 w-4" strokeWidth={2} aria-hidden />
          Timer running
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-[#28A8E1] transition-[width] duration-300"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <div className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md`}>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Prompt</p>
        <h2 className="mt-2 text-lg font-bold leading-snug text-gray-900">{q.text}</h2>

        <ul className="mt-5 space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i;
            return (
              <li key={`${q.id}-${opt}`}>
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
                        <CheckCircle2 className="h-5 w-5 text-[#28A8E1]" strokeWidth={2} aria-hidden />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" strokeWidth={2} aria-hidden />
                      )}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{opt}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
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
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            leftIcon={<ChevronRight className="h-4 w-4" strokeWidth={2} />}
          >
            Next
          </LmsCtaButton>
        ) : (
          <LmsCtaButton variant="primary" onClick={() => setConfirmSubmit(true)} disabled={!canSubmit}>
            Review and submit
          </LmsCtaButton>
        )}
      </div>

      {confirmSubmit ? (
        <div className={`${LMS_CARD_CLASS} space-y-4 border-sky-100 bg-sky-50/40`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Submit confirmation</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">Ready to submit this attempt?</h2>
            <p className="mt-2 text-sm text-gray-600">
              You answered {answeredCount} of {questions.length} questions.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <LmsCtaButton variant="secondary" onClick={() => setConfirmSubmit(false)}>
              Back to questions
            </LmsCtaButton>
            <LmsCtaButton
              variant="primary"
              onClick={(event) => void submit(event.timeStamp)}
              loading={isSubmitting}
              leftIcon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              Confirm submit
            </LmsCtaButton>
          </div>
        </div>
      ) : null}

      {!canSubmit ? (
        <p className="text-xs font-medium text-gray-500">Answer all questions to submit.</p>
      ) : null}
    </div>
  );
}
