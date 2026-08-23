import { getApiBaseUrl, switchToHostedBackend } from '@/lib/api-base';
import { getStoredToken } from '@/lib/auth-storage';
import { assertTokensOk, InsufficientTokensError } from '@/lib/tokens-api';

export const LMS_API_BASE = `${getApiBaseUrl()}/lms`;

function getAuthHeaders(): HeadersInit | null {
  if (typeof window === 'undefined') return null;

  const token = getStoredToken();
  if (!token || token === 'undefined' || token === 'null') return null;

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function rewriteLocalHostAlternate(url: string): string | null {
  if (/:\/\/localhost([:/]|$)/i.test(url)) {
    return url.replace(/:\/\/localhost/i, '://127.0.0.1');
  }
  if (/:\/\/127\.0\.0\.1([:/]|$)/i.test(url)) {
    return url.replace(/:\/\/127\.0\.0\.1/i, '://localhost');
  }
  return null;
}

function rewriteToCurrentApiBase(url: string): string | null {
  const match = url.match(/\/api(\/.*)$/i);
  if (!match) return null;
  return `${getApiBaseUrl()}${match[1]}`;
}

async function lmsFetch(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders();
  if (!headers) {
    return null;
  }

  const attempt = (target: string) =>
    fetch(target, {
      ...options,
      headers: { ...(headers as Record<string, string>), ...(options.headers || {}) },
    });

  const candidates: string[] = [url];
  const localAlt = rewriteLocalHostAlternate(url);
  if (localAlt) candidates.push(localAlt);

  let res: Response | null = null;
  for (const target of candidates) {
    try {
      res = await attempt(target);
      break;
    } catch {
      res = null;
    }
  }

  if (!res && /localhost|127\.0\.0\.1/i.test(url)) {
    try {
      switchToHostedBackend();
      const hosted = rewriteToCurrentApiBase(url);
      if (hosted) res = await attempt(hosted);
    } catch {
      res = null;
    }
  }

  if (!res) {
    throw new Error('Unable to connect right now');
  }

  if (res.status === 401) {
    const err = new Error('Please sign in again') as Error & { status?: number };
    err.status = 401;
    throw err;
  }

  if (res.status === 402) {
    await assertTokensOk(res);
  }

  const balanceHeader = res.headers.get('x-token-balance');
  if (balanceHeader != null && typeof window !== 'undefined') {
    const bal = Number(balanceHeader);
    if (!Number.isNaN(bal)) {
      window.dispatchEvent(
        new CustomEvent('saasa:token-balance', { detail: { tokenBalance: bal } }),
      );
    }
  }

  return res;
}

export async function fetchCourses(filters?: Record<string, string>) {
  const query = new URLSearchParams(filters).toString();
  const res = await lmsFetch(`${LMS_API_BASE}/courses${query ? `?${query}` : ''}`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json(); return data.data;
}

export async function fetchCourseDetail(courseId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/courses/${courseId}`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Unable to connect right now'); }
  const data = await res.json(); return data.data;
}

export async function toggleSaveCourse(courseId: string, saved: boolean) {
  const res = await lmsFetch(`${LMS_API_BASE}/courses/save`, { method: 'POST', body: JSON.stringify({ courseId, saved }) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to toggle save state');
  const data = await res.json(); return data.data;
}

export async function enrollCourse(courseId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/courses/enroll`, {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  });
  if (!res) throw new Error('No authentication token found. Please log in again.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) {
      const { InsufficientTokensError } = await import('@/lib/tokens-api');
      throw new InsufficientTokensError({
        message: data?.message || data?.error || 'Insufficient tokens',
        balance: data?.balance,
        required: data?.required,
        shortfall: data?.shortfall,
        service: data?.service,
      });
    }
    throw new Error(data?.message || data?.error || 'Failed to enroll');
  }
  return data.data;
}

export async function completeCourseLesson(courseId: string, lessonId: string) {
  const res = await lmsFetch(
    `${LMS_API_BASE}/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/complete`,
    { method: 'POST' },
  );
  if (!res) throw new Error('No authentication token found. Please log in again.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to complete lesson');
  return data.data;
}

export async function completeCourseCheckpoint(
  courseId: string,
  checkpointId: string,
  payload?: { file?: File | null; note?: string },
) {
  const form = new FormData();
  if (payload?.note) form.append('note', payload.note);
  if (payload?.file) form.append('file', payload.file);
  const headers = getAuthHeaders();
  if (!headers) throw new Error('No authentication token found. Please log in again.');
  const auth = (headers as Record<string, string>).Authorization;
  const res = await fetch(
    `${LMS_API_BASE}/courses/${encodeURIComponent(courseId)}/checkpoints/${encodeURIComponent(checkpointId)}/complete`,
    {
      method: 'POST',
      headers: auth ? { Authorization: auth } : {},
      body: form,
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to complete checkpoint');
  return data.data;
}

export async function fetchCourseCertificate(courseId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/courses/${encodeURIComponent(courseId)}/certificate`, {
    method: 'GET',
  });
  if (!res) throw new Error('No authentication token found. Please log in again.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Certificate is not ready yet');
  return data.data as { html: string; certificateId: string };
}

export async function fetchCourseCertificatePdf(courseId, download = false) {
  const res = await lmsFetch(
    `${LMS_API_BASE}/courses/${encodeURIComponent(courseId)}/certificate.pdf${download ? '?download=1' : ''}`,
    { method: 'GET' },
  );
  if (!res) throw new Error('No authentication token found. Please log in again.');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || data?.error || 'Certificate PDF is not ready yet');
  }
  const blob = await res.blob();
  const certificateId = res.headers.get('x-certificate-id') || 'certificate';
  const filename = `certificate-${certificateId.replace(/[^\w.-]+/g, '_')}.pdf`;
  return { blob, filename, certificateId };
}

export function viewCertificatePdf(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function downloadCertificatePdf(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'certificate.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function fetchEvents(filters?: Record<string, string>) {
  const query = new URLSearchParams(filters).toString();
  const res = await lmsFetch(`${LMS_API_BASE}/events${query ? `?${query}` : ''}`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json(); return data.data;
}

export async function fetchEventDetail(eventId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/events/${encodeURIComponent(eventId)}`, { method: 'GET' });
  if (!res) return null;
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json();
  return data.data;
}

export async function registerForEvent(eventId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/events/register`, { method: 'POST', body: JSON.stringify({ eventId }) });
  if (!res) throw new Error('No authentication token found. Please log in again.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) {
      const { InsufficientTokensError } = await import('@/lib/tokens-api');
      throw new InsufficientTokensError({
        message: data?.message || data?.error || 'Insufficient tokens',
        balance: data?.balance,
        required: data?.required,
        shortfall: data?.shortfall,
        service: data?.service,
      });
    }
    throw new Error(data?.message || data?.error || 'Failed to register');
  }
  return data.data;
}

export async function unregisterFromEvent(eventId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/events/unregister`, { method: 'POST', body: JSON.stringify({ eventId }) });
  if (!res) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Failed to unregister');
  return data.data;
}

export async function fetchCompletedQuizzes() {
  const res = await lmsFetch(`${LMS_API_BASE}/quizzes/completed`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json();
  return data.data;
}

export async function fetchQuizzes() {
  const res = await lmsFetch(`${LMS_API_BASE}/quizzes`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json(); return data.data;
}

export async function fetchQuizTopicSuggestions(query: string) {
  if (!query || query.trim().length < 2) return [];
  const res = await lmsFetch(
    `${LMS_API_BASE}/quizzes/topic-suggestions?q=${encodeURIComponent(query.trim())}`,
    { method: 'GET' }
  );
  if (!res) return [];
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json();
  return Array.isArray(data.data) ? data.data.filter((item: unknown) => typeof item === 'string') : [];
}

export type GeneratedQuizSummary = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes?: number;
  durationMinutes?: number;
  totalQuestions?: number;
  questionsCount?: number;
  topic?: string;
  skill?: string;
  isAiGenerated?: boolean;
};

export async function generateQuizzesFromTopic(topic: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/quizzes/generate`, {
    method: 'POST',
    body: JSON.stringify({ topic: topic.trim() }),
  });
  if (!res) throw new Error('No authentication token found. Please log in again.');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to generate quizzes');
  }
  return data.data as { topic: string; quizzes: GeneratedQuizSummary[] };
}

export async function fetchQuizDetail(quizId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/quizzes/${encodeURIComponent(quizId)}`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Unable to connect right now');
  }
  const data = await res.json();
  return data.data;
}

export async function submitQuizAttempt(
  quizId: string,
  payload: { answerMap: Record<string, number>; timeTakenSeconds: number }
) {
  const res = await lmsFetch(`${LMS_API_BASE}/quizzes/${encodeURIComponent(quizId)}/attempt`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res) throw new Error('No authentication token found. Please log in again.');
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to submit quiz');
  }
  return data.data;
}

export type QuizAttemptBreakdownItem = {
  id: string;
  text: string;
  options: string[];
  chosenIndex?: number;
  correctOptionIndex: number;
  explanation?: string;
  isCorrect: boolean;
};

export type QuizAttemptResult = {
  id: string;
  quizId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  completedAt: string;
  quizTitle: string;
  breakdown: QuizAttemptBreakdownItem[];
};

export async function fetchAttemptResult(quizId: string, attemptId: string) {
  const res = await lmsFetch(
    `${LMS_API_BASE}/quizzes/${encodeURIComponent(quizId)}/result/${encodeURIComponent(attemptId)}`,
    { method: 'GET' }
  );
  if (!res) return null;
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Unable to connect right now');
  }
  const data = await res.json();
  return data.data as QuizAttemptResult;
}

export async function fetchNotes() {
  const res = await lmsFetch(`${LMS_API_BASE}/notes`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json(); return data.data;
}

export async function fetchNoteDetail(noteId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/notes/${noteId}`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Unable to connect right now'); }
  const data = await res.json(); return data.data;
}

export async function createNote(note: { title: string, type: string, body: string, tags?: string[] }) {
  const res = await lmsFetch(`${LMS_API_BASE}/notes`, { method: 'POST', body: JSON.stringify(note) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to create note');
  const data = await res.json(); return data.data;
}

export async function updateNote(noteId: string, note: { title?: string, type?: string, body?: string, tags?: string[] }) {
  const res = await lmsFetch(`${LMS_API_BASE}/notes/${noteId}`, { method: 'PUT', body: JSON.stringify(note) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to update note');
  const data = await res.json(); return data.data;
}

export async function deleteNote(noteId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/notes/${noteId}`, { method: 'DELETE' });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to delete note');
  const data = await res.json(); return data;
}

export async function fetchCareerPath() {
  const res = await lmsFetch(`${LMS_API_BASE}/career-path`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json(); return data.data;
}

export async function updateCareerPath(payload: any) {
  const res = await lmsFetch(`${LMS_API_BASE}/career-path`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to update career path');
  const data = await res.json(); return data.data;
}

export async function setLmsGoal(goal: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/career-path/goal`, { method: 'POST', body: JSON.stringify({ goal }) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to set goal');
  const data = await res.json(); return data.data;
}

export async function startMission() {
  const res = await lmsFetch(`${LMS_API_BASE}/career-path/start`, { method: 'POST' });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to start mission');
  const data = await res.json(); return data.data;
}

export async function fetchGoalRecommendations(query: string) {
  if (!query || query.length < 2) return [];
  const res = await lmsFetch(`${LMS_API_BASE}/career-path/recommend-goal?q=${encodeURIComponent(query)}`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json(); 
  return data.data;
}

export async function fetchResumeDraft() {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/draft`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Unable to connect right now'); }
  const data = await res.json(); return data.data;
}

export type ResumeRoleVersionItem = {
  id: string;
  label: string;
  versionType: string;
  jobId?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  templateId?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  hasResumeHtml?: boolean;
  hasStoredVersion?: boolean;
  resumeHtml?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ResumeVersionsResponse = {
  original: {
    id: string;
    label: string;
    versionType: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
    atsScore?: number;
    uploadedAt?: string;
    updatedAt?: string;
  } | null;
  versions: ResumeRoleVersionItem[];
};

export async function fetchResumeRoleVersions(): Promise<ResumeVersionsResponse | null> {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/versions`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) {
    if (res.status === 404) return { original: null, versions: [] };
    throw new Error('Unable to connect right now');
  }
  const data = await res.json();
  return data.data as ResumeVersionsResponse;
}

export async function fetchResumeRoleVersion(versionId: string): Promise<ResumeRoleVersionItem | null> {
  const id = String(versionId || '').trim();
  if (!id) return null;
  const res = await lmsFetch(`${LMS_API_BASE}/resume/versions/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  if (!res) return null;
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Unable to connect right now');
  }
  const data = await res.json();
  return data.data as ResumeRoleVersionItem;
}

export async function deleteResumeRoleVersion(versionId: string): Promise<void> {
  const id = String(versionId || '').trim();
  if (!id) throw new Error('CV version id is required');

  const res = await lmsFetch(`${LMS_API_BASE}/resume/versions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res) throw new Error('No authentication token found. Please log in again.');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete CV version');
  }
}

export async function updateResumeDraft(payload: any) {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/draft`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res) throw new Error('No authentication token found. Please log in again.');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update resume draft: ${res.status} ${res.statusText}`);
  }
  const data = await res.json(); return data.data;
}

export async function syncResumeToCareerPath() {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/sync-career-path`, { method: 'POST' });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to sync resume to career path');
  const data = await res.json(); return data.data;
}

export async function generateResumeSummary(headline: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/generate-summary`, { method: 'POST', body: JSON.stringify({ headline }) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to generate summary');
  const data = await res.json(); return data.data.summary;
}

export async function tailorResumeSummaryForJob(payload: {
  existingSummary?: string;
  jobTitle: string;
  company: string;
  experienceLevel?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
}) {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/tailor-summary`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res) return null;
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to tailor summary');
  }
  const data = await res.json();
  return data.data.summary as string;
}

export async function analyzeResumeDraft() {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/analyze`, { method: 'POST' });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to analyze resume');
  const data = await res.json(); return data.data;
}

function mapInterviewTopicToCategory(topic?: string): string {
  const normalized = (topic ?? '').toLowerCase();
  if (normalized.includes('backend')) return 'backend';
  if (normalized.includes('system')) return 'system-design';
  if (normalized.includes('behavior') || normalized.includes('hr')) return 'behavioral';
  if (normalized.includes('data structure') || normalized.includes('dsa')) return 'data-structures';
  return 'frontend';
}

export async function fetchInterviewPrep() {
  const res = await lmsFetch(`${LMS_API_BASE}/interview`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error('Unable to connect right now');
  }
  const data = await res.json();
  return data.data?.recentSessions ?? [];
}

export async function startInterviewSession(payload: { type: string; topic?: string; category?: string; questionCount?: number }) {
  const body = {
    category: payload.category ?? mapInterviewTopicToCategory(payload.topic),
    questionCount: payload.questionCount ?? 5,
  };
  const res = await lmsFetch(`${LMS_API_BASE}/interview/mock-session/start`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to start interview session');
  const data = await res.json();
  return data.data;
}

export async function fetchLmsDashboard() {
  const res = await lmsFetch(`${LMS_API_BASE}/dashboard`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) throw new Error('Unable to connect right now');
  const data = await res.json(); return data.data;
}

// ---------------------------------------------------------
// CV EDITOR ENDPOINTS
// ---------------------------------------------------------
export const CV_API_BASE = `${getApiBaseUrl()}/cveditor`;

export async function fetchResumeHtml() {
  const candidateId = typeof window !== 'undefined' ? sessionStorage.getItem('candidateId') : null;
  if (!candidateId) return null;
  
  const res = await lmsFetch(`${CV_API_BASE}/resume/${candidateId}`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Unable to connect right now'); }
  const data = await res.json(); return data.data;
}

export async function saveResumeHtml(resumeHtml: string) {
  const candidateId = typeof window !== 'undefined' ? sessionStorage.getItem('candidateId') : null;
  if (!candidateId) return null;

  const res = await lmsFetch(`${CV_API_BASE}/save`, { 
    method: 'POST', 
    body: JSON.stringify({ candidateId, resume_html: resumeHtml }) 
  });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to save resume HTML');
  const data = await res.json(); return data.data;
}

export async function improveResumeText(text: string) {
  const res = await lmsFetch(`${CV_API_BASE}/ai-improve`, { 
    method: 'POST', 
    body: JSON.stringify({ text }) 
  });
  if (!res) return null;
  if (!res.ok) throw new Error('AI improvement failed');
  const data = await res.json(); return data.data.improvedText;
}

/**
 * Uses LMS OpenAI resume improve endpoint to expand a skill into a shortlist-ready write-up.
 * Falls back to null when auth/AI is unavailable (caller should use local builder).
 */
export async function generateSkillWriteupWithAi(input: {
  promptContent: string;
  targetRole: string;
}): Promise<string | null> {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/ai-improve`, {
    method: 'POST',
    body: JSON.stringify({
      section: 'skills',
      content: input.promptContent,
      targetRole: input.targetRole || 'Professional',
    }),
  });
  if (!res) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || 'AI skill coaching failed');
  }
  const data = await res.json();
  const improved =
    data?.data?.improvedContent ||
    data?.data?.improvedText ||
    data?.data?.content ||
    null;
  return typeof improved === 'string' && improved.trim() ? improved.trim() : null;
}

export { InsufficientTokensError };

export async function exportResumePdf(resumeHtml: string) {
  const candidateId = typeof window !== 'undefined' ? sessionStorage.getItem('candidateId') : null;
  if (!candidateId) return null;

  const headers = getAuthHeaders();
  if (!headers) return null;

  const { normalizeResumeStudioHtml } = await import('@/lib/resumeStudioBrand');
  const normalizedHtml = normalizeResumeStudioHtml(resumeHtml, { ensureWatermark: true });

  let serverError: string | null = null;

  try {
    const res = await fetch(`${CV_API_BASE}/export`, {
      method: 'POST',
      headers: { ...(headers as Record<string, string>) },
      body: JSON.stringify({ candidateId, resume_html: normalizedHtml }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const type = String(blob.type || '').toLowerCase();
      if (!type || type.includes('pdf') || type.includes('octet-stream')) {
        return blob;
      }
      serverError = 'Server did not return a PDF file.';
    } else {
      const raw = await res.text().catch(() => '');
      let errorData: Record<string, unknown> = {};
      try {
        errorData = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        errorData = raw ? { message: raw } : {};
      }
      serverError =
        (typeof errorData.message === 'string' && errorData.message) ||
        (typeof errorData.error === 'string' && errorData.error) ||
        `PDF export failed (${res.status})`;
      console.warn('❌ [PDF Export] Backend returned error:', {
        status: res.status,
        statusText: res.statusText,
        errorData,
      });
    }
  } catch (fetchErr) {
    serverError = fetchErr instanceof Error ? fetchErr.message : 'PDF export request failed';
    console.warn('❌ [PDF Export] Backend request failed:', fetchErr);
  }

  try {
    const { exportResumeHtmlToPdfBlob } = await import('@/lib/resumeStudioExport');
    console.info('[PDF Export] Using client-side PDF fallback');
    return await exportResumeHtmlToPdfBlob(normalizedHtml, 'CV');
  } catch (clientErr) {
    const clientMessage = clientErr instanceof Error ? clientErr.message : 'Client PDF export failed';
    throw new Error(serverError ? `${serverError} ${clientMessage}` : clientMessage);
  }
}
