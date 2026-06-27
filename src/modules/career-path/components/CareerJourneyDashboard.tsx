'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Bot,
  Check,
  ChevronRight,
  FolderGit2,
  Loader2,
  Map,
  Route,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { CareerJourney } from '../types';
import { buildMentorReply } from '../lib/journeyEngine';
import { LMS_CARD_CLASS } from '@/app/lms/constants';

type Props = {
  journey: CareerJourney;
  submitting: boolean;
  onToggleTask: (milestoneId: string, taskId: string) => void;
  onUpdateProject: (projectId: string, patch: { githubUrl?: string; demoUrl?: string; description?: string }) => void;
  onEarnCertificate: (certId: string) => void;
  onImprovePath: (goal: string) => void;
  onCreateNew: () => void;
  onReset: () => void;
};

export function CareerJourneyDashboard({
  journey,
  submitting,
  onToggleTask,
  onUpdateProject,
  onEarnCertificate,
  onImprovePath,
  onCreateNew,
  onReset,
}: Props) {
  const [mentorQuestion, setMentorQuestion] = useState('');
  const [mentorReply, setMentorReply] = useState('');
  const [improveGoal, setImproveGoal] = useState('');
  const [activeMilestoneId, setActiveMilestoneId] = useState(journey.milestones.find((m) => m.status === 'in-progress')?.id || journey.milestones[0]?.id || '');

  const activeMilestone = journey.milestones.find((m) => m.id === activeMilestoneId) || journey.milestones[0];

  const askMentor = () => {
    if (!mentorQuestion.trim()) return;
    setMentorReply(buildMentorReply(journey, mentorQuestion.trim()));
  };

  return (
    <div className="space-y-8">
      {/* Home hero */}
      <section className="overflow-hidden rounded-2xl border border-[#28A8E1]/20 bg-gradient-to-br from-[#1e3a5f] via-[#2563ab] to-[#28A8E1] p-6 text-white shadow-lg sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">My career journey</p>
        <h2 className="mt-2 text-2xl font-bold">{journey.goal}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-xs text-white/70">Current goal</p>
            <p className="mt-1 font-bold">{journey.targetRole}</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-xs text-white/70">Career progress</p>
            <p className="mt-1 text-2xl font-bold">{journey.progressPercent}%</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-xs text-white/70">Expected completion</p>
            <p className="mt-1 text-2xl font-bold">{journey.expectedCompletionMonths} mo</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-xs text-white/70">Current stage</p>
            <p className="mt-1 font-bold">{journey.currentStage}</p>
          </div>
        </div>
        <div className="mt-5 h-2 rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${journey.progressPercent}%` }} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={onCreateNew} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/25">
            Create new path
          </button>
          <button type="button" onClick={() => document.getElementById('improve-path')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-white/90">
            <Sparkles className="h-4 w-4" /> Improve with AI
          </button>
          <button type="button" onClick={onReset} className="rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:text-white">
            Reset journey
          </button>
        </div>
      </section>

      {/* Job readiness */}
      <section className={`${LMS_CARD_CLASS} border-emerald-100 bg-emerald-50/20`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">AI job readiness score</p>
            <p className="mt-1 text-4xl font-bold text-gray-900">{journey.jobReadinessScore}%</p>
            <p className="mt-2 text-sm text-gray-600">You are moving toward: {journey.jobReadyRoles.join(', ')}</p>
          </div>
          <TrendingUp className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-800">Still missing before applying:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {journey.missingForJob.map((item) => (
              <li key={item} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><Map className="h-5 w-5 text-[#28A8E1]" /> Career timeline</h3>
        <div className={`${LMS_CARD_CLASS} space-y-0`}>
          {journey.milestones.map((m, index) => (
            <div key={m.id} className="flex gap-4 border-b border-gray-100 py-4 last:border-0">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                  m.status === 'completed' ? 'bg-emerald-500 text-white' : m.status === 'in-progress' ? 'bg-[#28A8E1] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {m.status === 'completed' ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {index < journey.milestones.length - 1 ? <div className="mt-1 w-px flex-1 bg-gray-200" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-gray-900">{m.title}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">{m.status.replace('-', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{m.durationMonths} months · {m.skills.join(' · ')}</p>
                <div className="mt-2 h-1.5 max-w-xs rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#28A8E1]" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Milestones + tasks */}
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-gray-900">Milestones</h3>
          {journey.milestones.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMilestoneId(m.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                activeMilestoneId === m.id ? 'border-[#28A8E1] bg-sky-50' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <p className="text-sm font-bold text-gray-900">{m.title}</p>
              <p className="text-xs text-gray-500">{m.progress}% complete</p>
            </button>
          ))}
        </div>

        {activeMilestone ? (
          <div className={`${LMS_CARD_CLASS}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#28A8E1]">{activeMilestone.phaseLabel}</p>
                <h4 className="text-lg font-bold text-gray-900">{activeMilestone.title}</h4>
                <p className="mt-1 text-sm text-gray-600">{activeMilestone.reason}</p>
              </div>
              {activeMilestone.targetRoute ? (
                <Link href={activeMilestone.targetRoute} className="inline-flex items-center gap-1 rounded-xl bg-[#28A8E1] px-3 py-2 text-xs font-bold text-white">
                  Open LMS course <ChevronRight className="h-3 w-3" />
                </Link>
              ) : null}
            </div>
            <ul className="mt-5 space-y-2">
              {activeMilestone.tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => onToggleTask(activeMilestone.id, task.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      task.completed ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${task.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300'}`}>
                      {task.completed ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className={task.completed ? 'font-medium text-gray-700 line-through' : 'font-medium text-gray-900'}>{task.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* Skills */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><Target className="h-5 w-5 text-violet-600" /> Skill tracker</h3>
        <div className={`${LMS_CARD_CLASS} grid gap-4 sm:grid-cols-2`}>
          {journey.skills.map((skill) => (
            <div key={skill.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold text-gray-900">{skill.name}</span>
                <span className="font-bold text-[#28A8E1]">{skill.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#28A8E1] to-violet-500" style={{ width: `${skill.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects + certs */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><FolderGit2 className="h-5 w-5" /> Projects</h3>
          <div className="space-y-3">
            {journey.projects.map((project) => (
              <div key={project.id} className={LMS_CARD_CLASS}>
                <p className="font-bold text-gray-900">{project.title}</p>
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={project.description}
                  onChange={(e) => onUpdateProject(project.id, { description: e.target.value })}
                  placeholder="Project description..."
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="GitHub URL" value={project.githubUrl || ''} onChange={(e) => onUpdateProject(project.id, { githubUrl: e.target.value })} />
                  <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder="Demo URL" value={project.demoUrl || ''} onChange={(e) => onUpdateProject(project.id, { demoUrl: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><Award className="h-5 w-5" /> Certifications</h3>
          <div className={`${LMS_CARD_CLASS} space-y-3`}>
            {journey.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{cert.name}</p>
                  <p className="text-xs text-gray-500">{cert.status === 'earned' ? `Earned ${cert.earnedAt ? new Date(cert.earnedAt).toLocaleDateString() : ''}` : 'Pending'}</p>
                </div>
                {cert.status === 'pending' ? (
                  <button type="button" onClick={() => onEarnCertificate(cert.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">Mark earned</button>
                ) : (
                  <Check className="h-5 w-5 text-emerald-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Mentor */}
      <section id="career-mentor" className={`${LMS_CARD_CLASS} border-violet-100 bg-violet-50/20`}>
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><Bot className="h-5 w-5 text-violet-600" /> AI mentor</h3>
        <p className="mt-1 text-sm text-gray-600">Ask about job readiness, skills, or your next milestone.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
            value={mentorQuestion}
            onChange={(e) => setMentorQuestion(e.target.value)}
            placeholder='e.g. "Can I get a job with my current skills?"'
            onKeyDown={(e) => e.key === 'Enter' && askMentor()}
          />
          <button type="button" onClick={askMentor} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">Ask AI</button>
        </div>
        {mentorReply ? (
          <div className="mt-4 whitespace-pre-wrap rounded-xl border border-violet-100 bg-white p-4 text-sm text-gray-700">{mentorReply}</div>
        ) : null}
      </section>

      {/* Improve path */}
      <section id="improve-path" className={`${LMS_CARD_CLASS}`}>
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900"><Route className="h-5 w-5" /> Improve my path with AI</h3>
        <p className="mt-1 text-sm text-gray-600">Change your goal anytime — AI will rebuild milestones, skills, and gap analysis.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm" value={improveGoal} onChange={(e) => setImproveGoal(e.target.value)} placeholder="I want to become a Data Scientist instead..." />
          <button
            type="button"
            disabled={submitting || !improveGoal.trim()}
            onClick={() => onImprovePath(improveGoal.trim())}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Rebuild roadmap
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-3 text-sm font-semibold text-[#28A8E1]">
        <Link href="/lms/courses">Courses →</Link>
        <Link href="/lms/quizzes">Quizzes →</Link>
        <Link href="/lms/interview-prep">Interview prep →</Link>
        <Link href="/lms/resume-builder">Resume →</Link>
      </div>
    </div>
  );
}
