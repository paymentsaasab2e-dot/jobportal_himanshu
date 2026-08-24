export type InterviewScore = {
  overall: number | null;
  technical: number | null;
  behavioral: number | null;
  systemDesign: number | null;
  communication: number | null;
};

export type Feedback = {
  strengths: string[];
  improvements: string[];
};

export type RevisionTopic = {
  id: string;
  title: string;
  type: 'technical' | 'behavioral' | 'system';
};

export type QuestionCategory = {
  title: string;
  description: string;
  count: string;
};

export type QuestionGeneratorKind = 'hr' | 'technical' | 'system' | 'company';

export type InterviewPrepData = {
  goal: string;
  readiness: number | null;
  nextAction: string;
  todayFocus: string[];
  feedback: Feedback;
  revisionTopics: RevisionTopic[];
  confidenceScore: number | null;
  scores: InterviewScore;
  aiInsight: string;
  questionGenerator: Array<{
    id: QuestionGeneratorKind;
    title: string;
    description: string;
  }>;
  questionBank: QuestionCategory[];
  suggestedCompanies: string[];
  /** True when scores come from completed mock sessions (not placeholders). */
  hasRealScores?: boolean;
};

/** Future: AI session transcript chunk */
export type InterviewTranscriptSegment = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
};

/** Future: voice / scoring pipeline */
export type MockInterviewSessionMeta = {
  sessionId: string;
  difficulty: string;
  role: string;
  voiceEnabled: boolean;
};

export type MockQuestion = {
  id: string;
  category: string;
  prompt: string;
  hint: string;
  followUp: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rubric: string;
};

export type QuestionSet = {
  id: string;
  kind: string;
  questions: MockQuestion[];
  createdAt: number;
};

export type CompanyInfo = {
  slug: string;
  name: string;
  overview: string;
  culture: string[];
  productTopics: string[];
  sampleQuestions: MockQuestion[];
  revisionTips: string[];
};

export type MockSessionResult = {
  id: string;
  config: { difficulty: string; role: string };
  answers: Record<string, string>;
  createdAt: number;
  strengths: string[];
  improvements: string[];
  gaps: string[];
};
