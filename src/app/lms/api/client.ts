import { getApiBaseUrl } from '@/lib/api-base';

export const LMS_API_BASE = `${getApiBaseUrl()}/lms`;

function getAuthHeaders(): HeadersInit | null {
  if (typeof window === 'undefined') return null;
  
  const token = sessionStorage.getItem('token');
  if (!token || token === 'undefined' || token === 'null') return null;

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function lmsFetch(url: string, options: RequestInit = {}) {
  const headers = getAuthHeaders();
  if (!headers) {
    console.warn(`LMS Client: Skipping fetch to ${url} due to missing token.`);
    return null;
  }
  console.log(`[LMS FETCH] ${url}`, options);

  const res = await fetch(url, { 
    ...options, 
    headers: { ...(headers as any), ...(options.headers || {}) } 
  });
  
  if (res.status === 401) {
    console.error('LMS Client: Session expired (401).');
  }
  
  return res;
}

export async function fetchCourses(filters?: Record<string, string>) {
  const query = new URLSearchParams(filters).toString();
  const res = await lmsFetch(`${LMS_API_BASE}/courses${query ? `?${query}` : ''}`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Failed to fetch courses');
  const data = await res.json(); return data.data;
}

export async function fetchCourseDetail(courseId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/courses/${courseId}`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Failed to fetch course details'); }
  const data = await res.json(); return data.data;
}

export async function toggleSaveCourse(courseId: string, saved: boolean) {
  const res = await lmsFetch(`${LMS_API_BASE}/courses/save`, { method: 'POST', body: JSON.stringify({ courseId, saved }) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to toggle save state');
  const data = await res.json(); return data.data;
}

export async function fetchEvents(filters?: Record<string, string>) {
  const query = new URLSearchParams(filters).toString();
  const res = await lmsFetch(`${LMS_API_BASE}/events${query ? `?${query}` : ''}`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json(); return data.data;
}

export async function registerForEvent(eventId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/events/register`, { method: 'POST', body: JSON.stringify({ eventId }) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to register');
  const data = await res.json(); return data.data;
}

export async function unregisterFromEvent(eventId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/events/unregister`, { method: 'POST', body: JSON.stringify({ eventId }) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to unregister');
  const data = await res.json(); return data.data;
}

export async function fetchQuizzes() {
  const res = await lmsFetch(`${LMS_API_BASE}/quizzes`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Failed to fetch quizzes');
  const data = await res.json(); return data.data;
}

export async function fetchNotes() {
  const res = await lmsFetch(`${LMS_API_BASE}/notes`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Failed to fetch notes');
  const data = await res.json(); return data.data;
}

export async function fetchNoteDetail(noteId: string) {
  const res = await lmsFetch(`${LMS_API_BASE}/notes/${noteId}`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Failed to fetch note'); }
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
  if (!res.ok) throw new Error('Failed to fetch career path');
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
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  const data = await res.json(); 
  return data.data;
}

export async function fetchResumeDraft() {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/draft`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Failed to fetch resume draft'); }
  const data = await res.json(); return data.data;
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

export async function analyzeResumeDraft() {
  const res = await lmsFetch(`${LMS_API_BASE}/resume/analyze`, { method: 'POST' });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to analyze resume');
  const data = await res.json(); return data.data;
}

export async function fetchInterviewPrep() {
  const res = await lmsFetch(`${LMS_API_BASE}/interview-prep`, { method: 'GET' });
  if (!res) return [];
  if (!res.ok) throw new Error('Failed to fetch interview prep sessions');
  const data = await res.json(); return data.data;
}

export async function startInterviewSession(payload: { type: string, topic?: string }) {
  const res = await lmsFetch(`${LMS_API_BASE}/interview-prep/start`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to start interview session');
  const data = await res.json(); return data.data;
}

export async function fetchLmsDashboard() {
  const res = await lmsFetch(`${LMS_API_BASE}/dashboard`, { method: 'GET' });
  if (!res) return null;
  if (!res.ok) throw new Error('Failed to fetch lms dashboard');
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
  if (!res.ok) { if (res.status === 404) return null; throw new Error('Failed to fetch resume HTML'); }
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

export async function exportResumePdf(resumeHtml: string) {
  const candidateId = typeof window !== 'undefined' ? sessionStorage.getItem('candidateId') : null;
  if (!candidateId) return null;

  const headers = getAuthHeaders();
  if (!headers) return null;

  const res = await fetch(`${CV_API_BASE}/export`, {
    method: 'POST',
    headers: { ...(headers as any) },
    body: JSON.stringify({ candidateId, resume_html: resumeHtml })
  });

  if (!res.ok) throw new Error('Failed to export PDF');
  return await res.blob();
}
