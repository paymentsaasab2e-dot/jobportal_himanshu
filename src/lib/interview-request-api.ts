'use client';

import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';

export const INTERVIEW_CATEGORIES = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'DevOps',
  'Cloud',
  'AI / Machine Learning',
  'Data Science',
  'UI / UX',
  'HR Interview',
  'Behavioral Interview',
  'DSA',
  'System Design',
] as const;

export const TECH_STACK_BY_CATEGORY: Record<string, string[]> = {
  'Frontend Development': ['React', 'Next.js', 'Angular', 'Vue', 'HTML', 'CSS', 'JavaScript', 'TypeScript'],
  'Backend Development': ['Node.js', 'Express', 'NestJS', 'Java', 'Spring Boot', '.NET', 'Python', 'Django', 'Laravel'],
  'Full Stack Development': ['React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'TypeScript'],
  'Mobile Development': ['React Native', 'Flutter', 'Kotlin', 'Swift', 'Android', 'iOS'],
  DevOps: ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform'],
  Cloud: ['AWS', 'Azure', 'GCP', 'Serverless', 'Cloud Security', 'Cloud Architecture'],
  'AI / Machine Learning': ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'MLOps'],
  'Data Science': ['Python', 'R', 'SQL', 'Pandas', 'NumPy', 'Power BI', 'Tableau'],
  'UI / UX': ['Figma', 'Design Systems', 'Wireframing', 'Prototyping', 'User Research'],
  'HR Interview': ['Communication', 'Self Introduction', 'Career Goals', 'Conflict Resolution'],
  'Behavioral Interview': ['STAR Method', 'Leadership', 'Teamwork', 'Problem Solving'],
  DSA: ['Arrays', 'Linked List', 'Trees', 'Graphs', 'Dynamic Programming', 'Greedy'],
  'System Design': ['Scalability', 'Microservices', 'Caching', 'Load Balancing', 'Database Design'],
};

export const INTERVIEW_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const INTERVIEW_EXPERIENCE_OPTIONS = ['0-1 Year', '1-3 Years', '3-5 Years', '5-8 Years', '8+ Years'] as const;
export const INTERVIEW_LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Other'] as const;
export const INTERVIEW_TYPES = ['Technical Interview', 'Coding Interview', 'Mock Interview', 'System Design', 'HR Round', 'Behavioral Round'] as const;
export const INTERVIEW_DURATION_OPTIONS = [30, 45, 60, 90, 120] as const;

export type InterviewRequestStatus =
  | 'PENDING_MATCHING'
  | 'MATCHING'
  | 'MATCHED'
  | 'FINDING_INTERVIEWER'
  | 'WAITING_FOR_ACCEPTANCE'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface InterviewRequestInput {
  targetRole: string;
  companyDomain: string;
  category: string;
  techStack: string[];
  difficulty: string;
  experience: string;
  language: string;
  interviewType: string;
  weakAreas: string;
  mustCoverTopics?: string;
  preferredDate: string;
  preferredTime: string[];
  duration: number;
  notes?: string;
  interviewerId?: string;
}

export interface InterviewRequestRecord extends InterviewRequestInput {
  id: string;
  requestId: string;
  candidateId: string;
  interviewerId?: string | null;
  matchingScore?: number | null;
  matchedAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  interviewerFeedback?: string | null;
  candidateFeedback?: string | null;
  candidateRating?: number | null;
  interviewerRating?: number | null;
  interviewerProfile?: {
    candidateId: string;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    profilePhotoUrl?: string | null;
    currentRole?: string | null;
    yearsOfExperience?: number | null;
    expertiseAreas?: string[];
    interviewTypes?: string[];
    languages?: string[];
    weeklyAvailability?: string | null;
    aboutYourself?: string | null;
    feedbackStyle?: string | null;
    ratingAverage?: number;
    interviewPrice?: number;
  } | null;
  proposedSlot?: string | null;
  proposedDate?: string | null;
  candidateProposedSlot?: string | null;
  candidateProposedDate?: string | null;
  interviewPrice?: number | null;
  paymentHeldAt?: string | null;
  payoutReleasedAt?: string | null;
  status: InterviewRequestStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewRequestSummary {
  pendingRequests: number;
  scheduledInterviews: number;
  completedInterviews: number;
  cancelledInterviews: number;
  total: number;
}

export interface InterviewRequestChatMessage {
  id: string;
  interviewRequestId: string;
  senderCandidateId: string;
  senderRole: 'candidate' | 'interviewer' | string;
  message: string;
  createdAt: string;
}

export type InterviewSuggestionField =
  | 'category'
  | 'techStack'
  | 'targetRole'
  | 'companyDomain'
  | 'mustCoverTopics';

async function postInterviewJson(paths: string[], body: unknown) {
  let lastMessage = 'Unable to submit interview request';
  for (const path of paths) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload?.success) return payload;
    lastMessage = String(payload?.message || payload?.error || lastMessage);
    if (response.status !== 404) {
      throw new Error(lastMessage);
    }
  }
  throw new Error(lastMessage);
}

export async function createInterviewRequest(input: InterviewRequestInput) {
  const payload = await postInterviewJson(
    ['/interview-requests', '/lms/interview/requests', '/interview-request'],
    input
  );
  return payload.data as {
    id: string;
    requestId: string;
    status: InterviewRequestStatus;
    statusLabel: string;
    createdAt: string;
  };
}

export async function getMyInterviewRequests(status?: InterviewRequestStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${getApiBaseUrl()}/interview-requests/my${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to load interview requests'));
  }
  return (Array.isArray(payload.data) ? payload.data : []) as InterviewRequestRecord[];
}

export async function getMyInterviewRequestSummary() {
  const response = await fetch(`${getApiBaseUrl()}/interview-requests/my/summary`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to load interview summary'));
  }
  return payload.data as InterviewRequestSummary;
}

export async function rematchInterviewRequest(requestId: string) {
  const response = await fetch(`${getApiBaseUrl()}/interview-requests/${encodeURIComponent(requestId)}/rematch`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to rematch request'));
  }
  return payload.data as InterviewRequestRecord;
}

export async function candidateScheduleDecision(
  requestId: string,
  decision: 'CONFIRM' | 'REQUEST_NEW_SLOT' | 'PROPOSE_SLOT',
  note?: string,
  slot?: string,
  preferredDate?: string
) {
  const response = await fetch(
    `${getApiBaseUrl()}/interview-requests/${encodeURIComponent(requestId)}/schedule-decision`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, note, slot, preferredDate }),
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (response.status === 402 || payload?.code === 'INSUFFICIENT_TOKENS') {
    const required = Number(payload?.required || payload?.interviewPrice || 0);
    const balance = Number(payload?.balance || 0);
    const err = new Error(
      String(payload?.message || `Need ${required} tokens to confirm (you have ${balance}).`)
    ) as Error & { code?: string; required?: number; balance?: number };
    err.code = 'INSUFFICIENT_TOKENS';
    err.required = required;
    err.balance = balance;
    throw err;
  }
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to update schedule decision'));
  }
  return payload.data as InterviewRequestRecord;
}

export interface InterviewLiveHistoryBundle {
  notes: string;
  messages: Array<{
    id?: string;
    displayName: string;
    role?: string;
    message: string;
    createdAt: string;
  }>;
  request?: {
    id: string;
    requestId: string;
    status: InterviewRequestStatus | string;
    candidateId?: string;
    interviewerId?: string | null;
  };
}

export async function getInterviewLiveHistory(requestId: string) {
  const response = await fetch(`${getApiBaseUrl()}/interview-requests/${encodeURIComponent(requestId)}/live`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to load meeting notes'));
  }
  return {
    notes: String(payload?.data?.notes || ''),
    messages: Array.isArray(payload?.data?.messages) ? payload.data.messages : [],
  } as InterviewLiveHistoryBundle;
}

export async function getInterviewLiveByRoom(roomId: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/interview-requests/live-room/${encodeURIComponent(roomId)}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to load live room history'));
  }
  return {
    notes: String(payload?.data?.notes || ''),
    messages: Array.isArray(payload?.data?.messages) ? payload.data.messages : [],
    request: payload?.data?.request || undefined,
  } as InterviewLiveHistoryBundle;
}

export async function getInterviewRequestChat(requestId: string) {
  const response = await fetch(`${getApiBaseUrl()}/interview-requests/${encodeURIComponent(requestId)}/chat`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to load chat'));
  }
  return (Array.isArray(payload?.data) ? payload.data : []) as InterviewRequestChatMessage[];
}

export async function postInterviewRequestChat(
  requestId: string,
  message: string,
  opts?: { asRole?: 'candidate' | 'interviewer' },
) {
  const response = await fetch(`${getApiBaseUrl()}/interview-requests/${encodeURIComponent(requestId)}/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message,
      ...(opts?.asRole ? { asRole: opts.asRole } : {}),
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to send message'));
  }
  return payload.data as InterviewRequestChatMessage;
}

export async function completeLiveInterview(requestId: string) {
  const urls = [
    `${getApiBaseUrl()}/interview-requests/${encodeURIComponent(requestId)}/complete`,
    `${getApiBaseUrl()}/interview-request/${encodeURIComponent(requestId)}/complete`,
    `${getApiBaseUrl()}/lms/interview-requests/${encodeURIComponent(requestId)}/complete`,
    `${getApiBaseUrl()}/interviewer/requests/${encodeURIComponent(requestId)}/complete`,
  ];
  let lastMessage = 'Unable to complete interview';
  for (const url of urls) {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload?.success) {
      return payload.data as InterviewRequestRecord & { payoutTokens?: number };
    }
    lastMessage = String(payload?.message || lastMessage);
    if (response.status !== 404) {
      throw new Error(lastMessage);
    }
  }
  throw new Error(lastMessage);
}

export async function submitInterviewReview(
  requestId: string,
  input: { rating: number; feedback: string }
) {
  const response = await fetch(
    `${getApiBaseUrl()}/interview-requests/${encodeURIComponent(requestId)}/review`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to submit interview review'));
  }
  return payload.data as InterviewRequestRecord;
}

export async function fetchInterviewSuggestions(params: {
  field: InterviewSuggestionField;
  query: string;
  selectedValues?: string[];
  context?: { category?: string };
}) {
  const response = await fetch(`${getApiBaseUrl()}/ai/interview-suggestions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to fetch suggestions'));
  }
  return Array.isArray(payload?.data?.suggestions)
    ? payload.data.suggestions.filter((item: unknown) => typeof item === 'string')
    : [];
}
