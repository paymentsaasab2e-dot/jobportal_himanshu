'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Coins,
  FileUser,
  KeyRound,
  LifeBuoy,
  MessageSquareText,
  Send,
  Sparkles,
  Ticket,
  UserRound,
  Wrench,
} from 'lucide-react';
import {
  HELP_PROBLEMS,
  HELP_TICKET_CATEGORIES,
  postHelpTicketToHq,
  saveHelpTicket,
  type HelpProblem,
} from './data/problems';
import { useAuth } from '@/components/auth/AuthContext';

const C = {
  bg: '#FAFBFC',
  surface: '#FFFFFF',
  brand: '#08428C',
  brandDeep: '#053366',
  bright: '#28A8E1',
  orange: '#FC9620',
  ink: '#0F172A',
  muted: '#64748B',
  border: 'rgba(15, 23, 42, 0.08)',
  softBright: 'rgba(40, 168, 225, 0.12)',
  shadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)',
} as const;

function ProblemIcon({ id, className = 'h-4 w-4' }: { id: string; className?: string }) {
  // Topic icons for common problems (no alert/warning glyphs)
  switch (id) {
    case 'login-otp':
      return <KeyRound className={className} strokeWidth={2.1} />;
    case 'duplicate-email-phone':
      return <UserRound className={className} strokeWidth={2.1} />;
    case 'few-jobs':
    case 'apply-failed':
      return <Briefcase className={className} strokeWidth={2.1} />;
    case 'tokens':
      return <Coins className={className} strokeWidth={2.1} />;
    case 'og-setup':
    case 'hryantra-alerts':
      return <MessageSquareText className={className} strokeWidth={2.1} />;
    case 'reference-check':
      return <FileUser className={className} strokeWidth={2.1} />;
    case 'profile-save':
      return <Sparkles className={className} strokeWidth={2.1} />;
    case 'employer-access':
      return <Briefcase className={className} strokeWidth={2.1} />;
    default:
      return <Wrench className={className} strokeWidth={2.1} />;
  }
}

export default function HelpPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [openProblemId, setOpenProblemId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<string>(HELP_TICKET_CATEGORIES[0]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [problemId, setProblemId] = useState<string | undefined>();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [hqSynced, setHqSynced] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loggedIn = Boolean(isAuthenticated && user?.id);

  // Logged in → auto-fill name/email from account. Guest → leave empty.
  useEffect(() => {
    if (isLoading) return;
    if (loggedIn) {
      const accountName = String(user?.name || '').trim();
      const accountEmail = String(user?.email || '').trim();
      setName(accountName && accountName !== 'User' && accountName !== 'Candidate' ? accountName : accountName);
      setEmail(accountEmail);
    } else {
      setName('');
      setEmail('');
    }
  }, [isLoading, loggedIn, user?.id, user?.name, user?.email]);

  const selectedProblem = useMemo(
    () => HELP_PROBLEMS.find((p) => p.id === problemId) || null,
    [problemId],
  );

  const prefillFromProblem = (problem: HelpProblem) => {
    setProblemId(problem.id);
    setCategory(problem.ticketCategory);
    setSubject(problem.title);
    setDescription(
      `I am hitting: ${problem.title}\n\nWhat I already tried:\n- ${problem.steps.slice(0, 2).join('\n- ')}\n\nMore details:\n`,
    );
    setOpenProblemId(problem.id);
    const form = document.getElementById('help-ticket-form');
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmittedId(null);
    setHqSynced(null);
    if (!name.trim() || !email.trim() || !subject.trim() || !description.trim()) {
      setError(
        loggedIn
          ? 'Please fill subject and description.'
          : 'Please fill name, email, subject, and description.',
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email so we can reply.');
      return;
    }

    const ticket = saveHelpTicket({
      name: name.trim(),
      email: email.trim(),
      category,
      subject: subject.trim(),
      description: description.trim(),
      problemId,
      userId: user?.id || undefined,
    });
    setSubmittedId(ticket.id);
    const synced = await postHelpTicketToHq(ticket);
    setHqSynced(synced);
  };

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ background: C.bg, color: C.ink }}>
      <section
        className={`relative overflow-hidden border-b pb-14 ${loggedIn ? 'pt-10' : 'pt-28'}`}
        style={{
          borderColor: C.border,
          background: `linear-gradient(165deg, #FFFFFF 0%, #FFF7ED 38%, ${C.bg} 100%)`,
        }}
      >
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
            style={{
              background: 'rgba(252,150,32,0.14)',
              color: C.brandDeep,
              border: '1px solid rgba(252,150,32,0.35)',
            }}
          >
            <LifeBuoy className="h-4 w-4" style={{ color: C.orange }} />
            Help &amp; support
          </div>
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Fix issues &amp;{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${C.brand} 0%, ${C.orange} 100%)`,
              }}
            >
              raise a ticket
            </span>
          </h1>
          <p className="mx-auto mb-6 max-w-xl text-base font-medium leading-relaxed" style={{ color: C.muted }}>
            Common problems you may hit, quick steps to try, then a ticket form if you still need us.
            Product how-tos live on FAQ.
          </p>
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-xs font-bold"
            style={{ borderColor: C.border, color: C.brand }}
          >
            <CircleHelp className="h-3.5 w-3.5" />
            Browse FAQ instead
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <div className="mb-8">
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: C.ink }}>
            <Wrench className="h-5 w-5" style={{ color: C.bright }} />
            Common problems right now
          </h2>
          <p className="mt-1 text-sm" style={{ color: C.muted }}>
            Start here — many issues clear with these steps. Use “Raise ticket” to prefill the form.
          </p>
        </div>

        <ul className="mb-14 space-y-3">
          {HELP_PROBLEMS.map((problem) => {
            const open = openProblemId === problem.id;
            return (
              <li key={problem.id}>
                <div
                  className="overflow-hidden rounded-[18px] border bg-white"
                  style={{ borderColor: C.border, boxShadow: C.shadow }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenProblemId(open ? null : problem.id)}
                    className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
                    aria-expanded={open}
                  >
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: C.softBright, color: C.brand }}
                    >
                      <ProblemIcon id={problem.id} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold" style={{ color: C.ink }}>
                        {problem.title}
                      </span>
                      <span className="mt-0.5 block text-sm" style={{ color: C.muted }}>
                        {problem.summary}
                      </span>
                    </span>
                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                      style={{ color: C.muted }}
                    />
                  </button>
                  {open ? (
                    <div className="border-t px-4 pb-4 pt-3 sm:px-5" style={{ borderColor: C.border }}>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: C.bright }}>
                        Try this
                      </p>
                      <ol className="list-decimal space-y-1.5 pl-4 text-sm" style={{ color: C.ink }}>
                        {problem.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                      <button
                        type="button"
                        onClick={() => prefillFromProblem(problem)}
                        className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${C.brandDeep}, ${C.bright})`,
                        }}
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        Raise ticket for this
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div
          id="help-ticket-form"
          className="rounded-[22px] border bg-white p-5 sm:p-7"
          style={{ borderColor: C.border, boxShadow: C.shadow }}
        >
          <div className="mb-5 flex items-start gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{
                background: `linear-gradient(145deg, ${C.brandDeep}, ${C.bright})`,
              }}
            >
              <Ticket className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold" style={{ color: C.ink }}>
                Raise a support ticket
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: C.muted }}>
                {loggedIn
                  ? 'Name and email are filled from your account. Add the issue details — we will email you a solution.'
                  : 'Enter your contact details and describe the issue. We register the ticket with HQ and email you a solution later.'}
              </p>
            </div>
          </div>

          {loggedIn ? null : (
            <p className="mb-4 text-xs" style={{ color: C.muted }}>
              Not signed in — please enter your name and email so we can reply.
            </p>
          )}

          {submittedId ? (
            <div
              className="mb-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-sm"
              style={{
                borderColor: 'rgba(16,185,129,0.35)',
                background: 'rgba(16,185,129,0.08)',
                color: C.ink,
              }}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Ticket <span className="font-mono font-semibold">{submittedId}</span> registered
                {hqSynced === true
                  ? ' with HQ.'
                  : hqSynced === false
                    ? ' locally — HQ sync failed; try again later.'
                    : '.'}{' '}
                We will email you at the address you provided with a solution.
              </span>
            </div>
          ) : null}

          {error ? (
            <p className="mb-4 text-sm font-medium text-red-600">{error}</p>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-semibold" style={{ color: C.ink }}>
                  Name{loggedIn ? '' : ' *'}
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={loggedIn && Boolean(name)}
                  className={`h-11 w-full rounded-xl border px-3 outline-none focus:border-[#28A8E1] focus:ring-2 focus:ring-[#28A8E1]/20 ${
                    loggedIn && name ? 'bg-slate-50 text-slate-700' : ''
                  }`}
                  style={{ borderColor: C.border }}
                  placeholder={loggedIn ? 'Loading your name…' : 'Your name'}
                  autoComplete="name"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-semibold" style={{ color: C.ink }}>
                  Email{loggedIn ? '' : ' *'}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={loggedIn && Boolean(email)}
                  className={`h-11 w-full rounded-xl border px-3 outline-none focus:border-[#28A8E1] focus:ring-2 focus:ring-[#28A8E1]/20 ${
                    loggedIn && email ? 'bg-slate-50 text-slate-700' : ''
                  }`}
                  style={{ borderColor: C.border }}
                  placeholder={loggedIn ? 'Loading your email…' : 'you@email.com'}
                  autoComplete="email"
                />
              </label>
            </div>

            {loggedIn && !email ? (
              <p className="text-xs text-amber-700">
                No email on your profile yet — please type one so we can reply.
              </p>
            ) : null}

            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold" style={{ color: C.ink }}>
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-11 w-full rounded-xl border bg-white px-3 outline-none focus:border-[#28A8E1] focus:ring-2 focus:ring-[#28A8E1]/20"
                style={{ borderColor: C.border }}
              >
                {HELP_TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold" style={{ color: C.ink }}>
                Subject
              </span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 w-full rounded-xl border px-3 outline-none focus:border-[#28A8E1] focus:ring-2 focus:ring-[#28A8E1]/20"
                style={{ borderColor: C.border }}
                placeholder="Short summary of the issue"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-semibold" style={{ color: C.ink }}>
                Description
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-xl border px-3 py-2.5 outline-none focus:border-[#28A8E1] focus:ring-2 focus:ring-[#28A8E1]/20"
                style={{ borderColor: C.border }}
                placeholder="What happened, what you expected, and steps you already tried…"
              />
            </label>

            {selectedProblem ? (
              <p className="text-xs" style={{ color: C.muted }}>
                Linked problem: <span className="font-semibold text-slate-700">{selectedProblem.title}</span>
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white sm:w-auto"
              style={{
                background: `linear-gradient(135deg, ${C.brandDeep}, ${C.brand} 45%, ${C.bright})`,
                boxShadow: '0 8px 20px rgba(8,66,140,0.25)',
              }}
            >
              <Send className="h-4 w-4" />
              Submit ticket
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
