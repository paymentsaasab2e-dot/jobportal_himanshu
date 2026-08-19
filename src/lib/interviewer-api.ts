'use client';

import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';
import type { InterviewRequestRecord } from '@/lib/interview-request-api';

export interface InterviewerApplicationInput {
  fullName: string;
  currentCompany?: string;
  currentRole: string;
  yearsOfExperience: number;
  expertiseAreas: string[];
  interviewTypes: string[];
  languages: string[];
  weeklyAvailability: string;
  aboutYourself: string;
  feedbackStyle: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  profilePhotoUrl?: string;
  interviewPrice?: number;
}

export interface InterviewerApplicationRecord extends InterviewerApplicationInput {
  id: string;
  candidateId: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  statusLabel: string;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewerProfileRecord extends InterviewerApplicationInput {
  id: string;
  candidateId: string;
  ratingAverage: number;
  totalRatings: number;
  totalInterviews: number;
  status: 'AVAILABLE' | 'BUSY' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface InterviewerQueueItem extends InterviewRequestRecord {
  candidateProfile?: {
    candidateId: string;
    fullName: string;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  candidateResume?: {
    candidateId: string;
    fileUrl?: string | null;
    atsScore?: number | null;
  } | null;
}

export async function submitInterviewerApplication(input: InterviewerApplicationInput) {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/applications`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to submit interviewer application'));
  }
  return payload.data as InterviewerApplicationRecord;
}

export async function updateMyInterviewerApplication(input: InterviewerApplicationInput) {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/applications/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to update interviewer application'));
  }
  return payload.data as {
    application: InterviewerApplicationRecord | null;
    profile: InterviewerProfileRecord | null;
  };
}

export async function getMyInterviewerApplication() {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/applications/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to load interviewer application'));
  }
  return payload.data as {
    application: InterviewerApplicationRecord | null;
    profile: InterviewerProfileRecord | null;
  };
}

export async function getInterviewerQueue() {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/requests/queue`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to load interviewer queue'));
  }
  return (Array.isArray(payload.data) ? payload.data : []) as InterviewerQueueItem[];
}

export async function respondToInterviewRequest(
  requestId: string,
  decision: 'ACCEPT' | 'REJECT',
  proposedSlot?: string,
  preferredDate?: string
) {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/requests/${encodeURIComponent(requestId)}/decision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ decision, proposedSlot, preferredDate }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to submit request decision'));
  }
  return payload.data as InterviewRequestRecord;
}

export async function scheduleInterviewSlot(
  requestId: string,
  slot: string,
  note?: string,
  preferredDate?: string
) {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/requests/${encodeURIComponent(requestId)}/schedule`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ slot, note, preferredDate }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to schedule interview'));
  }
  return payload.data as InterviewRequestRecord;
}

export type MarketplaceInterviewer = {
  candidateId: string;
  fullName: string;
  currentRole?: string | null;
  currentCompany?: string | null;
  yearsOfExperience: number;
  expertiseAreas: string[];
  interviewTypes: string[];
  languages: string[];
  weeklyAvailability?: string;
  aboutYourself?: string;
  feedbackStyle?: string;
  ratingAverage: number;
  totalInterviews?: number;
  interviewPrice: number;
  profilePhotoUrl?: string | null;
  matchingScore?: number;
};

export async function listMarketplaceInterviewers(filters: {
  category?: string;
  interviewType?: string;
  language?: string;
  techStack?: string[];
}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.interviewType) params.set('interviewType', filters.interviewType);
  if (filters.language) params.set('language', filters.language);
  if (filters.techStack?.length) params.set('techStack', filters.techStack.join(','));
  const query = params.toString();
  const paths = [
    `/interviewer/marketplace?${query}`,
    `/lms/interview/marketplace?${query}`,
    `/interviewers/marketplace?${query}`,
    `/lms/interviewer/marketplace?${query}`,
  ];
  let lastMessage = 'Unable to load interviewers';
  for (const path of paths) {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload?.success) {
      return (Array.isArray(payload.data) ? payload.data : []) as MarketplaceInterviewer[];
    }
    lastMessage = String(payload?.message || payload?.error || lastMessage);
    if (response.status !== 404) {
      throw new Error(lastMessage);
    }
  }
  throw new Error(lastMessage);
}

export async function completeInterviewRequest(
  requestId: string,
  input?: { feedback?: string; remarks?: string; rating?: number }
) {
  const response = await fetch(
    `${getApiBaseUrl()}/interviewer/requests/${encodeURIComponent(requestId)}/complete`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input || {}),
    }
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to complete interview'));
  }
  return payload.data as InterviewRequestRecord & { payoutTokens?: number };
}
