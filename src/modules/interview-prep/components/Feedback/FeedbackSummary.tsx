'use client';

import type { Feedback } from '../../types/interview.types';
import { ConfidenceGauge } from './ConfidenceGauge';

type FeedbackSummaryProps = {
  feedback: Feedback;
  confidenceScore: number;
};

export function FeedbackSummary({ feedback, confidenceScore }: FeedbackSummaryProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI feedback summary</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md space-y-5">
          <div>
            <h3 className="text-sm font-bold text-emerald-800">Strengths</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm font-normal text-gray-600">
              {feedback.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-800">Improvements</h3>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm font-normal text-gray-600">
              {feedback.improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <ConfidenceGauge value={confidenceScore} />
      </div>
    </section>
  );
}
