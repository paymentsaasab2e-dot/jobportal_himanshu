'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  Search,
  CircleHelp,
  Mail,
  Clock,
  Sparkles,
  BadgeCheck,
  LifeBuoy,
} from 'lucide-react';
import {
  faqIcon,
  questionRowIcon,
  HELP_FAQ_CATEGORIES,
  type FaqCategory,
} from '../help/data/faqs';

type AudienceFilter = 'all' | 'candidate' | 'employer';

const C = {
  bg: '#FAFBFC',
  surface: '#FFFFFF',
  brand: '#08428C',
  brandDeep: '#053366',
  bright: '#28A8E1',
  ink: '#0F172A',
  muted: '#64748B',
  border: 'rgba(15, 23, 42, 0.08)',
  softBright: 'rgba(40, 168, 225, 0.12)',
  shadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)',
  shadowOpen: '0 4px 6px rgba(5,51,102,0.06), 0 12px 28px rgba(8,66,140,0.12)',
} as const;

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [audience, setAudience] = useState<AudienceFilter>('all');

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return HELP_FAQ_CATEGORIES.map((cat) => {
      if (audience !== 'all' && cat.audience !== 'both' && cat.audience !== audience) {
        return { ...cat, questions: [] as FaqCategory['questions'] };
      }
      return {
        ...cat,
        questions: cat.questions.filter(
          (item) =>
            !q ||
            item.q.toLowerCase().includes(q) ||
            item.a.toLowerCase().includes(q) ||
            cat.category.toLowerCase().includes(q),
        ),
      };
    }).filter((cat) => cat.questions.length > 0);
  }, [searchQuery, audience]);

  const totalQuestions = filteredFaqs.reduce((n, c) => n + c.questions.length, 0);

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ background: C.bg, color: C.ink }}>
      <section
        className="relative overflow-hidden border-b pb-16 pt-28"
        style={{
          borderColor: C.border,
          background: `linear-gradient(165deg, #FFFFFF 0%, #F0F9FF 42%, ${C.bg} 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(40,168,225,0.35), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
            style={{
              background: C.softBright,
              color: C.brand,
              border: '1px solid rgba(40,168,225,0.28)',
            }}
          >
            <CircleHelp className="h-4 w-4" style={{ color: C.bright }} />
            FAQ
          </div>

          <h1 className="mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: C.ink }}>
            Frequently asked{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${C.brand} 0%, ${C.bright} 55%, #7DD3FC 100%)`,
              }}
            >
              questions
            </span>
          </h1>
          <p className="mx-auto mb-6 max-w-xl text-base font-medium leading-relaxed" style={{ color: C.muted }}>
            Product guides for Office Gossips, jobs, AI CV, LMS, tokens, reference check, and employers.
            For broken flows or support tickets, use Help instead.
          </p>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${C.brandDeep}, ${C.bright})`,
                boxShadow: '0 4px 14px rgba(8,66,140,0.28)',
              }}
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              Open Help · raise a ticket
            </Link>
          </div>

          <div className="mx-auto mb-6 flex max-w-lg flex-wrap justify-center gap-2">
            {(
              [
                ['all', 'All'],
                ['candidate', 'Employees / candidates'],
                ['employer', 'Employers'],
              ] as const
            ).map(([id, label]) => {
              const active = audience === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAudience(id)}
                  className="rounded-full px-4 py-2 text-xs font-bold transition"
                  style={
                    active
                      ? {
                          background: `linear-gradient(135deg, ${C.brandDeep}, ${C.brand} 50%, ${C.bright})`,
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(8,66,140,0.28)',
                        }
                      : {
                          background: C.surface,
                          color: C.muted,
                          border: `1px solid ${C.border}`,
                        }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative mx-auto max-w-xl">
            <div className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: C.bright }}>
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search questions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 w-full rounded-[20px] border bg-white pl-14 pr-6 text-[15px] outline-none transition placeholder:text-slate-400 focus:border-[#28A8E1] focus:ring-4 focus:ring-[#28A8E1]/20"
              style={{ borderColor: C.border, color: C.ink, boxShadow: C.shadow }}
            />
            {totalQuestions > 0 ? (
              <p className="mt-3 text-xs font-semibold" style={{ color: C.muted }}>
                {totalQuestions} question{totalQuestions === 1 ? '' : 's'} · tap to open
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {filteredFaqs.length === 0 ? (
          <p
            className="rounded-[20px] border bg-white px-6 py-14 text-center text-sm"
            style={{ borderColor: C.border, color: C.muted, boxShadow: C.shadow }}
          >
            No matching questions. Try another search, or{' '}
            <Link href="/help" className="font-bold underline" style={{ color: C.brand }}>
              raise a Help ticket
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-10">
            {filteredFaqs.map((cat) => (
              <div key={cat.id}>
                <div className="mb-3.5 flex items-center gap-3 px-0.5">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-md"
                    style={{
                      background: `linear-gradient(145deg, ${C.brandDeep} 0%, ${C.brand} 48%, ${C.bright} 100%)`,
                      boxShadow: '0 8px 20px rgba(8,66,140,0.22)',
                    }}
                  >
                    {faqIcon(cat.iconName, 'h-[22px] w-[22px]')}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight" style={{ color: C.ink }}>
                      {cat.category}
                    </h2>
                    <p
                      className="text-[11px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: C.bright }}
                    >
                      {cat.audience === 'employer'
                        ? 'Employers'
                        : cat.audience === 'candidate'
                          ? 'Employees / candidates'
                          : 'Everyone'}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {cat.questions.map((item, qIndex) => {
                    const open = openId === item.id;
                    return (
                      <li key={item.id}>
                        <div
                          className="overflow-hidden rounded-[18px] border bg-white transition-all duration-300"
                          style={{
                            borderColor: open ? 'rgba(40,168,225,0.45)' : C.border,
                            boxShadow: open ? C.shadowOpen : C.shadow,
                            background: open
                              ? 'linear-gradient(165deg, #FFFFFF 0%, #F0F9FF 55%, #E8F6FD 100%)'
                              : C.surface,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFaq(item.id)}
                            aria-expanded={open}
                            className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
                          >
                            <span
                              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition"
                              style={{
                                background: open
                                  ? `linear-gradient(145deg, ${C.brandDeep}, ${C.bright})`
                                  : 'linear-gradient(145deg, rgba(40,168,225,0.14), rgba(8,66,140,0.08))',
                                color: open ? '#fff' : C.brand,
                              }}
                            >
                              {questionRowIcon(qIndex, 'h-4 w-4', open)}
                            </span>
                            <span
                              className="min-w-0 flex-1 pt-1.5 text-[15px] font-semibold leading-snug"
                              style={{ color: C.ink }}
                            >
                              {item.q}
                            </span>
                            <span
                              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition"
                              style={{
                                background: open
                                  ? `linear-gradient(135deg, ${C.brand}, ${C.bright})`
                                  : 'rgba(15,23,42,0.05)',
                                color: open ? '#fff' : C.muted,
                              }}
                            >
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-300 ${
                                  open ? 'rotate-180' : ''
                                }`}
                              />
                            </span>
                          </button>

                          <div
                            className="grid transition-[grid-template-rows] duration-300 ease-out"
                            style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                          >
                            <div className="overflow-hidden">
                              <div className="px-4 pb-4 sm:px-5">
                                <div
                                  className="relative overflow-hidden rounded-2xl border p-4 sm:p-5"
                                  style={{
                                    borderColor: 'rgba(40,168,225,0.28)',
                                    background:
                                      'linear-gradient(145deg, #053366 0%, #08428C 42%, #0A5AB5 78%, #28A8E1 100%)',
                                  }}
                                >
                                  <div className="relative flex items-center gap-2">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                                      <Sparkles className="h-4 w-4 text-sky-100" strokeWidth={2.25} />
                                    </span>
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-100/90">
                                        Answer
                                      </p>
                                      <p className="flex items-center gap-1 text-xs font-semibold text-white/90">
                                        <BadgeCheck className="h-3.5 w-3.5 text-sky-200" />
                                        FAQ
                                      </p>
                                    </div>
                                  </div>
                                  <p className="relative mt-3 text-[14px] font-medium leading-relaxed text-white/95 sm:text-[15px]">
                                    {item.a}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          <div
            className="rounded-[20px] border bg-white p-5"
            style={{ borderColor: C.border, boxShadow: C.shadow }}
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: C.softBright }}
            >
              <LifeBuoy className="h-5 w-5" style={{ color: C.bright }} />
            </span>
            <h3 className="mt-3 text-sm font-bold" style={{ color: C.ink }}>
              Need support?
            </h3>
            <p className="mt-1 text-sm" style={{ color: C.muted }}>
              See common problems and raise a ticket on the Help page.
            </p>
            <Link
              href="/help"
              className="mt-3 inline-flex text-sm font-bold hover:underline"
              style={{ color: C.brand }}
            >
              Go to Help →
            </Link>
          </div>
          <div
            className="rounded-[20px] border bg-white p-5"
            style={{ borderColor: C.border, boxShadow: C.shadow }}
          >
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'rgba(251,146,60,0.12)' }}
            >
              <Mail className="h-5 w-5 text-orange-500" />
            </span>
            <h3 className="mt-3 text-sm font-bold" style={{ color: C.ink }}>
              Contact
            </h3>
            <p className="mt-1 text-sm" style={{ color: C.muted }}>
              Prefer email? Reach us from Contact or book an employer demo.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-flex text-sm font-bold hover:underline"
              style={{ color: C.brand }}
            >
              Contact us →
            </Link>
          </div>
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs" style={{ color: C.muted }}>
          <Clock className="h-3.5 w-3.5" />
          Guides update as product features change
        </p>
      </section>
    </div>
  );
}
