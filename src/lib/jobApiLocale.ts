import type { AppLocale } from '@/lib/i18n';

/** Append locale for candidate-facing job APIs (display translation; DB source unchanged). */
export function withJobApiLocale(url: string, locale: AppLocale): string {
  if (locale !== 'fr') return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}locale=fr`;
}
