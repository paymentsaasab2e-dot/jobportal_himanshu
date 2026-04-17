import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LMS_PAGE_SUBTITLE } from "../../../constants";
import { lmsQuizBank } from "../../../data/ai-mock";
import { QuizAttemptClient } from "./quiz-attempt-client";

export default async function LmsQuizAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = lmsQuizBank[id];

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link
          href="/lms/quizzes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to quizzes
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {quiz?.title ?? "Quiz Attempt"}
        </h1>
        <p className={LMS_PAGE_SUBTITLE}>
          Frontend-only quiz attempt (mock). Your answers are stored locally for
          review.
        </p>
      </div>

      <QuizAttemptClient quizId={id} />
    </div>
  );
}
