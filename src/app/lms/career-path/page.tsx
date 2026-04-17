'use client';

import { Fragment, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronRight,
  Route,
  Target,
  TrendingUp,
  AlertCircle,
  Flag,
  CalendarRange,
  RefreshCw,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { LMS_CARD_CLASS, LMS_PAGE_SUBTITLE, LMS_SECTION_TITLE } from '../constants';
import { AISectionHeading, AIScoreCard, AIInsightCard } from '../components/ai';
import { careerAITarget, careerMission, careerMissionRoadmap, lmsSharedIntelligence } from '../data/ai-mock';
import { useLmsState } from '../state/LmsStateProvider';
import { useLmsToast } from '../components/ux/LmsToastProvider';

export default function LmsCareerPathPage() {
  const router = useRouter();
  const toast = useLmsToast();
  const { state, careerStart, careerReset, removePlannedItem } = useLmsState();
  const { role, readinessScore, strengths, gaps, roadmapMilestones } = careerAITarget;
  const dynamicRole = state.careerPath.role || role;
  const rawRoadmap = state.careerPath.roadmapItems || [];
  
  const groupedRoadmap = useMemo(() => {
    if (!rawRoadmap.length) return careerMissionRoadmap;
    
    const phases = [
      { id: 'foundation', title: 'Phase 1: Foundation', steps: [] as any[] },
      { id: 'core', title: 'Phase 2: Core Skills', steps: [] as any[] },
      { id: 'mastery', title: 'Phase 3: Mastery', steps: [] as any[] },
      { id: 'job-ready', title: 'Phase 4: Job Ready', steps: [] as any[] }
    ];
    
    rawRoadmap.forEach(item => {
      const p = phases.find(ph => ph.id === item.phase);
      if (p) p.steps.push(item);
    });
    
    return phases.filter(p => p.steps.length > 0);
  }, [rawRoadmap]);

  const missionSteps = useMemo(() => {
    if (rawRoadmap.length) return rawRoadmap;
    return careerMissionRoadmap.flatMap((phase) => phase.steps);
  }, [rawRoadmap]);

  const trackedCompletedStepIds = state.careerPath.started ? state.careerPath.completedStepIds : [];
  const totalActionableSteps = missionSteps.length;
  const completedCount = trackedCompletedStepIds.length;
  const completionPercentage =
    state.careerPath.started && totalActionableSteps > 0
      ? Math.round((completedCount / totalActionableSteps) * 100)
      : 0;
  const hasStarted = state.careerPath.started;

  const quizScores = Object.values(state.quizAttempts);
  const quizAvg =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((acc, attempt) => acc + attempt.score, 0) / quizScores.length)
      : null;
  const lowestQuiz = quizScores.length > 0 ? Math.min(...quizScores.map((quiz) => quiz.score)) : null;
  const dynamicReadinessScore = quizAvg !== null ? Math.round((readinessScore + quizAvg) / 2) : readinessScore;
  const nextIncompleteStep = missionSteps.find((step) => !trackedCompletedStepIds.includes(step.id)) ?? null;

  const dynamicNextStep = hasStarted
    ? nextIncompleteStep
      ? `Next tracked milestone: ${nextIncompleteStep.label || nextIncompleteStep.title}`
      : 'All visible roadmap items are complete. Keep momentum with mock interviews and review.'
    : 'Start your path above to unlock progress tracking across quizzes, courses, notes, events, and resume work.';

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset your Career Path tracking?')) return;
    careerReset();
    toast.push({ title: 'Path reset', message: 'Career-path tracking has been cleared.', tone: 'success' });
  };

  const openStepTarget = (href?: string) => {
    if (!hasStarted) {
      toast.push({
        title: 'Start your path first',
        message: 'Enable the career path to track roadmap progress across the LMS.',
        tone: 'warning',
      });
      return;
    }
    if (!href) {
      toast.push({ title: 'Target unavailable', message: 'This roadmap item does not have a linked destination yet.', tone: 'info' });
      return;
    }
    router.push(href);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Career path</h1>
          <p className={LMS_PAGE_SUBTITLE}>
            Mission system with adaptive roadmap. Quizzes, notes, events, and resume work feed this view natively.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasStarted ? (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset Path
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100"
            disabled={hasStarted}
            onClick={() => {
              careerStart();
              toast.push({ title: 'Path started', message: 'Roadmap tracking is now active across the LMS.', tone: 'success' });
            }}
          >
            <Route className="h-4 w-4" strokeWidth={2} />
            {hasStarted ? 'Path Active' : 'Start path'}
          </button>
        </div>
      </div>

      <p className="-mt-2 border-l-2 border-violet-200 pl-3 text-xs font-medium text-gray-500">
        {lmsSharedIntelligence.careerAdaptive}
      </p>

      <section className="space-y-4 rounded-2xl border border-violet-100 bg-white/70 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Flag className="h-6 w-6 text-violet-600" strokeWidth={2} />
          <h2 className="text-xl font-bold text-gray-900">{careerMission.headline}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md lg:col-span-2`}>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#28A8E1]">
                <Target className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active mission</p>
                  {hasStarted ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 shadow-sm">
                      {completedCount}/{totalActionableSteps} complete
                    </span>
                  ) : null}
                </div>
                <p className="text-xl font-bold text-gray-900">{dynamicRole}</p>
                <p className="mt-2 text-sm font-normal text-gray-500">
                  {state.careerPath.roadmapItems?.length 
                    ? "This roadmap was dynamically generated by AI based on your CV analysis and career goals."
                    : "Visible milestones are now tied to real LMS actions instead of loose labels, so the progress bar stays trustworthy."}
                </p>
              </div>
            </div>
          </div>
          <AIScoreCard
            title="Role readiness"
            score={dynamicReadinessScore}
            supportingText={
              quizScores.length > 0
                ? 'Composite of your saved readiness baseline plus current quiz performance.'
                : 'Composite of courses, quizzes, resume, and mocks (placeholder baseline).'
            }
            visual="ring"
          />
        </div>

        <div className={`space-y-4 ${!hasStarted ? 'opacity-60 grayscale-[20%]' : ''}`}>
          <h3 className="text-base font-bold text-gray-900">Mission phases & actionable steps</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {groupedRoadmap.map((phase) => {
              const phaseCompletedSteps = phase.steps.filter((step: any) => trackedCompletedStepIds.includes(step.id));
              const isPhaseDone = phase.steps.length > 0 && phaseCompletedSteps.length === phase.steps.length;
              const isPhaseInProgress = phaseCompletedSteps.length > 0 && !isPhaseDone;

              return (
                <div
                  key={phase.id}
                  className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md ${
                    isPhaseDone
                      ? 'border-emerald-100 bg-emerald-50/10'
                      : isPhaseInProgress
                        ? 'border-amber-100 bg-amber-50/10'
                        : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900">{phase.title}</p>
                    {isPhaseDone ? (
                      <span className="text-xs font-bold text-emerald-700">Done</span>
                    ) : isPhaseInProgress ? (
                      <span className="text-xs font-bold text-amber-700">In progress</span>
                    ) : (
                      <span className="text-xs font-bold text-gray-400">Pending</span>
                    )}
                  </div>
                  <ul className="mt-3 space-y-2">
                    {phase.steps.map((step: any) => {
                      const stepDone = trackedCompletedStepIds.includes(step.id);

                      return (
                        <li key={step.id}>
                          <button
                            type="button"
                            onClick={() => openStepTarget(step.href || step.targetRoute)}
                            className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                              stepDone
                                ? 'border-emerald-100 bg-emerald-50/40 text-gray-700 hover:bg-emerald-50/60'
                                : hasStarted
                                  ? 'border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-white/80'
                                  : 'cursor-default border-gray-100 bg-white text-gray-500'
                            }`}
                          >
                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${stepDone ? 'text-emerald-700' : 'text-[#28A8E1]'}`} strokeWidth={2} />
                            <span className="min-w-0 flex-1">
                              <span className={`block ${stepDone ? 'font-semibold text-gray-900' : ''}`}>{step.label || step.title}</span>
                              <span className="mt-1 block text-xs font-medium text-gray-500">
                                {stepDone ? 'Completed from LMS activity' : hasStarted ? (step.reason || 'Open target') : 'Start the path to unlock tracking'}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${LMS_CARD_CLASS} mt-6 flex gap-3 border-amber-100 bg-amber-50/30 transition-all duration-200 hover:shadow-md`}>
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={2} />
          <div>
            <p className="text-sm font-bold text-amber-950">{careerMission.risk.label}</p>
            <p className="mt-1 text-sm font-normal text-gray-700">
              {lowestQuiz !== null && lowestQuiz < 60
                ? `Current risk signal: your lowest saved quiz score is ${lowestQuiz}%, so system-design work should stay prioritized.`
                : careerMission.risk.text}
            </p>
          </div>
        </div>

        <AIInsightCard
          icon={Route}
          title="Suggested next active LMS step"
          recommendation={dynamicNextStep}
          scoreOrTag="Next action"
          ctaLabel={nextIncompleteStep?.href || nextIncompleteStep?.targetRoute ? 'Open next milestone' : 'Launch quizzes'}
          onCta={() => openStepTarget(nextIncompleteStep?.href ?? nextIncompleteStep?.targetRoute ?? '/lms/quizzes')}
        />

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-gray-700" strokeWidth={2} />
            <h3 className="text-base font-bold text-gray-900">Timeline expectation view</h3>
          </div>
          <div className={`${LMS_CARD_CLASS} space-y-3 transition-all duration-200 hover:shadow-md`}>
            {careerMission.timeline.map((week) => (
              <div
                key={week.week}
                className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm font-bold text-[#28A8E1]">{week.week}</span>
                <span className="text-sm font-normal text-gray-700">{week.focus}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${LMS_CARD_CLASS} mt-6 flex gap-3 border-violet-100 bg-violet-50/20 transition-all duration-200 hover:shadow-md`}>
          <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" strokeWidth={2} />
          <p className="text-sm font-normal text-gray-700">{careerMission.adaptiveCopy}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/lms/notes" className="text-sm font-semibold text-[#28A8E1] hover:underline">
            Notes →
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/lms/quizzes" className="text-sm font-semibold text-[#28A8E1] hover:underline">
            Quizzes →
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/lms/events" className="text-sm font-semibold text-[#28A8E1] hover:underline">
            Events →
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/lms/resume-builder" className="text-sm font-semibold text-[#28A8E1] hover:underline">
            Resume →
          </Link>
        </div>

        <div className="mt-8 space-y-3">
          <AISectionHeading title="Roadmap conceptual overview" />
          <div className={`${LMS_CARD_CLASS} overflow-x-auto transition-all duration-200 hover:shadow-md`}>
            <div className="flex min-w-[280px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {roadmapMilestones.map((milestone, index) => {
                const passVal = ((index + 1) / roadmapMilestones.length) * 100;
                const thresholdMet = completionPercentage >= passVal || (index === 0 && completionPercentage > 0);

                return (
                  <Fragment key={milestone.id}>
                    <div className="flex flex-1 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${
                          thresholdMet
                            ? 'scale-105 border-[#28A8E1] bg-[#28A8E1] text-white'
                            : 'border-gray-200 bg-white text-gray-400'
                        }`}
                      >
                        {thresholdMet ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
                      </div>
                      <p className={`text-sm font-bold transition-colors ${thresholdMet ? 'text-gray-900' : 'text-gray-400'}`}>
                        {milestone.label}
                      </p>
                    </div>
                    {index < roadmapMilestones.length - 1 ? (
                      <ChevronRight className="hidden h-5 w-5 shrink-0 text-gray-300 sm:block" aria-hidden />
                    ) : null}
                  </Fragment>
                );
              })}
            </div>
            <div className="mt-5 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#28A8E1] shadow-sm transition-all duration-700 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className={LMS_SECTION_TITLE}>Planned items from modules</h2>
        {state.plannedItems.length === 0 ? (
          <div className={`${LMS_CARD_CLASS} border-2 border-dashed border-gray-200 bg-gray-50 py-8 text-center text-sm text-gray-600`}>
            <Target className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p>Nothing is in your plan yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Planned items from Interview Prep, Events, and Dashboard recommendations will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {state.plannedItems.map((item) => (
              <li key={item.id} className={`${LMS_CARD_CLASS} group overflow-hidden`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate pr-4 text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      {item.type}
                    </p>
                  </div>

                  <div className="mt-2 flex shrink-0 items-center gap-2 opacity-100 transition-opacity sm:mt-0 sm:opacity-0 sm:group-hover:opacity-100">
                    <button
                      title="Dismiss"
                      onClick={() => {
                        removePlannedItem(item.id);
                        toast.push({ title: 'Item removed', message: 'Removed from your plan.', tone: 'success' });
                      }}
                      className="inline-flex items-center justify-center rounded-xl p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      title="Mark Done"
                      onClick={() => {
                        removePlannedItem(item.id);
                        toast.push({ title: 'Task concluded', message: 'Planned item cleared.', tone: 'success' });
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Done
                    </button>
                    <Link
                      href={item.href && item.href !== '/lms/career-path' ? item.href : `/lms/career-path/planned/${encodeURIComponent(item.id)}`}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-900 shadow-sm transition-all duration-200 hover:border-[#28A8E1]/40 hover:text-[#28A8E1] active:bg-gray-50"
                    >
                      Open Target
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 pt-4">
        <h2 className={LMS_SECTION_TITLE}>Strengths & contextual limits</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`${LMS_CARD_CLASS} border-emerald-50 bg-emerald-50/20 transition-all duration-200 hover:shadow-md`}>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" strokeWidth={2} />
              <h3 className="w-full border-b border-emerald-100 pb-1 text-sm font-bold text-gray-900">Current strengths</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((strength) => (
                <span
                  key={strength}
                  className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm"
                >
                  {strength}
                </span>
              ))}
              {quizScores.some((quiz) => quiz.score >= 80) ? (
                <span className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
                  Quiz Overachiever
                </span>
              ) : null}
            </div>
          </div>
          <div className={`${LMS_CARD_CLASS} border-amber-50 bg-amber-50/20 transition-all duration-200 hover:shadow-md`}>
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" strokeWidth={2} />
              <h3 className="w-full border-b border-amber-100 pb-1 text-sm font-bold text-gray-900">Current gaps</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {gaps.map((gap) => (
                <span
                  key={gap}
                  className="rounded-full border border-amber-100 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm"
                >
                  {gap}
                </span>
              ))}
              {lowestQuiz !== null && lowestQuiz < 50 ? (
                <span className="rounded-full border border-amber-100 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm">
                  Quiz blindspots visible
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4">
        <h2 className={LMS_SECTION_TITLE}>Global roadmap progression tracking</h2>
        <div className={LMS_CARD_CLASS}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-1">
            {groupedRoadmap.map((phase: any, index: number) => {
              const phaseCompletedSteps = phase.steps.filter((step: any) => trackedCompletedStepIds.includes(step.id));
              const isPhaseDone = phase.steps.length > 0 && phaseCompletedSteps.length === phase.steps.length;

              return (
                <Fragment key={phase.id}>
                  <div className={`min-w-0 md:flex-1 ${!hasStarted ? 'opacity-40' : ''} flex items-center gap-3 transition-opacity`}>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                        isPhaseDone
                          ? 'scale-110 border-[#28A8E1] bg-[#28A8E1] text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-400'
                      }`}
                    >
                      {isPhaseDone ? <Check className="h-5 w-5" strokeWidth={2.5} /> : index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Phase {index + 1}</p>
                      <p className={`truncate text-sm font-bold leading-snug ${isPhaseDone ? 'text-gray-900' : 'text-gray-500'}`}>
                        {phase.title}
                      </p>
                    </div>
                  </div>
                  {index < groupedRoadmap.length - 1 ? (
                    <div className="hidden shrink-0 items-center justify-center px-0.5 text-gray-300 md:flex" aria-hidden>
                      <ChevronRight className="h-5 w-5" strokeWidth={2} />
                    </div>
                  ) : null}
                </Fragment>
              );
            })}
          </div>
          <div className="mt-8 flex h-2 w-full items-center overflow-hidden rounded-full bg-gray-100 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#28A8E1] to-[#1a7fbc] shadow-sm transition-all duration-1000 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="mt-3 text-center text-sm font-bold uppercase tracking-wide text-gray-800">
            Tracking {completionPercentage}% of your visible roadmap
          </p>
        </div>
      </section>
    </div>
  );
}
