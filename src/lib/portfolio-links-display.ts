/**
 * Portfolio Links profile UI: hide the generic Gmail sign-in URL only
 * (e.g. https://gmail.com) — not other hosts or paths under gmail.com.
 */
export function isPortfolioLinkHiddenFromProfileDisplay(url: string | undefined | null): boolean {
  const raw = (url || '').trim();
  if (!raw) return false;

  let href = raw;
  if (!/^https?:\/\//i.test(href)) {
    href = `https://${href}`;
  }

  try {
    const u = new URL(href);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (host !== 'gmail.com') return false;
    const path = (u.pathname || '/').replace(/\/+$/, '') || '/';
    return path === '/';
  } catch {
    return /^https?:\/\/(www\.)?gmail\.com\/?$/i.test(raw.replace(/\/+$/, ''));
  }
}

export function filterPortfolioLinksForProfileDisplay<T extends { url: string }>(
  links: T[] | undefined,
): T[] {
  if (!links?.length) return [];
  return links.filter((l) => !isPortfolioLinkHiddenFromProfileDisplay(l.url));
}
