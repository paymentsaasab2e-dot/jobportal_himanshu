'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  counterpartName: string;
  viewerRole: 'candidate' | 'interviewer';
  submitting?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (input: { rating: number; feedback: string }) => void;
};

const RATINGS = [1, 2, 3, 4, 5] as const;

export function InterviewReviewModal({
  open,
  counterpartName,
  viewerRole,
  submitting = false,
  error = '',
  onClose,
  onSubmit,
}: Props) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  if (!open || typeof document === 'undefined') return null;

  const label = viewerRole === 'candidate' ? 'interviewer' : 'candidate';

  return createPortal(
    <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-slate-900/55 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">Add your review</h3>
        <p className="mt-1 text-sm text-slate-600">
          Share your review of {counterpartName || `the ${label}`}. Both of you can submit feedback about each other.
        </p>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</p>
          <div className="mt-2 flex gap-2">
            {RATINGS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`h-9 w-9 rounded-full text-sm font-semibold ${
                  rating === value
                    ? 'bg-[#2098C8] text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review</p>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value.slice(0, 1000))}
            placeholder={`How was the ${label}? What went well?`}
            className="mt-2 h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2098C8]"
          />
          <p className="mt-1 text-xs text-slate-500">{feedback.length}/1000 · minimum 10 characters</p>
        </div>
        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Later
          </button>
          <button
            type="button"
            disabled={submitting || feedback.trim().length < 10}
            onClick={() => onSubmit({ rating, feedback: feedback.trim() })}
            className="rounded-xl bg-[#2098C8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
