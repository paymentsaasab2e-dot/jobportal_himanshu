'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Monitor, MapPin, Users, Clock, Sparkles } from 'lucide-react';
import { LMS_PAGE_SUBTITLE, LMS_SECTION_TITLE } from '../../constants';
import { EventDetailClient } from './event-detail-client';
import { fetchEvents } from '../../api/client';
import { LmsSkeleton } from '../../components/states/LmsSkeleton';

export default function LmsEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const events = await fetchEvents();
        const found = events.find((e: any) => e.id === id);
        if (found) {
          setEvent({
            ...found,
            type: found.type,
            mode: found.mode,
            date: new Date(found.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
            status: new Date(found.scheduledAt) > new Date() ? 'upcoming' : 'past',
            isRegistered: found.isRegistered,
            registeredCount: Math.floor(Math.random() * 200) + 50,
            startsIn: found.durationMinutes ? `${found.durationMinutes} mins` : '60 mins',
            matchLabel: 'Recommended for you',
            overview: found.description,
            whyAttend: ['Deepen expertise in relevant topics.', 'Connect with industry peers.', 'Real-time Q&A integration.'],
            speaker: found.hostName || 'Industry Expert',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <LmsSkeleton lines={8} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-8 pb-10">
        <Link href="/lms/events" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <div className="flex flex-col items-center justify-center py-24 bg-gray-50 border border-gray-100 rounded-3xl">
          <CalendarDays className="h-10 w-10 text-gray-300 mb-4" strokeWidth={1.5} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-500 font-medium text-sm max-w-sm text-center">
            The event you&apos;re looking for was not found or has been removed from the catalog.
          </p>
          <Link href="/lms/events" className="mt-6 rounded-xl bg-[#28A8E1] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#208bc0]">
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="min-w-0">
        <Link
          href="/lms/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:underline mb-4 transition-all"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to events
        </Link>
        <div className="flex flex-wrap items-center gap-3 mb-3">
           <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 border border-gray-200 capitalize">
            {event.type}
          </span>
          {event.mode.toLowerCase() === 'online' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800 border border-sky-200">
              <Monitor className="h-4 w-4" strokeWidth={2} />
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-900 border border-orange-200">
              <MapPin className="h-4 w-4" strokeWidth={2} />
              Offline
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">{event.title}</h1>
        <p className={`${LMS_PAGE_SUBTITLE} mt-2 max-w-2xl`}>{event.overview}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className={LMS_SECTION_TITLE}>Why you should attend</h2>
            <ul className="space-y-3">
              {event.whyAttend.map((reason: string, i: number) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-gray-200 transition-colors">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{reason}</span>
                </li>
              ))}
            </ul>
          </section>
          
          <section className="space-y-4">
            <h2 className={LMS_SECTION_TITLE}>Event details</h2>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4 md:space-y-0 md:divide-y md:divide-gray-100 shadow-sm">
                <div className="flex items-start gap-3 md:pb-4 md:items-center">
                    <CalendarDays className="h-5 w-5 text-gray-400 mt-0.5 md:mt-0" />
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Date & Time</p>
                        <p className="text-sm text-gray-600">{event.date} • {event.startsIn}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 md:py-4 md:items-center">
                    <Users className="h-5 w-5 text-gray-400 mt-0.5 md:mt-0" />
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Speaker / Host</p>
                        <p className="text-sm text-gray-600">{event.speaker}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 md:pt-4 md:items-center">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5 md:mt-0" />
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Registered</p>
                        <p className="text-sm text-gray-600">{event.registeredCount} people are attending</p>
                    </div>
                </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm overflow-hidden flex flex-col items-stretch space-y-6">
             <div className="absolute inset-x-0 -top-px h-1 bg-gradient-to-r from-[#28A8E1] to-violet-500"></div>
             <div>
                <p className="text-lg font-bold text-gray-900 mb-1">Registration</p>
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-1.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-violet-600" strokeWidth={2} />
                  <p className="text-xs font-medium text-violet-900">{event.matchLabel}</p>
                </div>
             </div>

             <EventDetailClient eventId={event.id} title={event.title} status={event.status} />

             <p className="text-xs text-center text-gray-500 pt-2 border-t border-gray-100">
                You can add this event to your career plan or register. Both update your backend database seamlessly.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
