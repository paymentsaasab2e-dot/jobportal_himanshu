import type { InterviewFormMyApplication, PublishedInterviewForm } from '@/lib/phase2-interview-forms-api';

const STORAGE_KEY = 'ip:interview-form-applications';
const FORMS_CACHE_KEY = 'ip:interview-forms-cache';

function formKey(form: Pick<PublishedInterviewForm, 'id' | 'tenantDbName'>) {
  return `${form.tenantDbName || 'default'}:${form.id}`;
}

export function readLocalInterviewApplications(): Record<string, InterviewFormMyApplication> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, InterviewFormMyApplication>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLocalInterviewApplication(
  form: Pick<PublishedInterviewForm, 'id' | 'tenantDbName'>,
  application: InterviewFormMyApplication,
) {
  if (typeof window === 'undefined') return;
  try {
    const current = readLocalInterviewApplications();
    current[formKey(form)] = application;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore quota errors */
  }
}

export function mergeLocalInterviewApplications(forms: PublishedInterviewForm[]) {
  const local = readLocalInterviewApplications();
  return forms.map((form) => {
    const fromLocal = local[formKey(form)];
    if (form.myApplication) return form;
    if (!fromLocal) return form;
    return { ...form, myApplication: fromLocal };
  });
}

export function readCachedPublishedForms(): PublishedInterviewForm[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FORMS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PublishedInterviewForm[];
    return Array.isArray(parsed) ? mergeLocalInterviewApplications(parsed) : [];
  } catch {
    return [];
  }
}

export function saveCachedPublishedForms(forms: PublishedInterviewForm[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FORMS_CACHE_KEY, JSON.stringify(forms));
  } catch {
    /* ignore quota errors */
  }
}
