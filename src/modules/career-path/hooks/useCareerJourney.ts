'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCareerPath } from '@/app/lms/api/client';
import { useLmsState } from '@/app/lms/state/LmsStateProvider';
import type { CareerAssessment, CareerJourney, CareerPathView } from '../types';
import {
  buildCareerJourneyFromAssessment,
  improveJourneyGoal,
  mergeApiRoadmapIntoJourney,
  recomputeJourney,
} from '../lib/journeyEngine';
import { clearCareerJourney, readCareerJourney, saveCareerJourney } from '../lib/storage';

export function useCareerJourney() {
  const { setLmsGoalAction, careerStart } = useLmsState();
  const [journey, setJourney] = useState<CareerJourney | null>(null);
  const [view, setView] = useState<CareerPathView>('home');
  const [draftJourney, setDraftJourney] = useState<CareerJourney | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cached = readCareerJourney();
    if (cached) setJourney(cached);
    setLoading(false);
  }, []);

  const persist = useCallback((next: CareerJourney) => {
    const computed = recomputeJourney(next);
    saveCareerJourney(computed);
    setJourney(computed);
    return computed;
  }, []);

  const runAssessment = useCallback(
    async (assessment: CareerAssessment) => {
      setSubmitting(true);
      try {
        let built = buildCareerJourneyFromAssessment(assessment);
        try {
          await setLmsGoalAction(assessment.careerGoal);
          await careerStart();
          const apiPath = await fetchCareerPath();
          if (apiPath?.roadmapItems?.length) {
            built = mergeApiRoadmapIntoJourney(built, apiPath.roadmapItems);
          }
        } catch {
          /* local journey still works offline */
        }
        setDraftJourney(built);
        setView('analysis');
        return built;
      } finally {
        setSubmitting(false);
      }
    },
    [careerStart, setLmsGoalAction],
  );

  const confirmJourney = useCallback(() => {
    if (!draftJourney) return;
    persist(draftJourney);
    setDraftJourney(null);
    setView('home');
  }, [draftJourney, persist]);

  const improvePath = useCallback(
    async (newGoal: string) => {
      if (!journey) return;
      setSubmitting(true);
      try {
        let next = improveJourneyGoal(journey, newGoal);
        try {
          await setLmsGoalAction(newGoal);
          const apiPath = await fetchCareerPath();
          if (apiPath?.roadmapItems?.length) {
            next = mergeApiRoadmapIntoJourney(next, apiPath.roadmapItems);
          }
        } catch {
          /* keep local rebuild */
        }
        persist(next);
        setView('home');
      } finally {
        setSubmitting(false);
      }
    },
    [journey, persist, setLmsGoalAction],
  );

  const toggleTask = useCallback(
    (milestoneId: string, taskId: string) => {
      if (!journey) return;
      const milestones = journey.milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      });
      persist({ ...journey, milestones });
    },
    [journey, persist],
  );

  const updateProject = useCallback(
    (projectId: string, patch: Partial<CareerJourney['projects'][number]>) => {
      if (!journey) return;
      persist({
        ...journey,
        projects: journey.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)),
      });
    },
    [journey, persist],
  );

  const earnCertificate = useCallback(
    (certId: string) => {
      if (!journey) return;
      persist({
        ...journey,
        certificates: journey.certificates.map((c) =>
          c.id === certId ? { ...c, status: 'earned', earnedAt: new Date().toISOString() } : c,
        ),
      });
    },
    [journey, persist],
  );

  const resetJourney = useCallback(() => {
    clearCareerJourney();
    setJourney(null);
    setDraftJourney(null);
    setView('home');
  }, []);

  return {
    journey,
    draftJourney,
    view,
    setView,
    loading,
    submitting,
    runAssessment,
    confirmJourney,
    improvePath,
    toggleTask,
    updateProject,
    earnCertificate,
    resetJourney,
    hasJourney: Boolean(journey),
  };
}
