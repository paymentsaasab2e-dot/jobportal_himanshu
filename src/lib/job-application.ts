import { getApiBaseUrl } from '@/lib/api-base';
import type { ScreeningQuestion } from '@/lib/screening-questions';

function buildApiBaseCandidates(primaryBase: string): string[] {
  const bases = new Set<string>();
  const trimmed = String(primaryBase || '').trim().replace(/\/$/, '');
  if (trimmed) bases.add(trimmed);
  const fallback = String(getApiBaseUrl() || '').trim().replace(/\/$/, '');
  if (fallback) bases.add(fallback);
  return Array.from(bases);
}

function parseScreeningQuestion(raw: unknown, fallbackId: string): ScreeningQuestion | null {
  if (!raw) return null;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const label = typeof obj.label === 'string' ? obj.label.trim() : '';
    if (!label) return null;
    const type = (typeof obj.type === 'string' ? obj.type : 'short_text') as ScreeningQuestion['type'];
    const allowed: ScreeningQuestion['type'][] = ['short_text', 'yes_no', 'single_choice', 'slider'];
    return {
      id: typeof obj.id === 'string' && obj.id ? obj.id : fallbackId,
      type: allowed.includes(type) ? type : 'short_text',
      label,
      required: !!obj.required,
      options: Array.isArray(obj.options) ? obj.options.map((o) => String(o)).filter(Boolean) : undefined,
      min: typeof obj.min === 'number' ? obj.min : undefined,
      max: typeof obj.max === 'number' ? obj.max : undefined,
      step: typeof obj.step === 'number' ? obj.step : undefined,
      minLabel: typeof obj.minLabel === 'string' ? obj.minLabel : undefined,
      maxLabel: typeof obj.maxLabel === 'string' ? obj.maxLabel : undefined,
    };
  }
  const text = String(raw).trim();
  if (!text) return null;
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && typeof parsed.label === 'string') {
        return parseScreeningQuestion(parsed, fallbackId);
      }
    } catch {
      /* fall through */
    }
  }
  return { id: fallbackId, type: 'short_text', label: text };
}

export function parseApplicationFormQuestions(raw: unknown): ScreeningQuestion[] {
  if (!Array.isArray(raw)) return [];
  const out: ScreeningQuestion[] = [];
  raw.forEach((entry, idx) => {
    const parsed = parseScreeningQuestion(entry, `q_${idx}`);
    if (parsed) out.push(parsed);
  });
  return out;
}

export async function fetchJobDetailForApplication(
  jobId: string,
  primaryApiBase = getApiBaseUrl(),
): Promise<Record<string, unknown> | null> {
  const id = String(jobId || '').trim();
  if (!id) return null;
  for (const base of buildApiBaseCandidates(primaryApiBase)) {
    try {
      const res = await fetch(`${base}/jobs/${encodeURIComponent(id)}`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: Record<string, unknown>;
      };
      if (json?.success && json?.data && typeof json.data === 'object') {
        return json.data;
      }
    } catch {
      /* try next base */
    }
  }
  return null;
}

export type SubmitJobApplicationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string; alreadyApplied?: boolean; data?: Record<string, unknown> };

export async function submitJobApplication(params: {
  candidateId: string;
  jobId: string;
  screeningAnswers?: Record<string, { label: string; type: string; value: string | number | null }>;
  apiBase?: string;
}): Promise<SubmitJobApplicationResult> {
  const apiBase = String(params.apiBase || getApiBaseUrl()).replace(/\/$/, '');
  const response = await fetch(`${apiBase}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidateId: params.candidateId,
      jobId: params.jobId,
      screeningAnswers: params.screeningAnswers || {},
    }),
  });

  const rawText = await response.text().catch(() => '');
  let result: Record<string, unknown> = {};
  if (rawText) {
    try {
      result = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      result = { message: rawText.slice(0, 200) };
    }
  }

  if (!response.ok) {
    const message =
      typeof result?.message === 'string'
        ? result.message
        : `Failed to submit application (HTTP ${response.status})`;
    const alreadyApplied = message.toLowerCase().includes('already applied');
    return { ok: false, message, alreadyApplied, data: result?.data as Record<string, unknown> | undefined };
  }

  if (result.success) {
    return { ok: true, data: (result.data || {}) as Record<string, unknown> };
  }

  return {
    ok: false,
    message: typeof result.message === 'string' ? result.message : 'Failed to submit application',
  };
}
