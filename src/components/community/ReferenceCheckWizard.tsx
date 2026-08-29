'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  EyeOff,
  Loader2,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import {
  getGossipIdentity,
  listOpenForReferenceOnCompany,
  type CompanyPage,
} from '@/lib/community-store';
import {
  submitReferenceEnquiry,
  suggestEmployeeQuestions,
  suggestEmployerQuestions,
  suggestFromRelatedSearches,
  type EnquiryRole,
} from '@/lib/reference-check-store';

type Step = 'role' | 'person' | 'questions' | 'pay';

const STEPS: Step[] = ['role', 'person', 'questions', 'pay'];

type Props = {
  company: CompanyPage;
  userId: string;
  userName: string;
  onClose: () => void;
  onSubmitted: (requestId: string) => void;
};

export function ReferenceCheckWizard({
  company,
  userId,
  userName,
  onClose,
  onSubmitted,
}: Props) {
  const identity = getGossipIdentity(userId);
  const forcedAnon = Boolean(identity?.isAnonymous);

  const [step, setStep] = useState<Step>('role');
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<EnquiryRole | null>(null);
  const [refereeId, setRefereeId] = useState('');
  const [personQuery, setPersonQuery] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [customQ, setCustomQ] = useState('');
  const [anonymous, setAnonymous] = useState(forcedAnon || Boolean(identity?.followAnonymously));

  const openPeople = useMemo(() => listOpenForReferenceOnCompany(company.id), [company.id]);

  const filteredPeople = useMemo(() => {
    const q = personQuery.trim().toLowerCase();
    if (!q) return openPeople;
    return openPeople.filter((p) => p.displayName.toLowerCase().includes(q));
  }, [openPeople, personQuery]);

  const selectedPerson = openPeople.find((p) => p.userId === refereeId) || null;
  const fee = Math.max(1, Number(selectedPerson?.feeTokens) || 10);
  const stepIndex = STEPS.indexOf(step);

  const baseSuggestions = useMemo(() => {
    if (role === 'employee') return suggestEmployeeQuestions(company);
    if (role === 'employer') {
      return suggestEmployerQuestions(selectedPerson?.displayName || 'this person', company);
    }
    return [];
  }, [role, company, selectedPerson?.displayName]);

  const relatedSuggestions = useMemo(() => {
    const q = selectedPerson?.displayName || company.name;
    return suggestFromRelatedSearches(q);
  }, [selectedPerson?.displayName, company.name]);

  const allSuggestions = useMemo(
    () => [...baseSuggestions, ...relatedSuggestions.filter((q) => !baseSuggestions.includes(q))],
    [baseSuggestions, relatedSuggestions],
  );

  const pickRole = (next: EnquiryRole) => {
    setRole(next);
    setQuestions([]);
    setRefereeId('');
    setStep('person');
  };

  const pickPerson = (userIdKey: string, displayName: string) => {
    setRefereeId(userIdKey);
    if (role === 'employer') {
      setQuestions(suggestEmployerQuestions(displayName, company).slice(0, 3));
    } else if (role === 'employee' && questions.length === 0) {
      setQuestions(suggestEmployeeQuestions(company).slice(0, 3));
    }
  };

  const toggleQuestion = (q: string) => {
    setQuestions((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : prev.length >= 8 ? prev : [...prev, q],
    );
  };

  const addCustom = () => {
    const t = customQ.trim();
    if (!t) return;
    if (questions.includes(t)) {
      setCustomQ('');
      return;
    }
    if (questions.length >= 8) {
      showErrorToast('Questions', 'Max 8 questions.');
      return;
    }
    setQuestions((prev) => [...prev, t]);
    setCustomQ('');
  };

  const goBack = () => {
    if (step === 'person') setStep('role');
    else if (step === 'questions') setStep('person');
    else if (step === 'pay') setStep('questions');
  };

  const goNext = () => {
    if (step === 'person') {
      if (!refereeId) {
        showErrorToast('Person', 'Select someone first.');
        return;
      }
      setStep('questions');
      return;
    }
    if (step === 'questions') {
      if (questions.length === 0) {
        showErrorToast('Questions', 'Add at least one question.');
        return;
      }
      setStep('pay');
    }
  };

  const handleSubmit = async () => {
    if (!role || !refereeId || !selectedPerson) {
      showErrorToast('Person', 'Select who should receive this enquiry.');
      return;
    }
    if (questions.length === 0) {
      showErrorToast('Questions', 'Add at least one question.');
      return;
    }
    setBusy(true);
    try {
      const result = await submitReferenceEnquiry({
        companyPageId: company.id,
        companyName: company.name,
        requesterId: userId,
        requesterName: userName,
        refereeId,
        enquiryRole: role,
        questions,
        anonymous: anonymous || forcedAnon,
        alreadyPaid: false,
        feeTokens: fee,
      });
      if (!result.ok) {
        showErrorToast('Reference check', result.error);
        return;
      }
      showSuccessToast('Request sent', 'They can Accept or Reject your enquiry.');
      onSubmitted(result.request.id);
    } finally {
      setBusy(false);
    }
  };

  const stepTitle =
    step === 'role'
      ? 'Who are you?'
      : step === 'person'
        ? 'Who should answer?'
        : step === 'questions'
          ? 'What do you want to know?'
          : 'Review & pay';

  const stepHint =
    step === 'role'
      ? 'One tap — employee or employer'
      : step === 'person'
        ? 'Pick one person open for reference'
        : step === 'questions'
          ? 'Tap suggestions or type your own'
          : 'Confirm and send the request';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-6">
      <div className="my-auto flex max-h-[min(480px,calc(100dvh-2.5rem))] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-5 pb-3 pt-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {company.name}
              </p>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{stepTitle}</h2>
              <p className="text-[12px] text-slate-500">{stepHint}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quiet progress — no step numbers */}
          <div className="flex items-center gap-1.5" aria-hidden>
            {STEPS.map((id, i) => (
              <div
                key={id}
                className={`h-1 flex-1 rounded-full transition ${
                  i <= stepIndex ? 'bg-[#176F96]' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body — one step at a time */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 'role' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => pickRole('employee')}
                className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 to-white p-4 text-left transition hover:border-[#176F96] hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#176F96] text-white shadow-sm">
                  <Briefcase className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">I’m an employee</span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-slate-500">
                    Ask about culture, leadership, and day-to-day life.
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => pickRole('employer')}
                className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-left transition hover:border-emerald-500 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <Building2 className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">I’m an employer</span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-slate-500">
                    Ask about a specific person at this company.
                  </span>
                </span>
              </button>
            </div>
          ) : null}

          {step === 'person' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  placeholder="Search people…"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#176F96] focus:bg-white"
                />
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {filteredPeople.map((p) => {
                  const selected = refereeId === p.userId;
                  return (
                    <li key={p.userId}>
                      <button
                        type="button"
                        onClick={() => pickPerson(p.userId, p.displayName)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                          selected
                            ? 'border-[#176F96] bg-sky-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            selected ? 'bg-[#176F96] text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.displayName.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {p.displayName}
                          </span>
                          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                            Fee <TokenCoinIcon className="h-3.5 w-3.5" />
                            {p.feeTokens}
                          </span>
                        </span>
                        {selected ? (
                          <Check className="h-5 w-5 shrink-0 text-[#176F96]" />
                        ) : (
                          <User className="h-4 w-4 shrink-0 text-slate-300" />
                        )}
                      </button>
                    </li>
                  );
                })}
                {filteredPeople.length === 0 ? (
                  <p className="col-span-full py-10 text-center text-sm text-slate-400">
                    No one open for reference here yet.
                  </p>
                ) : null}
              </ul>
            </div>
          ) : null}

          {step === 'questions' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-[12px] text-slate-500">
                  Selected {questions.length}/8
                  {selectedPerson ? (
                    <span>
                      {' '}
                      · asking{' '}
                      <span className="font-semibold text-slate-700">{selectedPerson.displayName}</span>
                    </span>
                  ) : null}
                </p>

                {questions.length > 0 ? (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div
                        key={q}
                        className="flex items-start gap-2 rounded-2xl bg-[#176F96] px-3.5 py-2.5 text-[12px] font-medium text-white"
                      >
                        <span className="mt-0.5 shrink-0 text-white/70">{i + 1}.</span>
                        <span className="min-w-0 flex-1">{q}</span>
                        <button
                          type="button"
                          onClick={() => setQuestions((prev) => prev.filter((x) => x !== q))}
                          className="shrink-0 rounded-full p-0.5 text-white/70 hover:bg-white/15 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
                    Tap a suggestion to add it
                  </p>
                )}

                <div className="flex gap-2">
                  <input
                    value={customQ}
                    onChange={(e) => setCustomQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustom();
                      }
                    }}
                    placeholder="Or type your own…"
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-slate-200 px-3.5 text-sm outline-none focus:border-[#176F96]"
                  />
                  <button
                    type="button"
                    onClick={addCustom}
                    className="inline-flex h-11 items-center gap-1 rounded-2xl bg-slate-900 px-3.5 text-xs font-semibold text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Suggestions
                </p>
                <div className="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto pr-0.5">
                  {allSuggestions
                    .filter((q) => !questions.includes(q))
                    .map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => toggleQuestion(q)}
                        className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-[12px] text-slate-700 transition hover:border-[#176F96] hover:bg-sky-50"
                      >
                        <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#176F96]" />
                        <span>{q}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 'pay' && selectedPerson ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Summary — same amber/emerald token celebrate palette */}
              <div className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 shadow-sm">
                <div className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-amber-300/40 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-emerald-300/35 blur-3xl" />
                <div className="relative flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-lg font-bold text-white shadow-lg shadow-amber-500/30 ring-4 ring-white">
                    {selectedPerson.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {selectedPerson.displayName}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {role === 'employee' ? 'Employee enquiry' : 'Employer enquiry'} ·{' '}
                      {company.name}
                    </p>
                  </div>
                </div>
                <ul className="relative mt-3 max-h-[160px] space-y-1.5 overflow-y-auto rounded-2xl bg-white/85 p-3 ring-1 ring-amber-100">
                  {questions.map((q, i) => (
                    <li key={q} className="text-[12px] text-slate-600">
                      <span className="font-semibold text-amber-700/70">{i + 1}.</span> {q}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                {/* Pay amount — celebrate-style coin card, no escrow policy copy */}
                <div className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-emerald-50 px-4 py-5 text-center shadow-sm">
                  <div className="pointer-events-none absolute -left-6 -top-8 h-24 w-24 rounded-full bg-amber-300/45 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-8 -right-4 h-24 w-24 rounded-full bg-emerald-300/40 blur-3xl" />
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-amber-200/70" />
                    <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl shadow-amber-500/40 ring-4 ring-white">
                      <TokenCoinIcon className="h-8 w-8" />
                    </span>
                  </div>
                  <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                    Total to pay
                  </p>
                  <p className="relative mt-1 flex items-center justify-center gap-1.5 text-3xl font-black tracking-tight text-slate-900">
                    <TokenCoinIcon className="h-7 w-7" />
                    {fee}
                  </p>
                </div>

                <label
                  className={`relative flex items-center gap-2.5 overflow-hidden rounded-2xl border border-amber-200/80 bg-white/90 px-3.5 py-3 text-[12px] text-slate-700 ring-1 ring-amber-100 ${
                    forcedAnon ? 'opacity-80' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={anonymous || forcedAnon}
                    disabled={forcedAnon}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600"
                  />
                  <EyeOff className="h-4 w-4 text-amber-700/60" />
                  Stay anonymous on this request
                  {forcedAnon ? ' (locked)' : ''}
                </label>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-5 py-3.5">
          {step !== 'role' ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span className="flex-1" />
          )}

          <div className="flex-1" />

          {step === 'person' || step === 'questions' ? (
            <button
              type="button"
              onClick={goNext}
              disabled={step === 'person' ? !refereeId : questions.length === 0}
              className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-[#176F96] px-5 text-sm font-semibold text-white hover:bg-[#0F5A7A] disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}

          {step === 'pay' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSubmit()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:opacity-95 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TokenCoinIcon className="h-4 w-4" />
              )}
              Pay {fee} & send
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
