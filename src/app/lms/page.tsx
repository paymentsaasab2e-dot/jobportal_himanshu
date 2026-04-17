'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  CalendarDays,
  PlayCircle,
  Target,
  Layers,
  Lightbulb,
} from 'lucide-react';
import { LMS_CARD_INTERACTIVE, LMS_SECTION_TITLE, LMS_PAGE_SUBTITLE } from './constants';
import { LmsProgressBar } from './components/LmsProgressBar';
import {
  AISectionHeading,
  AIScoreCard,
  AIInsightCard,
  AIActionChips,
  AIRecommendationList,
} from './components/ai';
import { useLmsOverlay } from './components/overlays/LmsOverlayProvider';
import { useLmsState } from './state/LmsStateProvider';
import { useLmsToast } from './components/ux/LmsToastProvider';
import { fetchLmsDashboard } from './api/client';
import {
  dashboardPrimaryInsight,
  dashboardNextActions,
  dashboardModuleRecommendations,
  dashboardRolePath,
  careerAITarget,
  eventsWithAI,
} from './data/ai-mock';

const RECOMMENDED = [
  {
    title: 'React patterns for interviews',
    description: 'Short modules on hooks, performance, and testing built for frontend roles.',
    tag: 'Intermediate' as const,
    icon: Layers,
    href: '/lms/courses/c1',
  },
  {
    title: 'Communication & storytelling',
    description: 'Frame your experience clearly in behavioral rounds and take-home reviews.',
    tag: 'Beginner' as const,
    icon: Sparkles,
    href: '/lms/interview-prep',
  },
  {
    title: 'System design fundamentals',
    description: 'Trade-offs, scaling basics, and diagram practice without the fluff.',
    tag: 'Intermediate' as const,
    icon: Target,
    href: '/lms/quizzes',
  },
];

const DASHBOARD_EVENTS = eventsWithAI.filter((event) => event.status === 'upcoming').slice(0, 3);

function levelBadge(level: 'Beginner' | 'Intermediate') {
  if (level === 'Beginner') {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        Beginner
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
      Intermediate
    </span>
  );
}

export default function LmsDashboardPage() {
  const router = useRouter();
  const overlay = useLmsOverlay();
  const toast = useLmsToast();
  const { state, registerEvent, unregisterEvent, addPlannedItem, setLastActiveCourseId, fetchDashboard } = useLmsState();
  const dashboardData = state.dashboardData;
  const isLoading = !state.isHydrated || !dashboardData;

  useEffect(() => {
    if (state.isHydrated && !dashboardData) {
      fetchDashboard();
    }
  }, [state.isHydrated, dashboardData, fetchDashboard]);

  const quizScores = Object.values(state.quizAttempts);
  const quizAvg =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((acc, curr) => acc + curr.score, 0) / quizScores.length)
      : null;
  const lowestQuiz = quizScores.length > 0 ? Math.min(...quizScores.map((quiz) => quiz.score)) : null;

  const compositeReadiness =
    dashboardData?.readinessScore ?? (quizAvg !== null ? Math.round((careerAITarget.readinessScore + quizAvg) / 2) : careerAITarget.readinessScore);

  const hasSavedResume = state.resumeDraft.updatedAtLabel !== 'Not saved yet' || !!dashboardData?.resumeStrength;
  const resumeExperienceCount = Array.isArray(state.resumeDraft?.sections?.experience)
    ? state.resumeDraft.sections.experience.length
    : 0;
  const compositeResumeStrength = dashboardData?.resumeStrength ?? (hasSavedResume ? Math.min(65 + resumeExperienceCount * 15, 98) : 20);

  const trackedCareerSteps = state.careerPath.started ? state.careerPath.completedStepIds.length : (dashboardData?.coursesCompleted || 0);
  const activityCount = (dashboardData?.eventsAttended || 0) + (dashboardData?.quizzesTaken || 0) + (dashboardData?.coursesEnrolled || 0);
  const compositeWeeklyGoal = dashboardData?.activityStreak ?? activityCount;

  const activeCourseId = state.lastActiveCourseId || dashboardData?.activeCourse?.courseId;
  const activeCourseProgress = activeCourseId ? state.courseProgress[activeCourseId] ?? (dashboardData?.activeCourse?.progress || 0) : 0;
  const hasActiveCourse = activeCourseId !== null && (activeCourseProgress > 0 || !!dashboardData?.activeCourse);

  let dynamicCoachRec = dashboardData?.aiInsight || dashboardPrimaryInsight.recommendation;
  if (!dashboardData) {
    if (lowestQuiz !== null && lowestQuiz < 60) {
      dynamicCoachRec = 'Your recent quiz scores reveal a blindspot. Prioritize the related topics in the Career Path.';
    } else if (!hasSavedResume) {
      dynamicCoachRec = 'Your resume remains untouched. Set up the foundational block first to unlock better targeting.';
    } else if (!state.careerPath.started) {
      dynamicCoachRec = 'Your learning is unguided. Start a Career Path to aggregate your actions into measurable bounds.';
    }
  }

  const dynamicScores = [
    {
      id: 'readiness',
      title: 'CV Analysis Score',
      score: dashboardData?.cvScore ?? compositeReadiness,
      supportingText:
        dashboardData?.cvScore ? 'Extracted from your latest CV analysis.' :
        (quizAvg !== null
          ? `Averaged dynamically with ${quizScores.length} real quiz attempts.`
          : 'Complete your first quiz to update your score.'),
      visual: 'ring' as const,
    },
    {
      id: 'resume',
      title: 'Resume strength',
      score: compositeResumeStrength,
      supportingText: dashboardData ? 'Computed from your AI-enhanced professional profile.' :
        (hasSavedResume
        ? `Evaluated around ${resumeExperienceCount} experience entries in your current draft.`
        : 'Resume empty. Build the foundation first.'),
      visual: 'ring' as const,
    },
    {
      id: 'velocity',
      title: 'Weekly activity',
      score: compositeWeeklyGoal,
      supportingText: dashboardData ? `You have maintained an activity streak for ${compositeWeeklyGoal} days.` :
        `Tracking ${compositeWeeklyGoal} interactions across quizzes, notes, events, and career progress.`,
      visual: 'bar' as const,
    },
  ];

  const openRegister = (eventId: string, title: string) => {
    const isRegistered = state.registeredEventIds.includes(eventId);

    overlay.openSheet({
      title: isRegistered ? 'Manage registration' : 'Register for event',
      description: 'Frontend-only registration (mock).',
      content: (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-sm font-normal text-gray-600">
            This confirmation is stored locally so you can test registered event UX natively.
          </p>
        </div>
      ),
      footer: (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="flex-1 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            onClick={() => {
              if (isRegistered) {
                unregisterEvent(eventId);
                toast.push({ title: 'Registration removed', message: title, tone: 'success' });
              } else {
                registerEvent(eventId);
                toast.push({ title: 'Registered', message: title, tone: 'success' });
              }
              overlay.close();
            }}
          >
            {isRegistered ? 'Unregister' : 'Confirm registration'}
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

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="min-w-0">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="min-w-0">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Welcome back</h1>
        <p className={LMS_PAGE_SUBTITLE}>Your AI-powered career hub. Tracking your journey to your next professional destination.</p>
      </div>

      <section className="space-y-4 rounded-2xl border border-violet-100 bg-white/60 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
        <AISectionHeading title="Real-time LMS intelligence" />
        <p className="-mt-1 text-sm font-normal text-gray-500">
          Analyzing your `{activityCount}` interactions for personalized career guidance.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {dynamicScores.map((score) => (
            <AIScoreCard
              key={score.id}
              title={score.title}
              score={score.score}
              supportingText={score.supportingText}
              visual={score.visual}
            />
          ))}
        </div>

        <AIInsightCard
          icon={Sparkles}
          title={dashboardData?.badge || "AI Career Guide"}
          recommendation={dashboardData?.primaryInsight || dynamicCoachRec}
          scoreOrTag={dashboardData?.badge || "AI ANALYSIS"}
          ctaLabel={
            !hasSavedResume
              ? 'Open Resume Builder'
              : !state.careerPath.started
                ? 'Launch Career Path'
                : 'View Full Roadmap'
          }
          onCta={() => {
            if (!hasSavedResume) {
              router.push('/lms/resume-builder');
              return;
            }
            router.push('/lms/career-path');
          }}
        />

        <div className="space-y-2">
          <h3 className="text-base font-bold text-gray-900">Recommended contextual actions</h3>
          <AIActionChips
            actions={dashboardNextActions.map((action) => {
              if (action.id === 'resume' && hasSavedResume) return { ...action, label: 'Refine saved resume' };
              if (action.id === 'mock' && lowestQuiz !== null && lowestQuiz < 60) {
                return { ...action, label: 'Practice weak quiz subjects' };
              }
              return action;
            })}
            onAction={(action) => {
              if (action.id === 'resume') return router.push('/lms/resume-builder');
              if (action.id === 'questions') return router.push('/lms/interview-prep');
              if (action.id === 'notes') return router.push('/lms/notes');
              if (action.id === 'mock') return router.push('/lms/interview-prep');
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 pt-2 lg:grid-cols-2">
          <AIRecommendationList
            sectionTitle="Suggested modules based on target"
            items={dashboardData?.personalizedRecs?.slice(0, 2).map((r: any) => ({
              id: r.id,
              label: r.title,
              text: r.description
            })) || dashboardModuleRecommendations}
            onCta={(item) => {
              addPlannedItem({
                id: `rec:${item.id}`,
                type: 'topic',
                label: item.label,
                href: '/lms/career-path',
                sourceModule: 'dashboard',
                sourceLabel: 'AI Course Picks',
                context: item.text,
              });
              toast.push({ title: 'Added to plan locally', message: item.label, tone: 'success' });
            }}
          />
          <AIInsightCard
            icon={Target}
            title="Personalized Learning Path"
            recommendation={
              state.careerPath.started
                ? `Your active Career Path is tracking ${state.careerPath.completedStepIds.length} completed roadmap items.`
                : "Your roadmap is generated based on your CV analysis to bridge identified gaps."
            }
            scoreOrTag={state.careerPath.started ? 'Active Tracking' : "DYNAMIC"}
            ctaLabel={state.careerPath.started ? 'Jump back into Path' : "View AI Roadmap"}
            onCta={() => router.push('/lms/career-path')}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={LMS_SECTION_TITLE}>Continue learning</h2>
        <div className={`${LMS_CARD_INTERACTIVE} flex flex-col gap-5 sm:flex-row sm:items-start`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#28A8E1]">
            <PlayCircle className="h-6 w-6" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <p className="text-base font-bold text-gray-900">
                {hasActiveCourse ? 'Modern JavaScript for job seekers' : 'Foundations of Frontend Engineering'}
              </p>
              <p className="mt-1 text-sm font-normal leading-relaxed text-gray-500">
                {hasActiveCourse
                  ? 'Module progress is being restored from your local LMS state.'
                  : 'No active module found yet. Start a course to populate this slot.'}
              </p>
            </div>

            {hasActiveCourse ? (
              <>
                <LmsProgressBar value={activeCourseProgress} />
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  {activeCourseProgress}% computed from your saved lesson progress.
                </p>
              </>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
                onClick={() => {
                  const id = state.lastActiveCourseId ?? 'c1';
                  setLastActiveCourseId(id);
                  router.push(`/lms/courses/${id}`);
                }}
              >
                {hasActiveCourse ? 'Resume module' : 'Start learning'}
              </button>
              {hasActiveCourse ? (
                <Link
                  href="/lms/courses"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                >
                  View directory
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={LMS_SECTION_TITLE}>Dynamically recommended for you</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(dashboardData?.personalizedRecs || RECOMMENDED).map((item: any) => {
            const Icon = item.type === 'quiz' ? Target : item.type === 'prep' ? Sparkles : Layers;
            return (
              <Link key={item.title || item.label} href={item.href || '#'} className={LMS_CARD_INTERACTIVE}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-700">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-base font-bold leading-snug text-gray-900">{item.title || item.label}</h3>
                    <p className="text-sm font-normal leading-relaxed text-gray-500">{item.description || item.text}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">{levelBadge(item.tag || 'Intermediate')}</div>
                    <div className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98] sm:w-auto">
                      Open Module
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={LMS_SECTION_TITLE}>Upcoming events</h2>
        <div className="space-y-3">
          {DASHBOARD_EVENTS.map((event) => {
            const isRegistered = state.registeredEventIds.includes(event.id);
            return (
              <div
                key={event.id}
                className={`${LMS_CARD_INTERACTIVE} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${isRegistered ? 'border-emerald-100 bg-emerald-50/20' : ''}`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                      isRegistered
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-100 bg-amber-50 text-amber-700'
                    }`}
                  >
                    <CalendarDays className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-gray-900">{event.title}</p>
                    <p className="mt-0.5 text-sm font-normal text-gray-500">{event.date}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`shrink-0 cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] sm:min-w-[7.5rem] ${
                    isRegistered
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => openRegister(event.id, event.title)}
                >
                  {isRegistered ? 'Registered' : 'Register'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
