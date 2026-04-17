import { useMemo } from 'react';
import {
  lmsQuizBank,
  lmsQuizCatalogById,
  lmsQuizSkillMeta,
  quizzesSkillHeatmap,
  type LmsQuizCatalogItem,
  type LmsQuizSkill,
} from '../../data/ai-mock';
import { useLmsState } from '../../state/LmsStateProvider';
import { getRelatedPracticeQuizId, scoreInsight } from '../quiz-utils';

type QuizTopicAnalytics = {
  skill: LmsQuizSkill;
  label: string;
  mastery: number;
  lastScore: number | null;
  bestScore: number | null;
  lastQuizId: string | null;
  lastAttemptDate: number | null;
  trend: 'up' | 'down' | 'steady' | null;
  weakConcepts: string[];
  recommendedQuizId: string | null;
  relatedQuizId: string | null;
  recommendedCourseId: string | null;
  courseFocus: string;
  hasHistory: boolean;
  retryLabel: string;
  suggestedLessonsLabel: string;
  summary: string;
};

type RetryQuizAnalytics = LmsQuizCatalogItem & {
  skill: LmsQuizSkill;
  label: string;
  lastScore: number | null;
  reviewQuizId: string | null;
  reviewAvailable: boolean;
  mastery: number;
};

type RecentAttemptAnalytics = {
  quizId: string;
  title: string;
  topicLabel: string;
  skill: LmsQuizSkill;
  score: number;
  bestScore: number;
  completedAt: number;
  durationSec: number | null;
  insight: string;
};

function fallbackMastery(skill: LmsQuizSkill) {
  return quizzesSkillHeatmap.find((row) => row.slug === skill)?.pct ?? 0;
}

function topicBuckets() {
  return Object.keys(lmsQuizSkillMeta).reduce(
    (acc, key) => {
      acc[key as LmsQuizSkill] = [];
      return acc;
    },
    {} as Record<LmsQuizSkill, Array<{ quizId: string; score: number; completedAt: number; bestScore: number; durationSec?: number }>>
  );
}

export function useQuizAnalytics() {
  const { state } = useLmsState();
  const attempts = state.quizAttempts;

  return useMemo(() => {
    const attemptEntries = Object.entries(attempts);
    const hasAttempts = attemptEntries.length > 0;

    let totalScore = 0;
    let mostRecentQuizId: string | null = null;
    let mostRecentDate = 0;
    const buckets = topicBuckets();

    for (const [quizId, attempt] of attemptEntries) {
      totalScore += attempt.score;
      if (attempt.completedAt > mostRecentDate) {
        mostRecentDate = attempt.completedAt;
        mostRecentQuizId = quizId;
      }

      const quiz = lmsQuizBank[quizId];
      if (!quiz) continue;
      buckets[quiz.skill].push({ quizId, ...attempt });
    }

    const avgScore = hasAttempts ? Math.round(totalScore / attemptEntries.length) : 0;
    const recentQuiz = mostRecentQuizId ? lmsQuizBank[mostRecentQuizId] : null;
    const recentAttemptState = mostRecentQuizId ? attempts[mostRecentQuizId] : null;
    const recentAttempt: RecentAttemptAnalytics | null =
      mostRecentQuizId && recentQuiz && recentAttemptState
        ? {
            quizId: mostRecentQuizId,
            title: recentQuiz.title,
            topicLabel: lmsQuizSkillMeta[recentQuiz.skill].label,
            skill: recentQuiz.skill,
            score: recentAttemptState.score,
            bestScore: recentAttemptState.bestScore ?? recentAttemptState.score,
            completedAt: recentAttemptState.completedAt,
            durationSec: recentAttemptState.durationSec ?? null,
            insight: scoreInsight(recentAttemptState.score),
          }
        : null;

    const topicAverages: Record<string, number> = {};
    const topicDetails = {} as Record<LmsQuizSkill, QuizTopicAnalytics>;

    (Object.keys(lmsQuizSkillMeta) as LmsQuizSkill[]).forEach((skill) => {
      const records = [...buckets[skill]].sort((a, b) => b.completedAt - a.completedAt);
      const total = records.reduce((sum, item) => sum + item.score, 0);
      const mastery = records.length > 0 ? Math.round(total / records.length) : fallbackMastery(skill);
      const latest = records[0] ?? null;
      const previous = records[1] ?? null;
      const recommendedQuizId =
        records.length > 0 ? getRelatedPracticeQuizId(latest?.quizId ?? lmsQuizSkillMeta[skill].defaultQuizId) ?? lmsQuizSkillMeta[skill].defaultQuizId : lmsQuizSkillMeta[skill].defaultQuizId;
      const recommendedQuiz = recommendedQuizId ? lmsQuizCatalogById[recommendedQuizId] ?? null : null;
      const trend =
        latest && previous
          ? latest.score > previous.score
            ? 'up'
            : latest.score < previous.score
              ? 'down'
              : 'steady'
          : null;

      topicAverages[skill] = mastery;
      topicDetails[skill] = {
        skill,
        label: lmsQuizSkillMeta[skill].label,
        mastery,
        lastScore: latest?.score ?? null,
        bestScore:
          records.length > 0
            ? Math.max(...records.map((item) => item.bestScore ?? item.score))
            : null,
        lastQuizId: latest?.quizId ?? null,
        lastAttemptDate: latest?.completedAt ?? null,
        trend,
        weakConcepts: recommendedQuiz?.weakConcepts ?? lmsQuizSkillMeta[skill].weakConcepts,
        recommendedQuizId,
        relatedQuizId: latest ? getRelatedPracticeQuizId(latest.quizId) : recommendedQuizId,
        recommendedCourseId: recommendedQuiz?.recommendedCourseId ?? lmsQuizSkillMeta[skill].recommendedCourseId,
        courseFocus: recommendedQuiz?.courseFocus ?? lmsQuizSkillMeta[skill].courseFocus,
        hasHistory: records.length > 0,
        retryLabel: lmsQuizSkillMeta[skill].retryLabel,
        suggestedLessonsLabel: lmsQuizSkillMeta[skill].suggestedLessonsLabel,
        summary: lmsQuizSkillMeta[skill].summary,
      };
    });

    let weakestTopic: LmsQuizSkill | '' = '';
    let lowestScore = 101;
    (Object.keys(topicDetails) as LmsQuizSkill[]).forEach((skill) => {
      if (!topicDetails[skill].hasHistory) return;
      if (topicDetails[skill].mastery < lowestScore) {
        lowestScore = topicDetails[skill].mastery;
        weakestTopic = skill;
      }
    });

    const retryQuizzes: RetryQuizAnalytics[] = (Object.keys(topicDetails) as LmsQuizSkill[])
      .filter((skill) => topicDetails[skill].hasHistory && topicDetails[skill].mastery < 75)
      .sort((a, b) => topicDetails[a].mastery - topicDetails[b].mastery)
      .map((skill) => {
        const topic = topicDetails[skill];
        const quizId = topic.recommendedQuizId ?? lmsQuizSkillMeta[skill].defaultQuizId;
        const quiz = lmsQuizCatalogById[quizId];
        return quiz
          ? {
              ...quiz,
              skill,
              label: topic.retryLabel,
              lastScore: topic.lastScore,
              reviewQuizId: topic.lastQuizId,
              reviewAvailable: Boolean(topic.lastQuizId),
              mastery: topic.mastery,
            }
          : null;
      })
      .filter((item): item is RetryQuizAnalytics => Boolean(item))
      .slice(0, 4);

    return {
      hasAttempts,
      avgScore,
      recentScore: recentAttempt?.score ?? null,
      recentScoreStr: recentAttempt ? `${recentAttempt.score}` : '-',
      recentQuizId: recentAttempt?.quizId ?? null,
      recentAttempt,
      topicAverages,
      topicDetails,
      weakestTopic,
      lowestScore: weakestTopic ? lowestScore : 0,
      retryQuizzes,
      attemptCount: attemptEntries.length,
      lastAttemptDate: mostRecentDate || null,
    };
  }, [attempts]);
}
