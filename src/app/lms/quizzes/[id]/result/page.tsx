import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { LMS_PAGE_SUBTITLE } from "../../../constants";
import { LmsSkeleton } from "../../../components/states/LmsSkeleton";
import { QuizResultClient } from "./quiz-result-client";

export default async function LmsQuizResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
        <h1 className="application-detail-title mt-3">
          Results
        </h1>
        <p className={LMS_PAGE_SUBTITLE}>
          Review your selected answers and the correct answers for each question.
        </p>
      </div>

      <Suspense fallback={<LmsSkeleton lines={10} />}>
        <QuizResultClient quizId={id} />
      </Suspense>
    </div>
  );
}
