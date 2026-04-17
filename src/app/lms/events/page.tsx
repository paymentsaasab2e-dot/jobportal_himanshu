'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
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
import { LMS_CARD_INTERACTIVE, LMS_PAGE_SUBTITLE, LMS_SECTION_TITLE } from '../constants';
import { eventsRecommendedIntro } from '../data/ai-mock'; // just the static strings
import { useLmsState } from '../state/LmsStateProvider';
import { EventRegisterSheet } from './EventRegisterSheet';
import { fetchEvents, registerForEvent, unregisterFromEvent } from '../api/client';
import { LmsSkeleton } from '../components/states/LmsSkeleton';

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
    <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 capitalize">
      {type}
    </span>
  );
}

type TabKey = 'All' | 'Upcoming' | 'Registered' | 'Past';

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
  }
};

export default function LmsEventsPage() {
  const overlay = useLmsOverlay();
  const toast = useLmsToast();
  const { addPlannedItem } = useLmsState(); // We only use state for planning

  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [backendEvents, setBackendEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await fetchEvents();
        setBackendEvents(data || []);
      } catch (err) {
        toast.push({ title: 'Error', message: 'Failed to load events', tone: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [toast]);

  // Transform backend models into frontend render models
  const normalizedEvents = useMemo(() => {
    return backendEvents.map(ev => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      type: ev.type,
      mode: ev.mode,
      dateStr: new Date(ev.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      status: new Date(ev.scheduledAt) > new Date() ? 'upcoming' : 'past',
      isRegistered: ev.isRegistered,
      tags: ev.tags || [],
      registeredCount: Math.floor(Math.random() * 200) + 50, // Mock count just for UI flavor
      startsIn: ev.durationMinutes ? `${ev.durationMinutes} mins` : '60 mins',
      matchLabel: 'Recommended for you',
      overview: ev.description,
    }));
  }, [backendEvents]);

  const displayedEvents = useMemo(() => {
    return normalizedEvents.filter((ev) => {
      if (activeTab === 'Upcoming' && ev.status !== 'upcoming') return false;
      if (activeTab === 'Past' && ev.status !== 'past') return false;
      if (activeTab === 'Registered' && !ev.isRegistered) return false;

      const qs = searchQuery.trim().toLowerCase();
      if (
        qs &&
        !ev.title.toLowerCase().includes(qs) &&
        !ev.type.toLowerCase().includes(qs)
      ) {
        return false;
      }
      return true;
    });
  }, [activeTab, searchQuery, normalizedEvents]);

  const recommendedEvents = useMemo(() => {
    return normalizedEvents
      .filter((e) => e.status === 'upcoming' && !e.isRegistered)
      .slice(0, 2);
  }, [normalizedEvents]);

  const openRegister = (e: React.MouseEvent, id: string, title: string, currentlyRegistered: boolean) => {
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
            className={`flex-1 rounded-xl ${currentlyRegistered ? 'bg-red-500' : 'bg-[#28A8E1]'} px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]`}
            onClick={async () => {
              try {
                // Optimistic UI updates
                setBackendEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isRegistered: !currentlyRegistered } : ev));
                
                if (currentlyRegistered) {
                  await unregisterFromEvent(id);
                  toast.push({ title: 'Registration Cancelled', message: title, tone: 'success' });
                } else {
                  await registerForEvent(id);
                  toast.push({ title: 'Registered', message: title, tone: 'success' });
                }
                overlay.close();
              } catch (err) {
                // Restore state
                setBackendEvents(prev => prev.map(ev => ev.id === id ? { ...ev, isRegistered: currentlyRegistered } : ev));
                toast.push({ title: 'Error', message: 'Failed to update registration', tone: 'destructive' });
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

  const handlePlanClick = (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    addPlannedItem({
      id: `evt-${id}`,
      type: 'event',
      label: title,
      href: `/lms/events/${id}`,
      sourceModule: 'events',
      sourceLabel: 'LMS Events',
    });
    toast.push({ title: 'Added to plan', message: 'Event marked in Career Path plan.', tone: 'success' });
  };

  const registeredCount = normalizedEvents.filter(e => e.isRegistered).length;

  return (
    <div className="space-y-8 pb-10">
      <div className="min-w-0">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Events</h1>
        <p className={LMS_PAGE_SUBTITLE}>
          Career-relevant sessions with urgency cues - tied directly to your active DB.
        </p>
      </div>

      {!loading && activeTab === 'All' && !searchQuery && recommendedEvents.length > 0 ? (
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
                onPlan={(e) => handlePlanClick(e, ev.id, ev.title)}
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
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none transition-all focus:border-[#28A8E1] focus:ring-1 focus:ring-[#28A8E1]"
            />
          </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><LmsSkeleton lines={4} /></div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><LmsSkeleton lines={4} /></div>
           </div>
        ) : displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 py-20">
            <CalendarDays className="mb-3 h-10 w-10 text-gray-300" strokeWidth={1.5} />
            <p className="text-sm font-medium text-gray-500">
              No events found matching your criteria.
            </p>
            {searchQuery || activeTab !== 'All' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('All');
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
                onPlan={(e) => handlePlanClick(e, ev.id, ev.title)}
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
            High-registration workshops often fill first - frontend changes fully persist directly to your Database API limits and registration records.
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
  index,
}: {
  ev: any;
  registered: boolean;
  onRegister: React.MouseEventHandler;
  onPlan: React.MouseEventHandler;
  index: number;
}) {
  const keys = Object.keys(EVENT_COVER_MAP);
  const coverKey = keys[index % keys.length] || 'default';
  const cover = EVENT_COVER_MAP[coverKey] ?? EVENT_COVER_MAP.default;

  return (
    <Link href={`/lms/events/${ev.id}`} className={`${LMS_CARD_INTERACTIVE} group`}>
      <div className="-mx-6 -mt-6 overflow-hidden border-b border-slate-200/70 sm:-mx-7 sm:-mt-7">
        <div className="relative aspect-[16/9] bg-slate-100">
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="(min-width: 1280px) 380px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-900/5 to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800 shadow-sm">
              {cover.eyebrow}
            </span>
          </div>
          <div
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/88 shadow-sm backdrop-blur-sm ${
              registered
                ? 'text-emerald-700'
                : ev.status === 'past'
                  ? 'text-gray-500'
                  : 'text-amber-800'
            }`}
          >
            {registered ? (
              <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
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
            <p className="text-xs font-medium leading-relaxed text-violet-900">{ev.matchLabel || 'Recommended'}</p>
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
            {ev.registeredCount} people {ev.status === 'past' ? 'attended' : 'already registered'}
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
            <button
              type="button"
              onClick={onPlan}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-100"
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
