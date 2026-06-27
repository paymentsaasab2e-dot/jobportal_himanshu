function resolvePhase2InterviewFormsBase(): string {
  if (typeof window !== 'undefined') {
    return '/api/proxy/phase2-interview-forms';
  }
  return (
    process.env.PHASE2_INTERVIEW_FORMS_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_PHASE2_API_URL?.replace(/\/$/, '') ||
    'http://localhost:5001/api/v1/interview-applications'
  );
}

function tenantQuery(tenantDbName?: string) {
  // Only pass tenant when we already know it (e.g. from a listed form card).
  // Listing without tenant lets Phase 2 aggregate across all HQ tenant DBs.
  const t = String(tenantDbName || '').trim();
  return t ? `tenantDbName=${encodeURIComponent(t)}` : '';
}

async function phase2InterviewFetch<T>(
  path: string,
  init?: RequestInit,
  tenantDbName?: string,
): Promise<T> {
  const base = resolvePhase2InterviewFormsBase();
  const sep = path.includes('?') ? '&' : '?';
  const tq = tenantQuery(tenantDbName);
  const url = tq ? `${base}${path}${sep}${tq}` : `${base}${path}`;
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...init, headers, cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String(json?.message || `Request failed (${res.status})`));
  }
  return (json?.data ?? json) as T;
}

export type InterviewFormMyApplication = {
  applicationId: string;
  status: string;
  statusLabel: string;
  appliedAt?: string | null;
};

export type PublishedInterviewForm = {
  id: string;
  title: string;
  description?: string | null;
  publicToken: string;
  publishedAt?: string | null;
  tenantDbName?: string | null;
  tenantAgencyName?: string | null;
  myApplication?: InterviewFormMyApplication | null;
};

export type FetchPublishedInterviewFormsOptions = {
  tenantDbName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantPhones?: string[];
  phase1CandidateId?: string;
  applicantFirstName?: string;
  applicantLastName?: string;
};

export type InterviewFormPageData = {
  form: { id: string; title: string; description?: string | null };
  formSchema: { version: number; fields: Array<Record<string, unknown>> };
  tenantDbName?: string | null;
};

export async function fetchPublishedInterviewForms(options?: FetchPublishedInterviewFormsOptions) {
  const params = new URLSearchParams();
  const email = String(options?.applicantEmail || '').trim();
  const phone = String(options?.applicantPhone || '').trim();
  const phones = [...(options?.applicantPhones || []), phone].map((p) => p.trim()).filter(Boolean);
  const uniquePhones = [...new Set(phones)];
  if (email) params.set('applicantEmail', email);
  if (uniquePhones.length) {
    params.set('applicantPhone', uniquePhones.join(','));
    params.set('applicantPhones', uniquePhones.join(','));
  }
  const phase1CandidateId = String(options?.phase1CandidateId || '').trim();
  if (phase1CandidateId) params.set('phase1CandidateId', phase1CandidateId);
  const firstName = String(options?.applicantFirstName || '').trim();
  const lastName = String(options?.applicantLastName || '').trim();
  if (firstName) params.set('applicantFirstName', firstName);
  if (lastName) params.set('applicantLastName', lastName);
  const query = params.toString();
  const path = query ? `/public/forms?${query}` : '/public/forms';
  return phase2InterviewFetch<PublishedInterviewForm[]>(
    path,
    { method: 'GET' },
    options?.tenantDbName,
  );
}

export async function fetchInterviewFormPage(token: string, tenantDbName?: string) {
  return phase2InterviewFetch<InterviewFormPageData>(
    `/public/forms/${encodeURIComponent(token)}`,
    { method: 'GET' },
    tenantDbName,
  );
}

export async function submitInterviewFormApplication(
  token: string,
  payload: { answers: Record<string, unknown>; files: Record<string, File>; phase1CandidateId?: string },
  tenantDbName?: string,
) {
  const formData = new FormData();
  formData.append('answers', JSON.stringify(payload.answers));
  if (payload.phase1CandidateId) {
    formData.append('phase1CandidateId', payload.phase1CandidateId);
  }
  for (const [fieldId, file] of Object.entries(payload.files)) {
    formData.append(fieldId, file);
  }
  return phase2InterviewFetch<{
    applicationId: string;
    status: string;
    message: string;
  }>(
    `/public/forms/${encodeURIComponent(token)}/submit`,
    { method: 'POST', body: formData },
    tenantDbName,
  );
}
