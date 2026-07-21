'use client';

const STEPS = [
  {
    title: '1. Request Submitted',
    description: 'Candidate submits category, stack, difficulty, date/time slots, and notes.',
  },
  {
    title: '2. Pending Matching',
    description: 'System keeps the request in pending queue and validates profile + availability.',
  },
  {
    title: '3. Match Scoring',
    description: 'Matching checks skill overlap, difficulty fit, language fit, and time-slot overlap.',
  },
  {
    title: '4. Match or Requeue',
    description: 'Best-fit interviewer is suggested. If unavailable, request stays in matching queue.',
  },
  {
    title: '5. Schedule and Complete',
    description: 'Once accepted, status moves to Scheduled, then Completed after interview closes.',
  },
];

export function InterviewMatchingFlow() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">How Interview Matching Works</h3>
      <p className="mt-1 text-sm text-slate-600">
        Matching engine is phase-based. Current module is ready for request intake and status tracking.
      </p>
      <div className="mt-4 grid gap-2">
        {STEPS.map((step) => (
          <div key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{step.title}</p>
            <p className="mt-1 text-sm text-slate-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
