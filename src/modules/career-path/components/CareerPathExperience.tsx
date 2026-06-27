'use client';

import { LmsPageHeader } from '@/app/lms/components/LmsPageHeader';
import { useCareerJourney } from '../hooks/useCareerJourney';
import { CareerAssessmentView } from './CareerAssessmentView';
import { CareerAnalysisView } from './CareerAnalysisView';
import { CareerJourneyDashboard } from './CareerJourneyDashboard';
import { CareerJourneyLanding } from './CareerJourneyLanding';

export function CareerPathExperience() {
  const {
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
    hasJourney,
  } = useCareerJourney();

  if (loading) {
    return <p className="text-sm text-gray-500">Loading career path…</p>;
  }

  const showDashboard = hasJourney && view === 'home';
  const showLanding = !hasJourney && view === 'home';

  return (
    <div className="space-y-8 pb-10">
      <LmsPageHeader
        eyebrow="AI career coach"
        title="Career path"
        subtitle="Design your career journey with AI assessment, milestones, skill tracking, projects, and mentor guidance."
      />

      {showLanding ? (
        <CareerJourneyLanding
          onCreate={() => setView('assessment')}
          onContinue={() => setView('home')}
          hasDraft={hasJourney}
        />
      ) : null}

      {view === 'assessment' ? (
        <CareerAssessmentView
          submitting={submitting}
          onSubmit={(assessment) => void runAssessment(assessment)}
          onCancel={() => setView(hasJourney ? 'home' : 'home')}
        />
      ) : null}

      {view === 'analysis' && draftJourney ? (
        <CareerAnalysisView
          journey={draftJourney}
          onConfirm={confirmJourney}
          onBack={() => setView('assessment')}
        />
      ) : null}

      {showDashboard && journey ? (
        <CareerJourneyDashboard
          journey={journey}
          submitting={submitting}
          onToggleTask={toggleTask}
          onUpdateProject={updateProject}
          onEarnCertificate={earnCertificate}
          onImprovePath={(goal) => void improvePath(goal)}
          onCreateNew={() => setView('assessment')}
          onReset={() => {
            if (confirm('Reset your entire career journey?')) resetJourney();
          }}
        />
      ) : null}
    </div>
  );
}
