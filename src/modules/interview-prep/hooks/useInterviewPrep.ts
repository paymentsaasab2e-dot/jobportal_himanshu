'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { interviewData as initialInterviewData, generateMockQuestions } from '../data/mockInterviewData';
import type { InterviewPrepData, QuestionSet, MockSessionResult, InterviewScore } from '../types/interview.types';
import { fetchInterviewPrep, startInterviewSession } from '@/app/lms/api/client';
import { getApiBaseUrl } from '@/lib/api-base';
import { useLmsState } from '@/app/lms/state/LmsStateProvider';

type MockConfig = {
  difficulty: string;
  role: string;
};

function resolveProfileGoal(state: ReturnType<typeof useLmsState>['state']): string {
  const fromDashboard = state.dashboardData?.profileContext?.targetRoles?.[0];
  const fromCareer = state.careerPath?.role;
  const fromResume = state.resumeDraft?.sections?.basics?.headline;
  const raw = String(fromDashboard || fromCareer || fromResume || '').trim();
  return raw;
}

function emptyScores(): InterviewScore {
  return {
    overall: null,
    technical: null,
    behavioral: null,
    systemDesign: null,
    communication: null,
  };
}

export function useInterviewPrep() {
  const { state: lmsState } = useLmsState();
  const profileGoal = useMemo(() => resolveProfileGoal(lmsState), [lmsState]);

  const [data, setData] = useState<InterviewPrepData>(() => ({
    ...initialInterviewData,
    goal: '',
    readiness: null,
    scores: emptyScores(),
    confidenceScore: null,
    hasRealScores: false,
    nextAction: 'Start your first mock interview',
  }));
  const [mockConfig, setMockConfig] = useState<MockConfig>({
    difficulty: 'Intermediate',
    role: profileGoal || 'Software Engineer',
  });
  const [generatedSet, setGeneratedSet] = useState<QuestionSet | null>(null);
  const [sessionResults, setSessionResults] = useState<MockSessionResult[]>([]);
  const [savedSets, setSavedSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Keep goal in sync with LMS profile / career path (never invent a fake role).
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      goal: profileGoal || prev.goal || '',
    }));
    if (profileGoal) {
      setMockConfig((prev) => (prev.role && prev.role !== 'Software Engineer' ? prev : { ...prev, role: profileGoal }));
    }
  }, [profileGoal]);

  useEffect(() => {
    const load = async () => {
      try {
        const payload = await fetchInterviewPrep();
        const sessions = Array.isArray(payload?.recentSessions) ? payload.recentSessions : [];
        const summary = payload?.readinessSummary || null;

        const mappedResults: MockSessionResult[] = sessions.map((s: any) => {
          const questionFeedback = Array.isArray(s.questions)
            ? s.questions.flatMap((q: { aiFeedback?: { strengths?: string[]; improvements?: string[]; strengthsArray?: string[]; improvementsArray?: string[] } }) => {
                const fb = q.aiFeedback;
                if (!fb) return [];
                return [
                  ...(fb.strengths ?? fb.strengthsArray ?? []),
                  ...(fb.improvements ?? fb.improvementsArray ?? []),
                ];
              })
            : [];
          return {
            id: s.id,
            config: {
              role: s.roleFocus || s.category || profileGoal || 'Interview',
              difficulty: s.difficulty || 'Intermediate',
            },
            answers: {},
            createdAt: new Date(s.createdAt).getTime(),
            strengths: s.feedback?.strengths ?? questionFeedback.slice(0, 2),
            improvements: s.feedback?.improvements ?? questionFeedback.slice(2, 4),
            gaps: [],
          };
        });
        setSessionResults(mappedResults);

        const scoresFromApi = summary?.scores as InterviewScore | undefined;
        const hasRealScores = Boolean(
          summary?.scoredSessions > 0 ||
            (scoresFromApi &&
              Object.values(scoresFromApi).some((v) => v != null && Number.isFinite(Number(v)))),
        );

        const nextScores: InterviewScore = hasRealScores
          ? {
              overall: scoresFromApi?.overall ?? summary?.readinessPercent ?? null,
              technical: scoresFromApi?.technical ?? null,
              behavioral: scoresFromApi?.behavioral ?? null,
              systemDesign: scoresFromApi?.systemDesign ?? null,
              communication: scoresFromApi?.communication ?? null,
            }
          : emptyScores();

        const readiness =
          hasRealScores && nextScores.overall != null
            ? nextScores.overall
            : hasRealScores && summary?.readinessPercent != null
              ? Number(summary.readinessPercent)
              : null;

        const latest = mappedResults[0];
        setData((prev) => ({
          ...prev,
          goal: profileGoal || prev.goal || '',
          readiness,
          confidenceScore: readiness,
          scores: nextScores,
          hasRealScores,
          nextAction:
            String(summary?.suggestedNextAction || '').trim() ||
            (hasRealScores ? 'Take another mock session' : 'Start your first mock interview'),
          feedback: latest
            ? {
                strengths: latest.strengths,
                improvements: latest.improvements,
              }
            : { strengths: [], improvements: [] },
          aiInsight: hasRealScores
            ? `Based on ${summary?.scoredSessions || mappedResults.length} scored session(s). Keep practicing your weakest area.`
            : 'Complete a scored mock interview to unlock personalized readiness insights.',
        }));
      } catch (err) {
        console.error('Failed to load interview sessions', err);
        setData((prev) => ({
          ...prev,
          goal: profileGoal || prev.goal || '',
          readiness: null,
          scores: emptyScores(),
          confidenceScore: null,
          hasRealScores: false,
          nextAction: 'Start your first mock interview',
        }));
      } finally {
        setIsLoading(false);
      }
    };

    void load();

    try {
      const storedSets = localStorage.getItem('ip:sets');
      if (storedSets) setSavedSets(JSON.parse(storedSets));
    } catch {
      /* ignore */
    }
  }, [profileGoal]);

  const onStartMock = useCallback(async () => {
    try {
      await startInterviewSession({
        type: 'MOCK',
        topic: `${mockConfig.role} - ${mockConfig.difficulty}`,
      });
    } catch (err) {
      const { notifyInsufficientTokens } = await import('@/lib/token-errors');
      if (!notifyInsufficientTokens(err)) {
        console.warn('Mock session start failed', err);
      }
    }
    return mockConfig;
  }, [mockConfig]);

  const onGenerateQuestions = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/lms/questions/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      if (!res.ok) throw new Error('AI Generation failed');
      const aiData = await res.json();

      const questions = aiData.questions.map((q: any, i: number) => ({
        id: `ai-q-${Date.now()}-${i}`,
        category: q.type || 'technical',
        prompt: q.question,
        hint: q.expectedAnswer ? `Expected: ${q.expectedAnswer}` : `Focus on ${q.skillTag || 'core concepts'}.`,
        followUp: q.followUp ? [q.followUp] : ['How would you scale or test this?'],
        difficulty: q.difficulty,
        rubric: q.evaluationCriteria || `Assessing expertise for a ${aiData.experienceLevel || 'Mid'} ${aiData.role || 'Developer'}.`,
      }));

      const label =
        aiData.role && aiData.domain
          ? `${aiData.role} (${aiData.domain})`
          : aiData.domain || 'Practice Set';

      const set: QuestionSet = {
        id: `set-${Date.now()}`,
        kind: label,
        questions,
        createdAt: Date.now(),
      };

      setGeneratedSet(set);

      setSavedSets((prev) => {
        const next = [set, ...prev];
        try {
          localStorage.setItem('ip:sets', JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });

      return set;
    } catch (err) {
      console.error('Failed to generate custom set:', err);
      const fallbackSet: QuestionSet = {
        id: `set-${Date.now()}`,
        kind: 'Fallback Set',
        questions: generateMockQuestions('technical'),
        createdAt: Date.now(),
      };
      setGeneratedSet(fallbackSet);
      return fallbackSet;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onAddToPlan = useCallback((topic: string | string[]) => {
    return Array.isArray(topic) ? topic : [topic];
  }, []);

  const saveMockSession = useCallback((result: MockSessionResult) => {
    setSessionResults((prev) => {
      const next = [result, ...prev];
      try {
        localStorage.setItem('ip:sessions', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

    // Soft local bump only after a real session save; still reload from API when possible.
    setData((prev) => ({
      ...prev,
      nextAction: 'Review feedback, then take another mock',
      feedback: {
        strengths: Array.from(new Set([...result.strengths, ...prev.feedback.strengths])).slice(0, 4),
        improvements: Array.from(
          new Set([...result.improvements, ...prev.feedback.improvements]),
        ).slice(0, 4),
      },
    }));
  }, []);

  const applyScoreUpdate = useCallback((partial: Partial<InterviewPrepData['scores']>) => {
    setData((prev) => {
      const scores = { ...prev.scores, ...partial };
      const overall = scores.overall;
      return {
        ...prev,
        scores,
        readiness: overall ?? prev.readiness,
        confidenceScore: overall ?? prev.confidenceScore,
        hasRealScores: true,
      };
    });
  }, []);

  return {
    data,
    setData,
    mockConfig,
    setMockConfig,
    generatedSet,
    setGeneratedSet,
    savedSets,
    sessionResults,
    saveMockSession,
    onStartMock,
    onGenerateQuestions,
    onAddToPlan,
    applyScoreUpdate,
    isLoading,
  };
}
