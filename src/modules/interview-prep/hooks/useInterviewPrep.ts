'use client';

import { useCallback, useEffect, useState } from 'react';
import { interviewData as initialInterviewData, generateMockQuestions } from '../data/mockInterviewData';
import type { InterviewPrepData, QuestionSet, MockSessionResult } from '../types/interview.types';
import { fetchInterviewPrep, startInterviewSession } from '@/app/lms/api/client';
import { getApiBaseUrl } from '@/lib/api-base';

type MockConfig = {
  difficulty: string;
  role: string;
};

export function useInterviewPrep() {
  const [data, setData] = useState<InterviewPrepData>(initialInterviewData);
  const [mockConfig, setMockConfig] = useState<MockConfig>({ difficulty: 'Intermediate', role: 'Frontend Developer' });
  const [generatedSet, setGeneratedSet] = useState<QuestionSet | null>(null);

  // We persist subsets of interview prep state in sessionStorage/localStorage for the Mock
  const [sessionResults, setSessionResults] = useState<MockSessionResult[]>([]);
  const [savedSets, setSavedSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const sessions = await fetchInterviewPrep();
        if (sessions && Array.isArray(sessions)) {
          // Map backend sessions to the format expected by the frontend
          const mappedResults: MockSessionResult[] = sessions.map((s: any) => ({
             id: s.id,
             config: {
               role: s.roleFocus || 'Frontend Developer',
               difficulty: s.difficulty || 'Intermediate'
             },
             answers: {}, // Backend doesn't store full answers yet in this summary
             createdAt: new Date(s.createdAt).getTime(),
             strengths: s.feedback?.strengths || [],
             improvements: s.feedback?.improvements || [],
             gaps: []
          }));
          setSessionResults(mappedResults);
          
          // Update overall readiness if we have results
          if (mappedResults.length > 0) {
             const latest = mappedResults[0];
             setData(prev => ({
               ...prev,
               readiness: Math.min(100, 65 + mappedResults.length * 5),
               confidenceScore: Math.min(100, 70 + mappedResults.length * 3),
               feedback: {
                 strengths: latest.strengths,
                 improvements: latest.improvements
               }
             }));
          }
        }
      } catch (err) {
        console.error('Failed to load interview sessions', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    load();
    
    // Also load local sets if any (for non-persisted practice sets)
    try {
      const storedSets = localStorage.getItem('ip:sets');
      if (storedSets) setSavedSets(JSON.parse(storedSets));
    } catch {}
  }, []);

  const onStartMock = useCallback(async () => {
    try {
      await startInterviewSession({
        type: 'MOCK',
        topic: `${mockConfig.role} - ${mockConfig.difficulty}`
      });
    } catch (err) {
       // Silently fail or handle error
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
        rubric: q.evaluationCriteria || `Assessing expertise for a ${aiData.experienceLevel || 'Mid'} ${aiData.role || 'Developer'}.`
      }));

      const label = (aiData.role && aiData.domain) 
        ? `${aiData.role} (${aiData.domain})`
        : (aiData.domain || 'Practice Set');

      const set: QuestionSet = {
        id: `set-${Date.now()}`,
        kind: label,
        questions,
        createdAt: Date.now()
      };
      
      setGeneratedSet(set);
      
      setSavedSets(prev => {
        const next = [set, ...prev];
        try { localStorage.setItem('ip:sets', JSON.stringify(next)); } catch {}
        return next;
      });

      return set;
    } catch (err) {
      console.error('Failed to generate custom set:', err);
      // Fallback
      const fallbackSet: QuestionSet = {
        id: `set-${Date.now()}`,
        kind: 'Fallback Set',
        questions: generateMockQuestions('technical'),
        createdAt: Date.now()
      };
      setGeneratedSet(fallbackSet);
      return fallbackSet;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onAddToPlan = useCallback((topic: string | string[]) => {
    // Return array of topics to plan
    return Array.isArray(topic) ? topic : [topic];
  }, []);

  const saveMockSession = useCallback((result: MockSessionResult) => {
    setSessionResults(prev => {
      const next = [result, ...prev];
      try { localStorage.setItem('ip:sessions', JSON.stringify(next)); } catch {}
      return next;
    });
    
    // Update feedback/readiness loosely based on mock results
    setData(prev => ({
      ...prev,
      readiness: Math.min(100, prev.readiness + 2),
      confidenceScore: Math.min(100, prev.confidenceScore + 3),
      feedback: {
        strengths: Array.from(new Set([...result.strengths, ...prev.feedback.strengths])).slice(0, 4),
        improvements: Array.from(new Set([...result.improvements, ...prev.feedback.improvements])).slice(0, 4),
      }
    }));
  }, []);

  const applyScoreUpdate = useCallback((partial: Partial<InterviewPrepData['scores']>) => {
    setData((prev) => ({
      ...prev,
      scores: { ...prev.scores, ...partial },
    }));
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
    isLoading
  };
}
