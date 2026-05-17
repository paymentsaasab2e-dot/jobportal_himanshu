export function isResumeHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export function normalizeResumeHref(resumeUrl: string): string {
  const trimmed = String(resumeUrl || '').trim();
  if (!trimmed) return '';
  if (isResumeHttpUrl(trimmed)) {
    return trimmed.replace('/image/upload/', '/raw/upload/');
  }
  return trimmed;
}

export function getResumeExtension(resumeUrl?: string | null): string {
  const cleanUrl = String(resumeUrl || '').split('?')[0].split('#')[0];
  const match = cleanUrl.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() || '';
}

export function isWordResume(resumeUrl?: string | null): boolean {
  const ext = getResumeExtension(resumeUrl);
  return ext === 'docx' || ext === 'doc';
}

export function canPreviewResumeInline(resumeUrl?: string | null): boolean {
  return getResumeExtension(resumeUrl) === 'pdf';
}

export function canPreviewResumeAsHtml(resumeUrl?: string | null): boolean {
  return isWordResume(resumeUrl);
}

export function buildResumeHtmlPreviewUrl(resumeUrl: string): string {
  const base = normalizeResumeHref(resumeUrl.split('#')[0] || resumeUrl);
  const params = new URLSearchParams({ url: base });
  const ext = getResumeExtension(base);
  if (ext) params.set('format', ext);
  return `/api/resume-preview?${params.toString()}`;
}

export function buildResumeViewerUrl(resumeUrl: string): string {
  const base = normalizeResumeHref(resumeUrl.split('#')[0] || resumeUrl);
  return `${base}#toolbar=0`;
}
