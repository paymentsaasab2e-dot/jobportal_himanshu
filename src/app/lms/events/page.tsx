'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Monitor,
  PlusCircle,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { AISectionHeading } from '../components/ai';
import { useLmsOverlay } from '../components/overlays/LmsOverlayProvider';
import { useLmsToast } from '../components/ux/LmsToastProvider';
import {
  LMS_CARD_INTERACTIVE,
  LMS_INPUT_CLASS,
  LMS_PRIMARY_LINK_CLASS,
  LMS_SECTION_TITLE,
} from '../constants';
import { LmsPageHeader } from '../components/LmsPageHeader';
import { eventsRecommendedIntro } from '../data/ai-mock';
import { useLmsState } from '../state/LmsStateProvider';
import { EventRegisterSheet } from './EventRegisterSheet';
import { fetchEvents, registerForEvent, unregisterFromEvent } from '../api/client';
import { fetchPublicEvents, type PortalEventRow } from '@/lib/public-events-api';
import { LmsSkeleton } from '../components/states/LmsSkeleton';
import {
  eventTypeLabel,
  listOgEvents,
  mapJobsToOgEvents,
  type OgEventType,
} from '@/lib/og-events-store';
import { fetchPortalJobsList } from '@/lib/query/portal-api';
import { DEFAULT_LOCALE } from '@/lib/i18n';

function modeBadge(mode: 'Online' | 'Offline' | string) {
  if (mode.toLowerCase() === 'online') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
        <Monitor className="h-3 w-3" strokeWidth={2} />
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-900">
      <MapPin className="h-3 w-3" strokeWidth={2} />
      Offline
    </span>
  );
}

function typeBadge(type: string) {
  return (
    <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-gray-700">
      {type}
    </span>
  );
}

type TabKey = 'All' | 'Upcoming' | 'Registered' | 'Past';
type KindFilter = 'all' | 'workshop' | OgEventType;

type DisplayEvent = {
  id: string;
  title: string;
  description: string;
  type: string;
  kind: KindFilter;
  mode: string;
  dateStr: string;
  status: 'upcoming' | 'past';
  isRegistered: boolean;
  tags: string[];
  registeredCount: number;
  startsIn: string;
  matchLabel: string;
  overview: string;
  href: string;
  coverSrc?: string;
  source: 'lms' | 'catalog' | 'job';
};

const EVENT_COVER_MAP: Record<
  string,
  {
    src: string;
    alt: string;
    eyebrow: string;
  }
> = {
  'evt-101': {
    src: '/lms/event-covers/ui-portfolio-critique-live.svg',
    alt: 'UI portfolio critique live event cover',
    eyebrow: 'Live workshop',
  },
  'evt-102': {
    src: '/lms/event-covers/meet-the-talent-team.svg',
    alt: 'Meet the talent team event cover',
    eyebrow: 'Career networking',
  },
  'evt-103': {
    src: '/lms/event-covers/negotiation-office-hours.svg',
    alt: 'Negotiation office hours event cover',
    eyebrow: 'Offer stage',
  },
  default: {
    src: '/lms/event-covers/ui-portfolio-critique-live.svg',
    alt: 'Event',
    eyebrow: 'Live Event',
  },
};

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'job', label: 'Jobs' },
  { id: 'walk-in', label: 'Walk-in' },
  { id: 'seminar', label: 'Seminar' },
  { id: 'webinar', label: 'Webinar' },
  { id: 'job-fair', label: 'Job fair' },
  { id: 'workshop', label: 'LMS sessions' },
];

function portalSourceLabel(source?: string, createdByName?: string) {
  if (source === 'hq') {
    return createdByName ? `Posted by HQ · ${createdByName}` : 'Posted by HQ';
  }
  if (source === 'tenant') {
    return createdByName ? `Employer event · ${createdByName}` : 'Employer event';
  }
  return 'Live session on HRYantra';
}

function mapPortalKind(type: string): KindFilter {
  const normalized = String(type || 'workshop').toLowerCase().replace(/\s+/g, '-');
  if (normalized === 'walk-in' || normalized === 'walkin') return 'walk-in';
  if (normalized === 'seminar') return 'seminar';
  if (normalized === 'webinar') return 'webinar';
  if (normalized === 'job-fair') return 'job-fair';
  if (normalized === 'job') return 'job';
  return 'workshop';
}

export default function LmsEventsPage() {
  const router = useRouter();
  const overlay = useLmsOverlay();
  const toast = useLmsToast();
  const { addPlannedItem } = useLmsState();

  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [portalEvents, setPortalEvents] = useState<PortalEventRow[]>([]);
  const [registrationByEventId, setRegistrationByEventId] = useState<Record<string, boolean>>({});
  const [jobEvents, setJobEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [publishedEvents, authEvents, jobs] = await Promise.all([
          fetchPublicEvents(undefined, 'all').catch(() => []),
          fetchEvents().catch(() => []),
          fetchPortalJobsList(DEFAULT_LOCALE, 20).catch(() => []),
        ]);
        setPortalEvents(Array.isArray(publishedEvents) ? publishedEvents : []);
        const registrationMap: Record<string, boolean> = {};
        if (Array.isArray(authEvents)) {
          authEvents.forEach((ev: { id?: string; isRegistered?: boolean }) => {
            if (ev?.id) registrationMap[String(ev.id)] = Boolean(ev.isRegistered);
          });
        }
        setRegistrationByEventId(registrationMap);
        setJobEvents(
          mapJobsToOgEvents(jobs, 16).map((ev) => ({
            id: ev.id,
            title: ev.title,
            description: ev.body,
            type: eventTypeLabel(ev.type),
            kind: 'job' as const,
            mode: ev.location ? 'Offline' : 'Online',
            dateStr: ev.whenLabel,
            status: 'upcoming' as const,
            isRegistered: false,
            tags: ev.tags,
            registeredCount: ev.interestedCount,
            startsIn: 'Open now',
            matchLabel: `${ev.hostName} · apply on HRYantra`,
            overview: ev.body,
            href: ev.actionHref || '/explore-jobs',
            coverSrc: ev.imageUrl,
            source: 'job' as const,
          })),
        );
      } catch {
        toast.push({ title: 'Error', message: 'Failed to load some events', tone: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [toast]);

  const catalogEvents = useMemo<DisplayEvent[]>(() => {
    return listOgEvents().map((ev) => ({
      id: ev.id,
      title: ev.title,
      description: ev.body,
      type: eventTypeLabel(ev.type),
      kind: ev.type,
      mode: ev.location ? 'Offline' : 'Online',
      dateStr: ev.whenLabel,
      status: 'upcoming' as const,
      isRegistered: false,
      tags: ev.tags,
      registeredCount: ev.interestedCount,
      startsIn: ev.whenLabel,
      matchLabel: 'Open to everyone · full LMS catalog',
      overview: ev.body,
      href: '/community',
      coverSrc: ev.imageUrl,
      source: 'catalog' as const,
    }));
  }, []);

  const normalizedEvents = useMemo<DisplayEvent[]>(() => {
    const lms = portalEvents.map((ev) => {
      const typeRaw = String(ev.type || 'workshop');
      const scheduled = new Date(ev.scheduledAt);
      return {
        id: String(ev.id),
        title: ev.title,
        description: ev.description,
        type: eventTypeLabel(typeRaw as OgEventType) || typeRaw,
        kind: mapPortalKind(typeRaw),
        mode: ev.mode || 'Online',
        dateStr: scheduled.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
        status: (scheduled > new Date() ? 'upcoming' : 'past') as 'upcoming' | 'past',
        isRegistered: Boolean(registrationByEventId[String(ev.id)]),
        tags: [],
        registeredCount: ev.registrationCount ?? 0,
        startsIn: ev.durationMinutes ? `${ev.durationMinutes} mins` : '60 mins',
        matchLabel: portalSourceLabel(ev.source, ev.createdByName),
        overview: ev.description,
        href: `/lms/events/${ev.id}`,
        source: 'lms' as const,
      };
    });
    return [...jobEvents, ...catalogEvents, ...lms];
  }, [portalEvents, registrationByEventId, catalogEvents, jobEvents]);

  const displayedEvents = useMemo(() => {
    return normalizedEvents.filter((ev) => {
      if (activeTab === 'Upcoming' && ev.status !== 'upcoming') return false;
      if (activeTab === 'Past' && ev.status !== 'past') return false;
      if (activeTab === 'Registered' && !ev.isRegistered) return false;
      if (kindFilter !== 'all' && ev.kind !== kindFilter) return false;

      const qs = searchQuery.trim().toLowerCase();
      if (
        qs &&
        !ev.title.toLowerCase().includes(qs) &&
        !ev.type.toLowerCase().includes(qs) &&
        !ev.tags.some((t) => t.toLowerCase().includes(qs))
      ) {
        return false;
      }
      return true;
    });
  }, [activeTab, searchQuery, normalizedEvents, kindFilter]);

  const recommendedEvents = useMemo(() => {
    return normalizedEvents
      .filter((e) => e.status === 'upcoming' && !e.isRegistered)
      .slice(0, 3);
  }, [normalizedEvents]);

  const openRegister = (
    e: React.MouseEvent,
    id: string,
    title: string,
    currentlyRegistered: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    overlay.openSheet({
      title: currentlyRegistered ? 'Cancel Registration' : 'Register for Event',
      description: currentlyRegistered
        ? 'You are about to cancel your spot.'
        : 'Connects right to the backend DB.',
      content: <EventRegisterSheet title={title} isRegistered={currentlyRegistered} />,
      footer: (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={
              currentlyRegistered
                ? 'flex-1 rounded-xl bg-red-500 px-5 py-2.5 text-[0.8125rem] font-medium text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]'
                : `flex-1 ${LMS_PRIMARY_LINK_CLASS}`
            }
            onClick={async () => {
              try {
                setRegistrationByEventId((prev) => ({
                  ...prev,
                  [id]: !currentlyRegistered,
                }));

                if (currentlyRegistered) {
                  await unregisterFromEvent(id);
                  toast.push({ title: 'Registration Cancelled', message: title, tone: 'success' });
                } else {
                  await registerForEvent(id);
                  toast.push({ title: 'Registered', message: title, tone: 'success' });
                }
                overlay.close();
              } catch {
                setRegistrationByEventId((prev) => ({
                  ...prev,
                  [id]: currentlyRegistered,
                }));
                toast.push({
                  title: 'Error',
                  message: 'Failed to update registration',
                  tone: 'destructive',
                });
                overlay.close();
              }
            }}
          >
            {currentlyRegistered ? 'Unregister' : 'Confirm Registration'}
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
            onClick={overlay.close}
          >
            Cancel
          </button>
        </div>
      ),
      size: 'md',
    });
  };

  const handlePlanClick = (e: React.MouseEvent, ev: DisplayEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addPlannedItem({
      id: `evt-${ev.id}`,
      type: 'event',
      label: ev.title,
      href: ev.href,
      sourceModule: 'events',
      sourceLabel: 'LMS Events',
    });
    toast.push({
      title: 'Added to plan',
      message: 'Event marked in Career Path plan.',
      tone: 'success',
    });
  };

  const registeredCount = normalizedEvents.filter((e) => e.isRegistered).length;

  return (
    <div className="space-y-8 pb-10">
      <LmsPageHeader
        title="Events"
        subtitle="All event types in one place — HQ events, employer sessions, walk-ins, seminars, webinars, job fairs, and job postings."
      />

      {!loading &&
      activeTab === 'All' &&
      kindFilter === 'all' &&
      !searchQuery &&
      recommendedEvents.length > 0 ? (
        <section className="space-y-4">
          <AISectionHeading title="Recommended live sessions" />
          <p className="-mt-2 text-sm font-normal text-gray-500">{eventsRecommendedIntro}</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recommendedEvents.map((ev) => (
              <EventCard
                key={`rec-${ev.id}`}
                ev={ev}
                registered={ev.isRegistered}
                onRegister={(e) => openRegister(e, ev.id, ev.title, ev.isRegistered)}
                onPlan={(e) => handlePlanClick(e, ev)}
                onApply={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(ev.href);
                }}
                index={ev.id.length}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-6 pt-2">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex w-fit rounded-xl bg-gray-100 p-1">
            {(['All', 'Upcoming', 'Registered', 'Past'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'Registered' && registeredCount > 0 ? (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#28A8E1]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#28A8E1]">
                    {registeredCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${LMS_INPUT_CLASS} py-2 pl-9 pr-4`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {KIND_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKindFilter(id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                kindFilter === id
                  ? 'bg-[#1B3A5F] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <LmsSkeleton lines={4} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <LmsSkeleton lines={4} />
            </div>
          </div>
        ) : displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 py-20">
            <CalendarDays className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gray-500">
              No events found matching your criteria.
            </p>
            {searchQuery || activeTab !== 'All' || kindFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('All');
                  setKindFilter('all');
                }}
                className="mt-4 text-sm font-semibold text-[#28A8E1] hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedEvents.map((ev, i) => (
              <EventCard
                key={`list-${ev.id}`}
                ev={ev}
                registered={ev.isRegistered}
                onRegister={(e) => openRegister(e, ev.id, ev.title, ev.isRegistered)}
                onPlan={(e) => handlePlanClick(e, ev)}
                onApply={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(ev.href);
                }}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3 pt-6">
        <h2 className={LMS_SECTION_TITLE}>Urgency tips</h2>
        <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/30 p-4 text-sm text-amber-900 shadow-sm">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" strokeWidth={2} />
          <span className="leading-relaxed">
            Events for candidates now live in Office Gossips → Events (personalized + search). This
            LMS page still powers the catalog data in the background.
          </span>
        </div>
      </section>
    </div>
  );
}

function EventCard({
  ev,
  registered,
  onRegister,
  onPlan,
  onApply,
  index,
}: {
  ev: DisplayEvent;
  registered: boolean;
  onRegister: React.MouseEventHandler;
  onPlan: React.MouseEventHandler;
  onApply: React.MouseEventHandler;
  index: number;
}) {
  const keys = Object.keys(EVENT_COVER_MAP);
  const coverKey = keys[index % keys.length] || 'default';
  const mapped = EVENT_COVER_MAP[coverKey] ?? EVENT_COVER_MAP.default;
  const coverSrc = ev.coverSrc || mapped.src;
  const isExternalCover = Boolean(ev.coverSrc?.startsWith('http'));
  const isJob = ev.source === 'job';
  const isLms = ev.source === 'lms';

  return (
    <Link href={ev.href} className={`${LMS_CARD_INTERACTIVE} group`}>
      <div className="-mx-6 -mt-6 overflow-hidden border-b border-slate-200/70 sm:-mx-7 sm:-mt-7">
        <div className="relative aspect-[16/9] bg-slate-100">
          {isExternalCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              alt={ev.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <Image
              src={coverSrc}
              alt={mapped.alt}
              fill
              sizes="(min-width: 1280px) 380px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-900/5 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800 shadow-sm">
              {ev.type}
            </span>
          </div>
          <div
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/88 shadow-sm backdrop-blur-sm ${
              registered
                ? 'text-emerald-700'
                : isJob
                  ? 'text-[#0A66C2]'
                  : ev.status === 'past'
                    ? 'text-gray-500'
                    : 'text-amber-800'
            }`}
          >
            {registered ? (
              <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
            ) : isJob ? (
              <Briefcase className="h-5 w-5" strokeWidth={2} />
            ) : (
              <CalendarDays className="h-5 w-5" strokeWidth={2} />
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-4 pt-5">
        <div className="relative pr-4">
          <h2 className="text-lg font-bold leading-snug text-gray-900">{ev.title}</h2>
          <ArrowRight className="absolute right-0 top-1 h-4 w-4 text-gray-300 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          <p className="mt-1 text-sm font-normal text-gray-500">{ev.dateStr}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {typeBadge(ev.type)}
          {modeBadge(ev.mode)}
        </div>

        {ev.status !== 'past' ? (
          <div className="flex items-start gap-2 rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" strokeWidth={2} />
            <p className="text-xs font-medium leading-relaxed text-violet-900">
              {ev.matchLabel || 'Recommended'}
            </p>
          </div>
        ) : null}

        {ev.overview ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">{ev.overview}</p>
        ) : null}

        <div className="flex flex-col gap-1.5 pt-1 text-[11px] font-semibold text-gray-500">
          <span
            className={`inline-flex items-center gap-1.5 ${
              ev.status === 'past' ? 'text-gray-500' : 'text-emerald-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            {ev.registeredCount} people{' '}
            {ev.status === 'past' ? 'attended' : isJob ? 'interested' : 'already registered'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            {ev.startsIn}
          </span>
        </div>

        {ev.status === 'upcoming' ? (
          <div
            className="flex flex-col gap-2 pt-1 sm:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {isJob ? (
              <button
                type="button"
                onClick={onApply}
                className="flex-1 cursor-pointer rounded-xl border border-[#0A66C2] bg-[#0A66C2] px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-[#004182] hover:shadow-sm active:scale-[0.98]"
              >
                Apply now
              </button>
            ) : isLms ? (
              <button
                type="button"
                onClick={onRegister}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.98] ${
                  registered
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                {registered ? 'Registered' : 'Register'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onApply}
                className="flex-1 cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
              >
                View details
              </button>
            )}
            <button
              type="button"
              onClick={onPlan}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100"
            >
              <PlusCircle className="h-3 w-3" />
              Plan
            </button>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
