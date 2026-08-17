'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
  Monitor,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { LMS_SECTION_TITLE } from '../../constants';
import { CourseAccessBadge } from '../../components/ux/TokenSpendButton';
import { EventDetailClient } from './event-detail-client';
import { EventMediaCarousel } from './EventMediaCarousel';
import { fetchPublicEventById, type PortalEventMediaItem, type PortalEventRow } from '@/lib/public-events-api';
import { fetchEventDetail } from '../../api/client';
import { LmsSkeleton } from '../../components/states/LmsSkeleton';

type EventDetail = {
  id: string;
  title: string;
  type: string;
  mode: string;
  date: string;
  timeLabel: string;
  status: 'upcoming' | 'past';
  isRegistered: boolean;
  registeredCount: number;
  startsIn: string;
  matchLabel: string;
  overview: string;
  whyAttend: string[];
  speaker: string;
  location: string;
  sections: { id: string; title: string; content: string }[];
  media: PortalEventMediaItem[];
  tokenCost: number;
  accessType: string;
  ctaLabel: string;
};

function portalSourceLabel(source?: string, createdByName?: string) {
  if (source === 'hq') {
    return createdByName ? `Posted by HQ · ${createdByName}` : 'Posted by HQ';
  }
  if (source === 'tenant') {
    return createdByName ? `Employer event · ${createdByName}` : 'Employer event';
  }
  return 'Recommended for you';
}

function mapPublicEvent(found: PortalEventRow, isRegistered = false): EventDetail {
  const scheduled = new Date(found.scheduledAt);
  const sections = Array.isArray(found.sections) ? found.sections : [];
  const whyAttend =
    sections.length > 0
      ? sections.map((section) => section.title || section.content).filter(Boolean)
      : [
          'Deepen expertise in relevant topics.',
          'Connect with industry peers.',
          'Real-time Q&A integration.',
        ];

  return {
    id: found.id,
    title: found.title,
    type: found.type,
    mode: found.mode,
    date: scheduled.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timeLabel: scheduled.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
    status: scheduled > new Date() ? 'upcoming' : 'past',
    isRegistered,
    registeredCount: found.registrationCount ?? 0,
    startsIn: found.durationMinutes ? `${found.durationMinutes} mins` : '60 mins',
    matchLabel: portalSourceLabel(found.source, found.createdByName),
    overview: found.description,
    whyAttend,
    speaker: found.hostName || found.createdByName || 'Industry Expert',
    location: found.location || 'Location TBA',
    sections,
    media: Array.isArray(found.media) ? found.media : [],
    tokenCost: Number(found.tokenCost) || 0,
    accessType: found.accessType || (Number(found.tokenCost) > 0 ? 'purchase' : 'free'),
    ctaLabel: found.ctaLabel || 'Join',
  };
}

export default function LmsEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);

  function handleBack() {
    const from = searchParams.get('from');
    if (from && from.startsWith('/') && !from.startsWith('//') && !from.includes('://')) {
      router.push(from);
      return;
    }
    if (typeof window !== 'undefined') {
      const ref = document.referrer;
      if (ref) {
        try {
          const url = new URL(ref);
          if (url.origin === window.location.origin && !url.pathname.includes(`/lms/events/${id}`)) {
            router.back();
            return;
          }
        } catch {
          // ignore invalid referrer
        }
      }
      if (window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push('/lms/events');
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);

      try {
        const found = await fetchPublicEventById(id);
        if (cancelled) return;

        if (!found) {
          setEvent(null);
          setNotFound(true);
          return;
        }

        const mapped = mapPublicEvent(found, false);
        setEvent(mapped);
        setOpenSectionId(mapped.sections[0]?.id ?? null);
        setLoading(false);

        fetchEventDetail(id)
          .then((detail) => {
            if (cancelled || !detail) return;
            setEvent((prev) =>
              prev
                ? {
                    ...prev,
                    isRegistered: Boolean(detail.isRegistered),
                    registeredCount:
                      typeof detail.registrationCount === 'number'
                        ? detail.registrationCount
                        : prev.registeredCount,
                  }
                : prev,
            );
          })
          .catch(() => {});
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setEvent(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <LmsSkeleton lines={8} />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="space-y-8 pb-10">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to events
        </button>
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 py-24">
          <CalendarDays className="mb-4 h-10 w-10 text-gray-300" strokeWidth={1.5} />
          <h2 className="mb-2 text-xl font-bold text-gray-900">We couldn’t find this</h2>
          <p className="max-w-sm text-center text-sm font-medium text-gray-500">
            This event isn’t available. It may have been removed.
          </p>
          <Link href="/lms/events" className="mt-6 rounded-xl bg-[#28A8E1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#208bc0]">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-[#e8dfd3] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#faf7f2]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="space-y-8">
          <EventMediaCarousel media={event.media} title={event.title} />

          <section className="rounded-[1.75rem] border border-[#e8dfd3] bg-white p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.18)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#7c8798]">About this event</p>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#0f2744] sm:text-4xl">{event.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{event.overview}</p>
          </section>

          <section className="space-y-4">
            <h2 className={LMS_SECTION_TITLE}>Why you should attend</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {event.whyAttend.map((reason, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#e8dfd3] bg-[#faf7f2] p-4 shadow-sm"
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Sparkles className="h-4 w-4 text-emerald-600" strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium leading-6 text-slate-800">{reason}</p>
                </div>
              ))}
            </div>
          </section>

          {event.sections.length > 0 ? (
            <section className="space-y-4">
              <h2 className={LMS_SECTION_TITLE}>Event itinerary</h2>
              <div className="space-y-3">
                {event.sections.map((section, index) => {
                  const isOpen = openSectionId === section.id;
                  return (
                    <div key={section.id} className="overflow-hidden rounded-2xl border border-[#e8dfd3] bg-white shadow-sm">
                      <button
                        type="button"
                        onClick={() => setOpenSectionId(isOpen ? null : section.id)}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f2744] text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold uppercase tracking-wide text-[#0f2744]">
                            {section.title || `Section ${index + 1}`}
                          </p>
                          {!isOpen && section.content ? (
                            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{section.content}</p>
                          ) : null}
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && section.content ? (
                        <div className="border-t border-[#efe7dc] px-5 py-4 text-sm leading-7 text-slate-600">
                          {section.content}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-[#e8dfd3] bg-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.22)]">
            <div className="border-b border-[#efe7dc] bg-[#faf7f2] px-6 py-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#1f9d8f] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  {event.type}
                </span>
                <CourseAccessBadge
                  accessTier={event.accessType === 'purchase' ? 'premium' : 'free'}
                  tokenCost={event.tokenCost}
                />
                {event.mode.toLowerCase() === 'online' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0f2744] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    <Monitor className="h-3.5 w-3.5" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0f2744] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    <MapPin className="h-3.5 w-3.5" />
                    In person
                  </span>
                )}
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#fff6dd] px-3 py-1.5 text-xs font-semibold text-[#8a6a00]">
                <Star className="h-4 w-4 fill-[#f5b301] text-[#f5b301]" />
                Featured event
              </div>

              <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-[#0f2744]">{event.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{event.overview}</p>
            </div>

            <div className="space-y-3 px-6 py-5">
              <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-[#0f2744]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Location</p>
                    <p className="text-sm font-bold text-[#0f2744]">{event.location}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-[#0f2744]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Duration</p>
                    <p className="text-sm font-bold text-[#0f2744]">{event.startsIn}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-[#0f2744]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Attendees</p>
                    <p className="text-sm font-bold text-[#0f2744]">{event.registeredCount} registered</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-[#faf7f2] px-4 py-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-[#0f2744]" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Date</p>
                    <p className="text-sm font-bold text-[#0f2744]">
                      {event.date} · {event.timeLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#efe7dc] px-6 py-5">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-1.5">
                <Sparkles className="h-4 w-4 shrink-0 text-violet-600" strokeWidth={2} />
                <p className="text-xs font-medium text-violet-900">{event.matchLabel}</p>
              </div>

              <EventDetailClient
                eventId={event.id}
                title={event.title}
                status={event.status}
                isRegistered={event.isRegistered}
                tokenCost={event.tokenCost}
                ctaLabel={event.ctaLabel}
                onRegistrationChange={(registered) =>
                  setEvent((prev) => (prev ? { ...prev, isRegistered: registered } : prev))
                }
              />

              <p className="mt-4 border-t border-[#efe7dc] pt-4 text-center text-xs text-slate-500">
                Hosted by {event.speaker}. {event.ctaLabel || 'Join'} to save your spot on this event.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
