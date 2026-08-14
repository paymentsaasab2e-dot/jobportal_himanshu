'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, MapPin, Search, Users } from 'lucide-react';
import { fetchPublicEvents, firstPortalEventCover, type PortalEventRow } from '@/lib/public-events-api';
import { localizePath, DEFAULT_LOCALE } from '@/lib/i18n';

function formatEventDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PublicEventsPage() {
  const [events, setEvents] = useState<PortalEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchPublicEvents();
        if (!cancelled) setEvents(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.location.toLowerCase().includes(q),
    );
  }, [events, search]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white pb-20 pt-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Events</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Discover upcoming events
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Workshops, walk-ins, and career sessions published by employers and HQ. Free events are
            open to all; paid ones cost tokens from your wallet.
          </p>
        </div>

        <div className="relative mx-auto mb-8 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, location, or description…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none ring-sky-500/20 focus:border-sky-400 focus:ring-2"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
            No published events yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <Link
                key={event.id}
                href={localizePath(`/events/${event.id}`, DEFAULT_LOCALE)}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
              >
                {(() => {
                  const cover = firstPortalEventCover(event.media);
                  if (!cover) return null;
                  return (
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      {cover.type === 'video' ? (
                        <video
                          src={cover.src}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cover.src}
                          alt={event.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      )}
                    </div>
                  );
                })()}
                <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50 to-white px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
                      {event.type}
                    </span>
                    {Number(event.tokenCost) > 0 ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        {event.tokenCost} tokens
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        Free
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" />
                      {event.registrationCount}
                    </span>
                  </div>
                  <h2 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-sky-700">
                    {event.title}
                  </h2>
                </div>
                <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {event.description}
                  </p>
                  <div className="mt-auto space-y-2 text-xs text-slate-500">
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
