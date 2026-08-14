'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Loader2, MapPin, Users } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useTokensOptional } from '@/components/tokens/TokensContext';
import {
  fetchPublicEventById,
  registerForPublicEvent,
  type PortalEventRow,
} from '@/lib/public-events-api';
import { localizePath, DEFAULT_LOCALE } from '@/lib/i18n';
import { TokenSpendButton, CourseAccessBadge } from '@/app/lms/components/ux/TokenSpendButton';
import { eventCtaButtonLabel } from '@/lib/public-events-api';

function formatEventDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PublicEventDetailPage({ eventId }: { eventId: string }) {
  const { isAuthenticated, token } = useAuth();
  const tokens = useTokensOptional();
  const [event, setEvent] = useState<PortalEventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchPublicEventById(eventId);
        if (!cancelled) setEvent(row);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleApply() {
    if (!token) return;
    setApplying(true);
    setMessage(null);
    try {
      await registerForPublicEvent(token, eventId);
      setApplied(true);
      setMessage('You are registered for this event.');
      void tokens?.refresh?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-28 text-center">
        <p className="text-lg font-semibold text-slate-900">Event not found</p>
        <Link
          href={localizePath('/events', DEFAULT_LOCALE)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white pb-20 pt-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Link
          href={localizePath('/events', DEFAULT_LOCALE)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
        >
          <ArrowLeft className="h-4 w-4" />
          All events
        </Link>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 to-white px-6 py-8 sm:px-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                {event.type}
              </span>
              <CourseAccessBadge accessTier={event.accessType === 'purchase' ? 'premium' : 'free'} tokenCost={event.tokenCost} />
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                <Users className="h-4 w-4" />
                {event.registrationCount} registered
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {event.title}
            </h1>
            <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-sky-500" />
                {formatEventDate(event.scheduledAt)}
              </p>
              <p className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                {event.location || 'Location TBA'}
              </p>
            </div>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-slate-700">
                {event.description}
              </p>
            </section>

            {event.sections?.length ? (
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Event sections
                </h2>
                {event.sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-5 py-4"
                  >
                    <h3 className="font-bold text-slate-900">{section.title || 'Section'}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {section.content}
                    </p>
                  </div>
                ))}
              </section>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              {!isAuthenticated ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">Sign in to apply for this event.</p>
                  <Link
                    href={localizePath('/login?redirect=' + encodeURIComponent(`/events/${eventId}`), DEFAULT_LOCALE)}
                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Sign in to apply
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Ready to attend?</p>
                    {message ? <p className="mt-1 text-sm text-slate-600">{message}</p> : null}
                  </div>
                  {applied ? (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-80"
                    >
                      Applied
                    </button>
                  ) : (
                    <TokenSpendButton
                      tokenCost={Number(event.tokenCost) || 0}
                      label={eventCtaButtonLabel({
                        ctaLabel: event.ctaLabel,
                        tokenCost: event.tokenCost,
                      })}
                      disabled={applying}
                      onSpend={handleApply}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
