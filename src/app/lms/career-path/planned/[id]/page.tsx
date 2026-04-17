'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Target,
  Info,
  CheckCircle2,
  Trash2,
  BookOpen,
  Lightbulb,
  ExternalLink,
  CalendarDays,
  FileText,
  ClipboardList,
  StickyNote,
} from 'lucide-react';
import Link from 'next/link';
import { useLmsState, type LmsPlannedItem } from '../../../state/LmsStateProvider';
import { useLmsToast } from '../../../components/ux/LmsToastProvider';
import { LMS_CARD_CLASS } from '../../../constants';
import { LmsInlineError } from '../../../components/states/LmsInlineError';
import { LmsSkeleton } from '../../../components/states/LmsSkeleton';

const FALLBACK_TARGETS: Record<LmsPlannedItem['type'], string> = {
  course: '/lms/courses',
  quiz: '/lms/quizzes',
  event: '/lms/events',
  topic: '/lms/career-path',
  note: '/lms/notes',
  resume: '/lms/resume-builder',
};

const SOURCE_TARGETS: Record<string, string> = {
  dashboard: '/lms/courses',
  events: '/lms/events',
  'interview-prep': '/lms/interview-prep',
  'resume-builder': '/lms/resume-builder',
};

function actionLabelForItem(item: LmsPlannedItem) {
  if (item.type === 'course') return 'Open course';
  if (item.type === 'quiz') return 'Open quiz';
  if (item.type === 'event') return 'Open event';
  if (item.type === 'note') return 'Open note';
  if (item.type === 'resume') return 'Open resume';
  return 'Open target';
}

function PlannedItemActionIcon({ item }: { item: LmsPlannedItem }) {
  if (item.type === 'course') {
    return <BookOpen className="h-5 w-5 text-gray-400 group-hover:text-[#28A8E1]" />;
  }
  if (item.type === 'quiz') {
    return <ClipboardList className="h-5 w-5 text-gray-400 group-hover:text-[#28A8E1]" />;
  }
  if (item.type === 'event') {
    return <CalendarDays className="h-5 w-5 text-gray-400 group-hover:text-[#28A8E1]" />;
  }
  if (item.type === 'note') {
    return <StickyNote className="h-5 w-5 text-gray-400 group-hover:text-[#28A8E1]" />;
  }
  if (item.type === 'resume') {
    return <FileText className="h-5 w-5 text-gray-400 group-hover:text-[#28A8E1]" />;
  }
  return <Lightbulb className="h-5 w-5 text-gray-400 group-hover:text-[#28A8E1]" />;
}

export default function PlannedItemDetailPage() {
  const { id: rawId } = useParams();
  const router = useRouter();
  const toast = useLmsToast();
  const { state, removePlannedItem } = useLmsState();

  if (!state.isHydrated) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <div className="space-y-2">
          <LmsSkeleton lines={2} className="max-w-sm" />
        </div>
        <div className={LMS_CARD_CLASS}>
          <LmsSkeleton lines={4} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={LMS_CARD_CLASS}>
            <LmsSkeleton lines={3} />
          </div>
          <div className={LMS_CARD_CLASS}>
            <LmsSkeleton lines={3} />
          </div>
        </div>
      </div>
    );
  }

  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : '';
  const item = state.plannedItems.find((plannedItem) => plannedItem.id === id) ?? null;

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <Link href="/lms/career-path" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to Career Path
        </Link>
        <LmsInlineError
          title="Planned item not found"
          message="This item may have been removed, completed, or never saved to your plan."
        />
      </div>
    );
  }

  const targetHref = item.href ?? FALLBACK_TARGETS[item.type];
  const sourceHref = item.sourceModule ? SOURCE_TARGETS[item.sourceModule] : undefined;
  const handleMarkDone = () => {
    removePlannedItem(item.id);
    toast.push({ title: 'Task concluded', message: 'Planned item tracking cleared.', tone: 'success' });
    router.push('/lms/career-path');
  };

  const handleRemove = () => {
    removePlannedItem(item.id);
    toast.push({ title: 'Item removed', message: 'Removed from your plan.', tone: 'success' });
    router.push('/lms/career-path');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <button
        onClick={() => router.push('/lms/career-path')}
        className="group inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-900"
      >
        <div className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm transition-all group-hover:border-gray-200">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold">Back to Career Path</span>
      </button>

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-violet-700">
              {item.type}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{item.label}</h1>
            <p className="text-sm font-medium text-gray-500">
              Source: <span className="text-gray-900">{item.sourceLabel || 'LMS Module'}</span>
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#28A8E1]">
            <Target className="h-8 w-8" />
          </div>
        </div>

        <div className={`${LMS_CARD_CLASS} border-blue-50 bg-blue-50/10`}>
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#28A8E1]" />
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-tight text-gray-900">Why was this added?</h3>
              <p className="text-sm font-normal leading-relaxed text-gray-700">
                {item.context ||
                  'This item was added to help you strengthen a skill or action surfaced during your LMS journey.'}
              </p>
              {item.sourceModule === 'dashboard' ? (
                <div className="rounded-xl border border-blue-100 bg-white/80 p-3 text-xs font-medium text-blue-800">
                  Part of your personalized dashboard recommendations based on current readiness signals.
                </div>
              ) : null}
              {item.sourceModule === 'interview-prep' ? (
                <div className="rounded-xl border border-blue-100 bg-white/80 p-3 text-xs font-medium text-blue-800">
                  Added from Interview Prep so you can come back to it from the roadmap without losing context.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
          <div className="space-y-3">
            <h3 className="pl-1 text-xs font-bold uppercase tracking-widest text-gray-400">Primary Actions</h3>
            <div className="space-y-2">
              {targetHref ? (
                <Link
                  href={targetHref}
                  className="group inline-flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-[#28A8E1]/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <PlannedItemActionIcon item={item} />
                    <span className="text-sm font-bold text-gray-900">{actionLabelForItem(item)}</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300" />
                </Link>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-bold text-gray-900">Target unavailable</p>
                  <p className="mt-1 text-sm text-gray-600">This planned item does not have a linked destination yet.</p>
                </div>
              )}

              {sourceHref && sourceHref !== targetHref ? (
                <Link
                  href={sourceHref}
                  className="group inline-flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-[#28A8E1]/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-gray-400 group-hover:text-[#28A8E1]" />
                    <span className="text-sm font-bold text-gray-900">Open source module</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300" />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="pl-1 text-xs font-bold uppercase tracking-widest text-gray-400">Plan Management</h3>
            <div className="space-y-2">
              <button
                onClick={handleMarkDone}
                className="inline-flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100"
              >
                <CheckCircle2 className="h-5 w-5" />
                Mark as Done
              </button>
              <button
                onClick={handleRemove}
                className="inline-flex w-full items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm font-bold text-gray-600 transition-all hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-5 w-5" />
                Remove from Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
