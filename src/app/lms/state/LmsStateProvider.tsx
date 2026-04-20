'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  CAREER_STEP_IDS,
  careerMissionStepIds,
  eventsWithAI,
  notesUserNotes,
  type NoteType,
} from '../data/ai-mock';
import { 
  updateCareerPath, 
  fetchCareerPath, 
  fetchResumeDraft, 
  updateResumeDraft, 
  generateResumeSummary, 
  analyzeResumeDraft, 
  startMission,
  fetchLmsDashboard,
  setLmsGoal
} from '../api/client';

export type LmsPlannedItemType = 'course' | 'quiz' | 'event' | 'topic' | 'note' | 'resume';

export type LmsPlannedItem = {
  id: string;
  type: LmsPlannedItemType;
  label: string;
  href?: string;
  sourceModule?: string;
  sourceLabel?: string;
  context?: string;
  createdAt: number;
};

export type ResumeExperience = {
  id: string;
  company: string;
  role: string;
  duration: string;
  bullets: string;
};

export type ResumeEducation = {
  id: string;
  institution: string;
  degree: string;
  duration: string;
};

export type ResumeSections = {
  basics: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  skills: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
};

export type LmsResumeAnalysisResult = {
  readinessScore: number;
  recruiterView: string;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
};

export type LmsResumeDraftState = {
  template: string | null;
  sections: ResumeSections;
  updatedAtLabel: string;
  isHydrated: boolean;
  isSaving: boolean;
  analysis?: LmsResumeAnalysisResult;
  isAnalyzing: boolean;
};

type LmsNote = {
  id: string;
  title: string;
  body: string;
  updated: string;
  type: NoteType;
};

type LmsCareerPathState = {
  started: boolean;
  role?: string;
  manualCompletedStepIds: string[];
  completedStepIds: string[];
  roadmapItems?: any[];
};

type LmsQuizAttemptSummary = {
  score: number;
  completedAt: number;
  bestScore: number;
  durationSec?: number;
};

type LmsState = {
  savedCourseIds: string[];
  registeredEventIds: string[];
  plannedItems: LmsPlannedItem[];
  lastActiveCourseId: string | null;
  courseProgress: Record<string, number>;
  courseLessonIndex: Record<string, number>;
  selectedSkill: string | null;
  quizAttempts: Record<string, LmsQuizAttemptSummary>;
  notes: LmsNote[];
  resumeDraft: LmsResumeDraftState;
  careerPath: LmsCareerPathState;
  dashboardData: any;
  isHydrated: boolean;
};

type Action =
  | { type: 'toggleSaveCourse'; courseId: string }
  | { type: 'registerEvent'; eventId: string }
  | { type: 'unregisterEvent'; eventId: string }
  | { type: 'addPlannedItem'; item: Omit<LmsPlannedItem, 'createdAt'> }
  | { type: 'removePlannedItem'; id: string }
  | { type: 'setLastActiveCourseId'; courseId: string | null }
  | { type: 'setCourseProgress'; courseId: string; progress: number }
  | { type: 'setCourseLessonIndex'; courseId: string; index: number }
  | { type: 'setSelectedSkill'; skill: string | null }
  | { type: 'setQuizAttempt'; quizId: string; score: number; durationSec?: number }
  | {
      type: 'createNote';
      note: { id: string; title: string; body: string; type: NoteType; updated: string };
    }
  | { type: 'updateNote'; id: string; patch: Partial<{ title: string; body: string; type: NoteType; updated: string }> }
  | { type: 'deleteNote'; id: string }
  | { type: 'setResumeTemplate'; template: string | null }
  | { type: 'setResumeDraftSections'; sections: Partial<ResumeSections> }
  | { type: 'resetResumeDraft' }
  | { type: 'markResumeSaved' }
  | { type: 'resumeHydrate'; draft: Partial<LmsResumeDraftState> }
  | { type: 'setResumeAnalyzing'; isAnalyzing: boolean }
  | { type: 'setResumeAnalysis'; analysis: LmsResumeAnalysisResult }
  | { type: 'careerStart'; roadmapItems?: any[]; role?: string }
  | { type: 'careerToggleStep'; stepId: string }
  | { type: 'careerSetStepCompletion'; stepId: string; completed: boolean }
  | { type: 'careerReset' }
  | { type: 'careerHydrate'; data: Partial<LmsCareerPathState> }
  | { type: 'careerSetTargetRoles'; roles: string[] }
  | { type: 'setDashboardData'; data: any }
  | { type: 'hydrate'; state: LmsState };

const STORAGE_KEY = 'lmsState:v1';
const VALID_NOTE_TYPES: NoteType[] = ['Interview Prep', 'Learning Notes', 'Company Research', 'Salary Research'];
const VALID_PLANNED_TYPES: LmsPlannedItemType[] = ['course', 'quiz', 'event', 'topic', 'note', 'resume'];
const VALID_EVENT_IDS = new Set(eventsWithAI.map((event) => event.id));
const EVENT_TITLE_TO_ID = new Map(eventsWithAI.map((event) => [event.title.toLowerCase(), event.id]));
const VALID_CAREER_STEP_IDS = new Set(careerMissionStepIds);
const NETWORKING_EVENT_IDS = new Set(['evt-102', 'evt-104']);

const initialResumeDraft: LmsResumeDraftState = {
  template: null,
  updatedAtLabel: 'Not saved yet',
  isHydrated: false,
  isSaving: false,
  isAnalyzing: false,
  sections: {
    basics: {
      name: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
    },
    summary: '',
    skills: '',
    experience: [],
    education: [],
  },
};

const initialState: LmsState = {
  savedCourseIds: [],
  registeredEventIds: [],
  plannedItems: [],
  lastActiveCourseId: null,
  courseProgress: {},
  courseLessonIndex: {},
  selectedSkill: null,
  quizAttempts: {},
  notes: notesUserNotes.map((n) => ({
    ...n,
    body: `Mock note body for "${n.title}".\n\n- Add highlights\n- Add links\n- Convert into quiz prompts`,
  })),
  resumeDraft: initialResumeDraft,
  careerPath: {
    started: false,
    manualCompletedStepIds: [],
    completedStepIds: [],
    roadmapItems: [],
  },
  dashboardData: null,
  isHydrated: false,
};

function clampPct(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return uniqueStrings(
    value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean)
  );
}

function normalizeEventIds(value: unknown) {
  return uniqueStrings(
    normalizeStringArray(value)
      .map((entry) => {
        if (VALID_EVENT_IDS.has(entry)) return entry;
        return EVENT_TITLE_TO_ID.get(entry.toLowerCase()) ?? null;
      })
      .filter((entry): entry is string => Boolean(entry))
  );
}

function normalizeCareerStepIds(value: unknown) {
  return normalizeStringArray(value).filter((stepId) => VALID_CAREER_STEP_IDS.has(stepId));
}

function sanitizeNoteType(value: unknown): NoteType {
  return VALID_NOTE_TYPES.includes(value as NoteType) ? (value as NoteType) : 'Learning Notes';
}

function sanitizeNotes(value: unknown): LmsNote[] {
  if (!Array.isArray(value)) return initialState.notes;
  const notes = value
    .filter(isRecord)
    .map((note) => {
      if (typeof note.id !== 'string' || typeof note.title !== 'string' || typeof note.body !== 'string') return null;
      return {
        id: note.id,
        title: note.title,
        body: note.body,
        updated: typeof note.updated === 'string' ? note.updated : 'Just now',
        type: sanitizeNoteType(note.type),
      } satisfies LmsNote;
    })
    .filter((note): note is LmsNote => Boolean(note));

  return notes.length > 0 ? notes : initialState.notes;
}

function sanitizeExperience(value: unknown) {
  if (!Array.isArray(value)) return initialResumeDraft.sections.experience;
  const experience = value
    .filter(isRecord)
    .map((item) => {
      if (
        typeof item.id !== 'string' ||
        typeof item.company !== 'string' ||
        typeof item.role !== 'string' ||
        typeof item.duration !== 'string' ||
        typeof item.bullets !== 'string'
      ) {
        return null;
      }
      return item as ResumeExperience;
    })
    .filter((item): item is ResumeExperience => Boolean(item));

  return experience.length > 0 ? experience : initialResumeDraft.sections.experience;
}

function sanitizeEducation(value: unknown) {
  if (!Array.isArray(value)) return initialResumeDraft.sections.education;
  const education = value
    .filter(isRecord)
    .map((item) => {
      if (
        typeof item.id !== 'string' ||
        typeof item.institution !== 'string' ||
        typeof item.degree !== 'string' ||
        typeof item.duration !== 'string'
      ) {
        return null;
      }
      return item as ResumeEducation;
    })
    .filter((item): item is ResumeEducation => Boolean(item));

  return education.length > 0 ? education : initialResumeDraft.sections.education;
}

function sanitizeResumeDraft(value: unknown): LmsResumeDraftState {
  if (!isRecord(value)) return initialResumeDraft;
  const sections = isRecord(value.sections) ? value.sections : {};
  const basics = isRecord(sections.basics) ? sections.basics : {};

  return {
    template: typeof value.template === 'string' ? value.template : null,
    updatedAtLabel: typeof value.updatedAtLabel === 'string' ? value.updatedAtLabel : initialResumeDraft.updatedAtLabel,
    isHydrated: value.isHydrated === true,
    isSaving: value.isSaving === true,
    isAnalyzing: value.isAnalyzing === true,
    analysis: isRecord(value.analysis) ? (value.analysis as LmsResumeAnalysisResult) : undefined,
    sections: {
      basics: {
        name: typeof basics.name === 'string' ? basics.name : initialResumeDraft.sections.basics.name,
        headline:
          typeof basics.headline === 'string' ? basics.headline : initialResumeDraft.sections.basics.headline,
        email: typeof basics.email === 'string' ? basics.email : initialResumeDraft.sections.basics.email,
        phone: typeof basics.phone === 'string' ? basics.phone : initialResumeDraft.sections.basics.phone,
        location:
          typeof basics.location === 'string' ? basics.location : initialResumeDraft.sections.basics.location,
      },
      summary: typeof sections.summary === 'string' ? sections.summary : initialResumeDraft.sections.summary,
      skills: typeof sections.skills === 'string' ? sections.skills : initialResumeDraft.sections.skills,
      experience: sanitizeExperience(sections.experience),
      education: sanitizeEducation(sections.education),
    },
  };
}

function sanitizePlannedItems(value: unknown): LmsPlannedItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (
        !isRecord(item) ||
        typeof item.id !== 'string' ||
        typeof item.label !== 'string' ||
        typeof item.type !== 'string' ||
        !VALID_PLANNED_TYPES.includes(item.type as LmsPlannedItemType)
      ) {
        return null;
      }
      return {
        id: item.id,
        label: item.label,
        type: item.type as LmsPlannedItemType,
        href: typeof item.href === 'string' ? item.href : undefined,
        sourceModule: typeof item.sourceModule === 'string' ? item.sourceModule : undefined,
        sourceLabel: typeof item.sourceLabel === 'string' ? item.sourceLabel : undefined,
        context: typeof item.context === 'string' ? item.context : undefined,
        createdAt: typeof item.createdAt === 'number' && Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      } satisfies LmsPlannedItem;
    })
    .filter((item) => item !== null) as LmsPlannedItem[];
}

function sanitizeNumberRecord(
  value: unknown,
  normalizer: (input: number) => number
): Record<string, number> {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value)
    .map(([key, raw]) => (typeof raw === 'number' && Number.isFinite(raw) ? [key, normalizer(raw)] : null))
    .filter((entry) => Boolean(entry)) as [string, number][];
  return Object.fromEntries(entries);
}

function sanitizeQuizAttempts(value: unknown): LmsState['quizAttempts'] {
  if (!isRecord(value)) return {};
  const entries = Object.entries(value)
    .map(([quizId, raw]) => {
      if (!isRecord(raw)) return null;
      if (typeof raw.score !== 'number' || !Number.isFinite(raw.score)) return null;
      const normalizedScore = clampPct(raw.score);
      return [
        quizId,
        {
          score: normalizedScore,
          completedAt:
            typeof raw.completedAt === 'number' && Number.isFinite(raw.completedAt) ? raw.completedAt : Date.now(),
          bestScore:
            typeof raw.bestScore === 'number' && Number.isFinite(raw.bestScore)
              ? clampPct(raw.bestScore)
              : normalizedScore,
          durationSec:
            typeof raw.durationSec === 'number' && Number.isFinite(raw.durationSec)
              ? Math.max(0, Math.round(raw.durationSec))
              : undefined,
        },
      ] as const;
    })
    .filter((entry): entry is readonly [string, LmsQuizAttemptSummary] => Boolean(entry));
  return Object.fromEntries(entries);
}

function buildCareerPathState(value: unknown): LmsCareerPathState {
  const raw = isRecord(value) ? value : {};
  return {
    started: raw.started === true,
    manualCompletedStepIds: normalizeCareerStepIds(raw.manualCompletedStepIds),
    completedStepIds: normalizeCareerStepIds(raw.completedStepIds),
  };
}

function deriveCareerCompletedStepIds(state: LmsState) {
  const derived: string[] = [];

  if ((state.quizAttempts.q1?.score ?? 0) >= 70) derived.push(CAREER_STEP_IDS.javascriptQuiz);
  if ((state.courseProgress.c2 ?? 0) >= 100) derived.push(CAREER_STEP_IDS.uiCraftCourse);
  if (state.quizAttempts.q2) derived.push(CAREER_STEP_IDS.reactQuiz);
  if (state.notes.some((note) => note.type === 'Learning Notes')) derived.push(CAREER_STEP_IDS.learningNote);
  if ((state.courseProgress.c1 ?? 0) >= 100) derived.push(CAREER_STEP_IDS.frontendReadinessCourse);
  if ((state.quizAttempts.q6?.score ?? 0) >= 60) derived.push(CAREER_STEP_IDS.systemDesignQuiz);
  if (state.resumeDraft.updatedAtLabel !== 'Not saved yet') derived.push(CAREER_STEP_IDS.resumeSync);
  if (state.notes.some((note) => note.type === 'Salary Research')) derived.push(CAREER_STEP_IDS.salaryResearchNote);
  if (state.registeredEventIds.includes('evt-103')) derived.push(CAREER_STEP_IDS.negotiationEvent);
  if (state.registeredEventIds.some((eventId) => NETWORKING_EVENT_IDS.has(eventId))) {
    derived.push(CAREER_STEP_IDS.networkingEvent);
  }

  return uniqueStrings(derived);
}

function syncCareerPathState(state: LmsState): LmsState {
  const registeredEventIds = normalizeEventIds(state.registeredEventIds);
  const manualCompletedStepIds = normalizeCareerStepIds(state.careerPath.manualCompletedStepIds);

  const derivedIds = deriveCareerCompletedStepIds({
    ...state,
    registeredEventIds,
    careerPath: {
      ...state.careerPath,
      manualCompletedStepIds,
      completedStepIds: state.careerPath.completedStepIds,
    },
  });

  const completedStepIds = uniqueStrings([...derivedIds, ...manualCompletedStepIds]);

  const eventIdsChanged = registeredEventIds.join('|') !== state.registeredEventIds.join('|');
  const manualChanged = manualCompletedStepIds.join('|') !== state.careerPath.manualCompletedStepIds.join('|');
  const completedChanged = completedStepIds.join('|') !== state.careerPath.completedStepIds.join('|');

  if (!eventIdsChanged && !manualChanged && !completedChanged) return state;

  return {
    ...state,
    registeredEventIds,
    careerPath: {
      ...state.careerPath,
      manualCompletedStepIds,
      completedStepIds,
    },
  };
}

function hydrateState(raw: unknown): LmsState {
  if (!isRecord(raw)) {
    return syncCareerPathState({ ...initialState, isHydrated: true });
  }

  const storedEventIds =
    'registeredEventIds' in raw ? raw.registeredEventIds : 'registeredEventTitles' in raw ? raw.registeredEventTitles : [];

  const nextState: LmsState = {
    ...initialState,
    savedCourseIds: normalizeStringArray(raw.savedCourseIds),
    registeredEventIds: normalizeEventIds(storedEventIds),
    plannedItems: sanitizePlannedItems(raw.plannedItems),
    lastActiveCourseId: typeof raw.lastActiveCourseId === 'string' ? raw.lastActiveCourseId : null,
    courseProgress: sanitizeNumberRecord(raw.courseProgress, clampPct),
    courseLessonIndex: sanitizeNumberRecord(raw.courseLessonIndex, (value) => Math.max(0, Math.floor(value))),
    selectedSkill: typeof raw.selectedSkill === 'string' ? raw.selectedSkill : null,
    quizAttempts: sanitizeQuizAttempts(raw.quizAttempts),
    notes: sanitizeNotes(raw.notes),
    resumeDraft: sanitizeResumeDraft(raw.resumeDraft),
    careerPath: buildCareerPathState(raw.careerPath),
    isHydrated: true,
  };

  return syncCareerPathState(nextState);
}

function reducer(state: LmsState, action: Action): LmsState {
  switch (action.type) {
    case 'setDashboardData':
      return { ...state, dashboardData: action.data };
    case 'hydrate':
      return syncCareerPathState({ ...action.state, isHydrated: true });
    case 'toggleSaveCourse': {
      const has = state.savedCourseIds.includes(action.courseId);
      return syncCareerPathState({
        ...state,
        savedCourseIds: has
          ? state.savedCourseIds.filter((id) => id !== action.courseId)
          : [action.courseId, ...state.savedCourseIds],
      });
    }
    case 'registerEvent': {
      if (state.registeredEventIds.includes(action.eventId)) return state;
      return syncCareerPathState({ ...state, registeredEventIds: [action.eventId, ...state.registeredEventIds] });
    }
    case 'unregisterEvent':
      return syncCareerPathState({
        ...state,
        registeredEventIds: state.registeredEventIds.filter((eventId) => eventId !== action.eventId),
      });
    case 'addPlannedItem': {
      if (state.plannedItems.find((item) => item.id === action.item.id)) return state;
      return syncCareerPathState({
        ...state,
        plannedItems: [{ ...action.item, createdAt: Date.now() }, ...state.plannedItems].slice(0, 40),
      });
    }
    case 'removePlannedItem':
      return syncCareerPathState({ ...state, plannedItems: state.plannedItems.filter((item) => item.id !== action.id) });
    case 'setLastActiveCourseId':
      return syncCareerPathState({ ...state, lastActiveCourseId: action.courseId });
    case 'setCourseProgress':
      return syncCareerPathState({
        ...state,
        courseProgress: { ...state.courseProgress, [action.courseId]: clampPct(action.progress) },
      });
    case 'setCourseLessonIndex':
      return syncCareerPathState({
        ...state,
        courseLessonIndex: {
          ...state.courseLessonIndex,
          [action.courseId]: Math.max(0, Math.floor(action.index)),
        },
      });
    case 'setSelectedSkill':
      return syncCareerPathState({ ...state, selectedSkill: action.skill });
    case 'setQuizAttempt': {
      const prevAttempt = state.quizAttempts[action.quizId];
      const nextScore = clampPct(action.score);
      return syncCareerPathState({
        ...state,
        quizAttempts: {
          ...state.quizAttempts,
          [action.quizId]: {
            score: nextScore,
            completedAt: Date.now(),
            bestScore: Math.max(prevAttempt?.bestScore ?? prevAttempt?.score ?? 0, nextScore),
            durationSec:
              typeof action.durationSec === 'number' && Number.isFinite(action.durationSec)
                ? Math.max(0, Math.round(action.durationSec))
                : prevAttempt?.durationSec,
          },
        },
      });
    }
    case 'createNote':
      return syncCareerPathState({ ...state, notes: [action.note, ...state.notes] });
    case 'updateNote':
      return syncCareerPathState({
        ...state,
        notes: state.notes.map((note) => (note.id === action.id ? { ...note, ...action.patch } : note)),
      });
    case 'deleteNote':
      return syncCareerPathState({ ...state, notes: state.notes.filter((note) => note.id !== action.id) });
    case 'setResumeTemplate':
      return syncCareerPathState({ ...state, resumeDraft: { ...state.resumeDraft, template: action.template } });
    case 'setResumeDraftSections':
      return syncCareerPathState({
        ...state,
        resumeDraft: {
          ...state.resumeDraft,
          updatedAtLabel: 'Unsaved changes',
          sections: { ...state.resumeDraft.sections, ...action.sections },
        },
      });
    case 'resetResumeDraft':
      return syncCareerPathState({ ...state, resumeDraft: initialResumeDraft });
    case 'markResumeSaved':
      return syncCareerPathState({
        ...state,
        resumeDraft: { ...state.resumeDraft, updatedAtLabel: 'Just now' },
      });
    case 'resumeHydrate':
      return syncCareerPathState({ ...state, resumeDraft: { ...state.resumeDraft, ...action.draft } });
    case 'setResumeAnalyzing':
      return { ...state, resumeDraft: { ...state.resumeDraft, isAnalyzing: action.isAnalyzing } };
    case 'setResumeAnalysis':
      return { ...state, resumeDraft: { ...state.resumeDraft, analysis: action.analysis, isAnalyzing: false } };
    case 'careerStart':
      return syncCareerPathState({ 
        ...state, 
        careerPath: { 
          ...state.careerPath, 
          started: true, 
          roadmapItems: action.roadmapItems || [],
          role: action.role
        } 
      });
    case 'careerToggleStep': {
      const has = state.careerPath.manualCompletedStepIds.includes(action.stepId);
      return syncCareerPathState({
        ...state,
        careerPath: {
          ...state.careerPath,
          manualCompletedStepIds: has
            ? state.careerPath.manualCompletedStepIds.filter((id) => id !== action.stepId)
            : [action.stepId, ...state.careerPath.manualCompletedStepIds],
        },
      });
    }
    case 'careerSetStepCompletion': {
      const has = state.careerPath.manualCompletedStepIds.includes(action.stepId);
      if (action.completed && has) return state;
      if (!action.completed && !has) return state;
      return syncCareerPathState({
        ...state,
        careerPath: {
          ...state.careerPath,
          manualCompletedStepIds: action.completed
            ? [action.stepId, ...state.careerPath.manualCompletedStepIds]
            : state.careerPath.manualCompletedStepIds.filter((id) => id !== action.stepId),
        },
      });
    }
    case 'careerReset':
      return syncCareerPathState({
        ...state,
        careerPath: { ...state.careerPath, started: false, manualCompletedStepIds: [], completedStepIds: [] },
      });
    case 'careerHydrate':
      return syncCareerPathState({ ...state, careerPath: { ...state.careerPath, ...action.data } });
    default:
      return state;
  }
}

type LmsStateApi = {
  state: LmsState;
  toggleSaveCourse: (courseId: string) => void;
  registerEvent: (eventId: string) => void;
  unregisterEvent: (eventId: string) => void;
  addPlannedItem: (item: Omit<LmsPlannedItem, 'createdAt'>) => void;
  removePlannedItem: (id: string) => void;
  setLastActiveCourseId: (courseId: string | null) => void;
  setCourseProgress: (courseId: string, progress: number) => void;
  setCourseLessonIndex: (courseId: string, index: number) => void;
  setSelectedSkill: (skill: string | null) => void;
  setQuizAttempt: (quizId: string, score: number, durationSec?: number) => void;
  createNote: (note: { title: string; body: string; type: NoteType }) => string;
  updateNote: (id: string, patch: Partial<{ title: string; body: string; type: NoteType }>) => void;
  deleteNote: (id: string) => void;
  setResumeTemplate: (template: string | null) => void;
  setResumeDraftSections: (sections: Partial<LmsState['resumeDraft']['sections']>) => void;
  resetResumeDraft: () => void;
  markResumeSaved: () => void;
  syncResumeDraftToBackend: () => Promise<void>;
  generateResumeSummaryWithAi: (headline: string) => Promise<void>;
  analyzeResumeWithAi: () => Promise<void>;
  careerStart: () => Promise<void>;
  careerToggleStep: (stepId: string) => void;
  careerSetStepCompletion: (stepId: string, completed: boolean) => void;
  careerReset: () => void;
  setLmsGoalAction: (goal: string) => Promise<void>;
  fetchDashboard: () => Promise<any>;
};

const LmsStateContext = createContext<LmsStateApi | null>(null);

export function LmsStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load from backend on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [cp, resume, dashboard] = await Promise.allSettled([
          fetchCareerPath(),
          fetchResumeDraft(),
          fetchLmsDashboard()
        ]);
        
        if (cp.status === 'fulfilled' && cp.value) {
          dispatch({ 
            type: 'careerHydrate', 
            data: { 
              started: cp.value.missionStarted, 
              manualCompletedStepIds: cp.value.manualCompletedStepIds || [],
              roadmapItems: cp.value.roadmapItems || [],
              role: cp.value.role || undefined
            } 
          });
        }
        
        if (resume.status === 'fulfilled' && resume.value) {
           const val = resume.value;
           dispatch({
             type: 'resumeHydrate',
             draft: {
               template: val.templateId,
               updatedAtLabel: val.lastSavedAt ? `Last saved ${new Date(val.lastSavedAt).toLocaleDateString()}` : 'Not saved yet',
               sections: {
                 basics: val.basics || initialResumeDraft.sections.basics,
                 summary: val.basics?.summary || initialResumeDraft.sections.summary,
                 skills: Array.isArray(val.skills) ? val.skills.join(', ') : (typeof val.skills === 'string' ? val.skills : ''),
                 experience: Array.isArray(val.experience) ? val.experience : [],
                 education: Array.isArray(val.education) ? val.education : []
               }
             }
           });
        }

        if (dashboard.status === 'fulfilled' && dashboard.value) {
          dispatch({ type: 'setDashboardData', data: dashboard.value });
        }
      } catch (err) {
        // Silently fail
      }
    };
    load();
  }, []);

  const syncResumeDraftToBackend = useCallback(async () => {
     try {
       const { sections, template } = state.resumeDraft;
       // Map frontend sections to backend expected format
       const payload = {
         templateId: template || 'modern',
         basics: sections.basics || {},
         skills: sections.skills ? sections.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
         experience: sections.experience || [],
         education: sections.education || [],
         certifications: [],
         layoutMatrix: 'standard'
       };
       await updateResumeDraft(payload);
       dispatch({ type: 'markResumeSaved' });
     } catch (err) {
       console.error('Failed to sync resume to backend', err);
       throw err;
     }
  }, [state.resumeDraft.template, state.resumeDraft.sections]);

  const generateResumeSummaryWithAi = useCallback(async (headline: string) => {
    try {
      const summary = await generateResumeSummary(headline);
      if (summary) {
        dispatch({
          type: 'setResumeDraftSections',
          sections: { summary }
        });
      }
    } catch (err) {
      console.error('Failed to generate summary with AI', err);
      throw err;
    }
  }, []);

  const analyzeResumeWithAi = useCallback(async () => {
    try {
      dispatch({ type: 'setResumeAnalyzing', isAnalyzing: true });
      const analysis = await analyzeResumeDraft();
      if (analysis) {
        dispatch({ type: 'setResumeAnalysis', analysis });
      } else {
        dispatch({ type: 'setResumeAnalyzing', isAnalyzing: false });
      }
    } catch (err) {
      dispatch({ type: 'setResumeAnalyzing', isAnalyzing: false });
      console.error('Failed to analyze resume with AI', err);
      throw err;
    }
  }, []);

  // Sync career path to backend when it changes
  useEffect(() => {
    if (!state.isHydrated) return;
    
    const sync = async () => {
      try {
        await updateCareerPath({
          missionStarted: state.careerPath.started,
          manualCompletedStepIds: state.careerPath.manualCompletedStepIds,
        });
      } catch (err) {
        console.error('Failed to sync career path to backend', err);
      }
    };
    
    sync();
  }, [state.careerPath.started, state.careerPath.manualCompletedStepIds, state.isHydrated]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        dispatch({ type: 'hydrate', state: hydrateState(null) });
        return;
      }
      dispatch({ type: 'hydrate', state: hydrateState(JSON.parse(raw)) });
    } catch {
      dispatch({ type: 'hydrate', state: hydrateState(null) });
    }
  }, []);

  useEffect(() => {
    if (!state.isHydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota/serialization errors
    }
  }, [state]);

  const toggleSaveCourse = useCallback((courseId: string) => dispatch({ type: 'toggleSaveCourse', courseId }), []);
  const registerEvent = useCallback((eventId: string) => dispatch({ type: 'registerEvent', eventId }), []);
  const unregisterEvent = useCallback((eventId: string) => dispatch({ type: 'unregisterEvent', eventId }), []);
  const addPlannedItem = useCallback(
    (item: Omit<LmsPlannedItem, 'createdAt'>) => dispatch({ type: 'addPlannedItem', item }),
    []
  );
  const removePlannedItem = useCallback((id: string) => dispatch({ type: 'removePlannedItem', id }), []);
  const setLastActiveCourseId = useCallback(
    (courseId: string | null) => dispatch({ type: 'setLastActiveCourseId', courseId }),
    []
  );
  const setCourseProgress = useCallback(
    (courseId: string, progress: number) => dispatch({ type: 'setCourseProgress', courseId, progress }),
    []
  );
  const setCourseLessonIndex = useCallback(
    (courseId: string, index: number) => dispatch({ type: 'setCourseLessonIndex', courseId, index }),
    []
  );
  const setSelectedSkill = useCallback((skill: string | null) => dispatch({ type: 'setSelectedSkill', skill }), []);
  const setQuizAttempt = useCallback(
    (quizId: string, score: number, durationSec?: number) =>
      dispatch({ type: 'setQuizAttempt', quizId, score, durationSec }),
    []
  );
  const createNote = useCallback((note: { title: string; body: string; type: NoteType }) => {
    const id = `n-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    dispatch({ type: 'createNote', note: { id, updated: 'Just now', ...note } });
    return id;
  }, []);
  const updateNote = useCallback((id: string, patch: Partial<{ title: string; body: string; type: NoteType }>) => {
    dispatch({ type: 'updateNote', id, patch: { ...patch, updated: 'Just now' } });
  }, []);
  const deleteNote = useCallback((id: string) => {
    dispatch({ type: 'deleteNote', id });
  }, []);
  const setResumeTemplate = useCallback((template: string | null) => dispatch({ type: 'setResumeTemplate', template }), []);
  const setResumeDraftSections = useCallback(
    (sections: Partial<LmsState['resumeDraft']['sections']>) =>
      dispatch({ type: 'setResumeDraftSections', sections }),
    []
  );
  const resetResumeDraft = useCallback(() => dispatch({ type: 'resetResumeDraft' }), []);
  const markResumeSaved = useCallback(() => dispatch({ type: 'markResumeSaved' }), []);
  const careerStart = useCallback(async () => {
    try {
      const data = await startMission();
      if (data) {
        dispatch({ 
          type: 'careerStart', 
          roadmapItems: data.roadmapItems || [],
          role: data.role || 'Target Role'
        });
      }
    } catch (err) {
      console.error('Failed to start career mission', err);
      throw err;
    }
  }, []);
  const careerToggleStep = useCallback((stepId: string) => dispatch({ type: 'careerToggleStep', stepId }), []);
  const careerSetStepCompletion = useCallback(
    (stepId: string, completed: boolean) => dispatch({ type: 'careerSetStepCompletion', stepId, completed }),
    []
  );
  const careerReset = useCallback(() => dispatch({ type: 'careerReset' }), []);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await fetchLmsDashboard();
      dispatch({ type: 'setDashboardData', data });
      return data;
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      return null;
    }
  }, []);

  const setLmsGoalAction = useCallback(async (goal: string) => {
    try {
      const data = await setLmsGoal(goal);
      if (data) {
        dispatch({ type: 'careerHydrate', data: { 
          started: data.missionStarted, 
          roadmapItems: data.roadmapItems || [],
          role: data.targetRole || goal
        }});
        // Re-fetch dashboard to see changes
        const d = await fetchLmsDashboard();
        dispatch({ type: 'setDashboardData', data: d });
      }
    } catch (error) {
      console.error('Failed to set goal', error);
    }
  }, [fetchLmsDashboard]);

  const api = useMemo<LmsStateApi>(
    () => ({
      state,
      toggleSaveCourse,
      registerEvent,
      unregisterEvent,
      addPlannedItem,
      removePlannedItem,
      setLastActiveCourseId,
      setCourseProgress,
      setCourseLessonIndex,
      setSelectedSkill,
      setQuizAttempt,
      createNote,
      updateNote,
      deleteNote,
      setResumeTemplate,
      setResumeDraftSections,
      resetResumeDraft,
      markResumeSaved,
      syncResumeDraftToBackend,
      generateResumeSummaryWithAi,
      analyzeResumeWithAi,
      careerStart,
      careerToggleStep,
      careerSetStepCompletion,
      careerReset,
      setLmsGoalAction,
      fetchDashboard,
    }),
    [
      state,
      toggleSaveCourse,
      registerEvent,
      unregisterEvent,
      addPlannedItem,
      removePlannedItem,
      setLastActiveCourseId,
      setCourseProgress,
      setCourseLessonIndex,
      setSelectedSkill,
      setQuizAttempt,
      createNote,
      updateNote,
      deleteNote,
      setResumeTemplate,
      setResumeDraftSections,
      resetResumeDraft,
      markResumeSaved,
      syncResumeDraftToBackend,
      generateResumeSummaryWithAi,
      analyzeResumeWithAi,
      careerStart,
      careerToggleStep,
      careerSetStepCompletion,
      careerReset,
      setLmsGoalAction,
      fetchDashboard,
    ]
  );

  return <LmsStateContext.Provider value={api}>{children}</LmsStateContext.Provider>;
}

export function useLmsState() {
  const ctx = useContext(LmsStateContext);
  if (!ctx) throw new Error('useLmsState must be used within LmsStateProvider');
  return ctx;
}
