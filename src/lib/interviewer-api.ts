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
  proposedSlot?: string
) {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/requests/${encodeURIComponent(requestId)}/decision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ decision, proposedSlot }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to submit request decision'));
  }
  return payload.data as InterviewRequestRecord;
}

export async function scheduleInterviewSlot(requestId: string, slot: string, note?: string) {
  const response = await fetch(`${getApiBaseUrl()}/interviewer/requests/${encodeURIComponent(requestId)}/schedule`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ slot, note }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.success) {
    throw new Error(String(payload?.message || 'Unable to schedule interview'));
  }
  return payload.data as InterviewRequestRecord;
}
