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

export function isTextResume(resumeUrl?: string | null): boolean {
  return getResumeExtension(resumeUrl) === 'txt';
}

export function isImageResume(resumeUrl?: string | null): boolean {
  const ext = getResumeExtension(resumeUrl);
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
}

export function canPreviewResumeInline(resumeUrl?: string | null): boolean {
  const href = String(resumeUrl || '').trim();
  if (!href) return false;
  if (getResumeExtension(href) === 'pdf') return true;
  if (getResumeExtension(href) === 'txt') return true;
  if (isImageResume(href)) return true;
  if (/\.pdf(\?|#|$)/i.test(href)) return true;
  // Cloudinary/S3 uploads may omit .pdf in the path but still serve PDF bytes
  if (/cloudinary\.com/i.test(href) && /\/upload\//i.test(href) && !isWordResume(href)) {
    return true;
  }
  if (/amazonaws\.com/i.test(href) && /\.pdf/i.test(href)) return true;
  return false;
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
  if (!base) return '';
  if (isTextResume(base) || isImageResume(base)) {
    const params = new URLSearchParams({ url: base });
    return `/api/document-view?${params.toString()}`;
  }
  return `${base}#toolbar=0`;
}
