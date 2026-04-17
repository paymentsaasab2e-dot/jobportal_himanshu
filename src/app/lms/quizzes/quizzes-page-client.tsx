'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ArrowRight, Award, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { LMS_CARD_CLASS, LMS_CARD_INTERACTIVE, LMS_PAGE_SUBTITLE } from '../constants';
import { AISectionHeading, AIInsightCard } from '../components/ai';
import { LmsEmptyState } from '../components/states/LmsEmptyState';
import { LmsStatusBadge } from '../components/ux/LmsStatusBadge';
import { lmsQuizBank, quizzesAIExplanation, quizzesAIRecommended, quizzesSkillHeatmap, quizzesMasteryByTopic, quizzesRecentPerformance, quizzesRetryWeak } from '../data/ai-mock';
import { useLmsState } from '../state/LmsStateProvider';
import { useQuizAnalytics } from './hooks/useQuizAnalytics';
import { HeatmapBar, QuizCatalogCard, QuizPreviewSection, RetryQuizCard, difficultyBadge } from './quiz-page-helpers';
import { buildQuizPreviewHref, buildQuizResultHref, buildSkillFocusHref, buildSuggestedLessonsHref, formatDurationLabel, getQuizSkillLabel, normalizeQuizSkill, type QuizPreviewSource, getQuizCatalogItem } from './quiz-utils';
import { fetchQuizzes } from '../api/client';
import { LmsSkeleton } from '../components/states/LmsSkeleton';

function previewReasonLines(
  source: QuizPreviewSource | null,
  quiz: any,
  topicDetail: any
) {
  if (source === 'recommended' && topicDetail) {
    return [
      `${topicDetail.label} is currently your weakest active area at ${topicDetail.mastery}% mastery.`,
      topicDetail.lastScore != null
        ? `Your last scored attempt in this topic landed at ${topicDetail.lastScore}%.`
        : `This set will establish a stronger baseline for ${topicDetail.label}.`,
      topicDetail.summary,
    ];
  }

  if (source === 'retry' && topicDetail) {
    return [
      topicDetail.retryLabel,
      topicDetail.lastScore != null
        ? `Last score in this area: ${topicDetail.lastScore}%.`
        : 'Complete one scored attempt here to unlock more precise retry guidance.',
      `Focus on ${quiz.weakConcepts?.slice(0, 2).join(' and ') || 'core principles'}.`,
    ];
  }

  if ((source === 'skill' || source === 'mastery') && topicDetail) {
    return [
      `Focused practice for ${topicDetail.label}.`,
      topicDetail.lastScore != null
        ? `Recent score: ${topicDetail.lastScore}% with room to strengthen the weak concepts below.`
        : 'No recent attempt yet. Start here to unlock topic-specific progress and retry guidance.',
      topicDetail.summary,
    ];
  }

  return [
    quiz.whyRecommended || 'Review foundational material.',
    `This quiz targets ${quiz.topic.toLowerCase()} fundamentals and follow-up concepts.`,
    `Focus areas: ${quiz.weakConcepts?.slice(0, 2).join(' and ') || 'core principles'}.`,
  ];
}

export function LmsQuizzesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewId = searchParams.get('preview');
  const previewSource = (searchParams.get('source') as QuizPreviewSource | null) ?? null;
  const selectedSkill = normalizeQuizSkill(searchParams.get('skill'));

  const { state } = useLmsState();
  const analytics = useQuizAnalytics();

  const [backendQuizzes, setBackendQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchQuizzes();
        setBackendQuizzes(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const quizzesCatalog = useMemo(() => {
    return backendQuizzes.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      topic: normalizeQuizSkill(q.skill || 'frontend'),
      topicLabel: getQuizSkillLabel(q.skill || 'frontend'),
      questions: q.totalQuestions || 5,
      estMinutes: q.durationMinutes || 10,
      difficulty: q.difficulty || 'intermediate',
      whyRecommended: 'Based on your latest DB performance routing.',
      weakConcepts: ['Syntax', 'Event Loop']
    }));
  }, [backendQuizzes]);

  // We rewrite getQuizCatalogItem directly to point to our dynamic catalog
  const dynamicGetQuizCatalogItem = (id: string) => quizzesCatalog.find(c => c.id === id) || getQuizCatalogItem(id);

  const recommendedSkill = analytics.weakestTopic || selectedSkill || normalizeQuizSkill(quizzesAIRecommended.topic) || 'javascript';
  const recommendedTopicDetail = analytics.topicDetails[recommendedSkill];
  const recommendedQuizId = recommendedTopicDetail?.recommendedQuizId ?? (quizzesCatalog[0]?.id ?? null);
  const recommendedQuiz = recommendedQuizId ? dynamicGetQuizCatalogItem(recommendedQuizId) : null;

  const previewQuiz = previewId ? dynamicGetQuizCatalogItem(previewId) : null;
  const previewSkill = previewQuiz ? normalizeQuizSkill(previewQuiz.topic) : null;
  const previewTopicDetail = previewSkill ? analytics.topicDetails[previewSkill] : null;
  const previewAttempt = previewQuiz ? state.quizAttempts[previewQuiz.id] : null;
  const previewQuestionCount = previewQuiz ? previewQuiz.questions : 0;
  const previewBackHref = selectedSkill ? buildSkillFocusHref(selectedSkill) : '/lms/quizzes';

  const filteredCatalog = (() => {
    if (!selectedSkill) return quizzesCatalog;
    const recommendedForSkill = analytics.topicDetails[selectedSkill]?.recommendedQuizId ?? null;
    return [...quizzesCatalog]
      .filter((quiz) => quiz.topic === selectedSkill)
      .sort((a, b) => {
        const aRecommended = recommendedForSkill ? a.id === recommendedForSkill : false;
        const bRecommended = recommendedForSkill ? b.id === recommendedForSkill : false;
        if (aRecommended !== bRecommended) return aRecommended ? -1 : 1;
        return a.title.localeCompare(b.title);
      });
  })();

  const retryCards = (() => {
    if (analytics.retryQuizzes.length > 0) return analytics.retryQuizzes;
    return quizzesRetryWeak
      .map((quiz) => {
        const meta = dynamicGetQuizCatalogItem(quiz.id);
        const skill = normalizeQuizSkill(quiz.topic);
        const detail = skill ? analytics.topicDetails[skill] : null;
        if (!meta || !skill) return null;
        return {
          ...meta,
          skill,
          label: detail?.retryLabel ?? 'Suggested starter drill',
          lastScore: detail?.lastScore ?? null,
          reviewQuizId: detail?.lastQuizId ?? null,
          reviewAvailable: Boolean(detail?.lastQuizId),
          mastery: detail?.mastery ?? 0,
        };
      })
      .filter((quiz): quiz is NonNullable<typeof quiz> => Boolean(quiz));
  })();

  const selectedSkillDetail = selectedSkill ? analytics.topicDetails[selectedSkill] : null;
  const selectedSkillQuiz = selectedSkillDetail?.recommendedQuizId ? dynamicGetQuizCatalogItem(selectedSkillDetail.recommendedQuizId) : null;
  const skillCoursesHref = buildSuggestedLessonsHref({
    skill: selectedSkill ?? recommendedSkill,
    quizId: selectedSkillQuiz?.id ?? recommendedQuiz?.id ?? null,
  });

  const recentAttempt = analytics.recentAttempt;
  const recentResultHref = recentAttempt ? buildQuizResultHref(recentAttempt.quizId, recentAttempt.skill) : null;

  const openQuizPreview = (quizId: string, source: QuizPreviewSource, skill?: string | null) => {
    router.push(buildQuizPreviewHref(quizId, { skill, source }));
  };

  if (loading) return <div className="space-y-4"><LmsSkeleton lines={8} /></div>;

  return (
    <div className="space-y-10">
      <div className="min-w-0">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Quizzes</h1>
        <p className={LMS_PAGE_SUBTITLE}>
          Adaptive practice linked directly to your Database API limits and registration records.
        </p>
      </div>

      {previewId ? (
        <QuizPreviewSection
          quiz={previewQuiz as any}
          exists={Boolean(previewQuiz)}
          previewSource={previewSource}
          previewSkill={previewSkill}
          previewBackHref={previewBackHref}
          previewAttempt={previewAttempt as any}
          previewQuestionCount={previewQuestionCount}
          reasonLines={previewQuiz ? previewReasonLines(previewSource, previewQuiz, previewTopicDetail) : []}
        />
      ) : null}



      <section className="space-y-4">
        <AISectionHeading title="AI recommended quiz" />
        {recommendedQuiz ? (
          <div className={LMS_CARD_INTERACTIVE} role="button" tabIndex={0} onClick={() => openQuizPreview(recommendedQuiz.id, 'recommended', recommendedSkill)} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openQuizPreview(recommendedQuiz.id, 'recommended', recommendedSkill);
            }
          }}>
            <div className="space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">{recommendedQuiz.title}</h2>
                  <LmsStatusBadge label="Recommended now" tone="success" />
                </div>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">{recommendedTopicDetail?.label ?? recommendedQuiz.topic}</p>
                <p className="mt-2 text-sm font-normal text-gray-500">
                  {analytics.hasAttempts && recommendedTopicDetail
                    ? `Practice this next because ${recommendedTopicDetail.label.toLowerCase()} is the weakest active area in your recent quiz history.`
                    : 'Backend data routed.'}
                </p>
              </div>
              <ul className="list-disc space-y-1.5 pl-5 text-sm font-normal text-gray-600">
                {previewReasonLines('recommended', recommendedQuiz, recommendedTopicDetail).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {difficultyBadge(recommendedQuiz.difficulty as any)}
                <span className="self-center text-xs font-medium text-gray-500">{recommendedQuiz.questions} questions</span>
                <span className="self-center text-xs font-medium text-gray-500">{recommendedQuiz.estMinutes} min</span>
              </div>
              <button type="button" onClick={(event) => { event.stopPropagation(); openQuizPreview(recommendedQuiz.id, 'recommended', recommendedSkill); }} className="inline-flex w-full items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98] sm:w-auto">
                Start practice ({recommendedQuiz.estMinutes} min)
              </button>
            </div>
          </div>
        ) : (
          <div className={`${LMS_CARD_CLASS} border-dashed border-gray-200 bg-gray-50/60`}>
            <p className="text-sm font-bold text-gray-900">Recommended quiz unavailable</p>
            <p className="mt-1 text-sm text-gray-600">We could not resolve the current recommendation to a valid backend quiz. Browse the full catalog below.</p>
          </div>
        )}
      </section>

      <section className="space-y-4" id="skill-heatmap">
        <AISectionHeading title="Skill map (visual grid)" />
        <p className="text-sm font-normal text-gray-500 -mt-2">Click a skill to open targeted practice, recent mistakes, and the next recommended backend quiz.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quizzesSkillHeatmap.map((row) => {
            const detail = analytics.topicDetails[row.slug];
            const actualPct = detail?.mastery ?? row.pct;
            const tier = actualPct >= 80 ? 'strong' : actualPct >= 60 ? 'building' : 'risk';
            const active = selectedSkill === row.slug;
            return (
              <Link key={row.slug} href={buildSkillFocusHref(row.slug)} className={`${LMS_CARD_CLASS} block border-violet-50 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] ${active ? 'border-[#28A8E1]/40 bg-sky-50/30 shadow-md' : ''}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="w-32 shrink-0 text-sm font-bold text-gray-900">{row.topic}</span>
                  <HeatmapBar pct={actualPct} tier={tier} />
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${tier === 'strong' ? 'text-emerald-700' : tier === 'building' ? 'text-amber-700' : 'text-rose-700'}`}>{actualPct}%</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-normal text-gray-500">{detail?.hasHistory ? `Recent score: ${detail.lastScore}% - ${detail.summary}` : row.hoverSuggestion}</p>
                {active ? <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[#28A8E1]">Selected skill</p> : null}
              </Link>
            );
          })}
        </div>
      </section>

      {selectedSkill ? (
        <section id="skill-focus" className="space-y-4">
          <AISectionHeading title={`Targeted practice - ${selectedSkillDetail?.label ?? getQuizSkillLabel(selectedSkill) ?? 'Skill focus'}`} />
          {selectedSkillDetail && selectedSkillQuiz ? (
            <div className={`${LMS_CARD_CLASS} border-[#28A8E1]/20 bg-sky-50/30`}>
              <div className="grid gap-5 lg:grid-cols-[1.15fr,0.95fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedSkillDetail.label}</h2>
                    <LmsStatusBadge label={selectedSkillDetail.hasHistory ? 'Active focus' : 'Set a baseline'} tone={selectedSkillDetail.hasHistory ? 'info' : 'warning'} />
                  </div>
                  <p className="text-sm font-normal text-gray-600">{selectedSkillDetail.summary}</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Current mastery</p><p className="mt-1 text-2xl font-bold text-gray-900">{selectedSkillDetail.mastery}%</p></div>
                    <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Last attempt</p><p className="mt-1 text-2xl font-bold text-gray-900">{selectedSkillDetail.lastScore != null ? `${selectedSkillDetail.lastScore}%` : 'No history'}</p></div>
                    <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3"><p className="text-xs font-bold uppercase tracking-wide text-gray-400">Trend</p><p className="mt-1 text-sm font-bold text-gray-900">{selectedSkillDetail.trend === 'up' ? 'Improving' : selectedSkillDetail.trend === 'down' ? 'Needs another pass' : selectedSkillDetail.trend === 'steady' ? 'Holding steady' : 'Trend unlocks after more attempts'}</p></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Recent mistakes / weak concepts</p>
                    <div className="mt-2 flex flex-wrap gap-2">{selectedSkillDetail.weakConcepts.map((concept) => <span key={concept} className="rounded-full border border-sky-100 bg-white px-3 py-1 text-xs font-semibold text-gray-700">{concept}</span>)}</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Recommended quiz</p>
                  <h3 className="mt-1 text-lg font-bold text-gray-900">{selectedSkillQuiz.title}</h3>
                  <p className="mt-2 text-sm font-normal text-gray-600">{selectedSkillQuiz.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {difficultyBadge(selectedSkillQuiz.difficulty as any)}
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">{selectedSkillQuiz.estMinutes} min</span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link href={buildQuizPreviewHref(selectedSkillQuiz.id, { skill: selectedSkill, source: 'skill' })} className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]">Start practice</Link>
                    {selectedSkillDetail.lastQuizId ? <Link href={buildQuizResultHref(selectedSkillDetail.lastQuizId, selectedSkill)} className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]">View previous result</Link> : <span className="inline-flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-500">No recent attempts yet</span>}
                    <Link href={skillCoursesHref} className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]">View suggested lessons</Link>
                    <Link href="/lms/quizzes#skill-heatmap" className="inline-flex items-center justify-center rounded-xl border border-transparent bg-transparent px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-white">Clear skill focus</Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <LmsEmptyState title="No targeted drill is ready for this skill" body="This topic does not have a valid quiz mapping yet. Browse the full quiz catalog below!" action={<Link href="/lms/quizzes" className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]">Back to all skills</Link>} />
          )}
        </section>
      ) : null}

    </div>
  );
}
