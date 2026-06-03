/**
 * Portfolio Links profile UI: hide junk / non-portfolio URLs from display.
 */

function parsePortfolioHost(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;
  let href = raw;
  if (!/^https?:\/\//i.test(href)) {
    href = `https://${href.replace(/^\/+/, '')}`;
  }
  try {
    const u = new URL(href);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Placeholder or malformed hosts (e.g. B.com from resume parsing noise). */
export function isJunkPortfolioUrl(url: string | undefined | null): boolean {
  const raw = (url || '').trim();
  if (!raw) return true;
  if (/^(https?:\/\/)?(www\.)?b\.com\/?$/i.test(raw.replace(/\/+$/, ''))) return true;

  const host = parsePortfolioHost(raw);
  if (!host) return false;

  const blocked = new Set(['b.com', 'b.net', 'b.org', 'b.io', 'b.co']);
  if (blocked.has(host)) return true;

  const parts = host.split('.').filter(Boolean);
  if (parts.length < 2) return true;

  const registrable = parts.length === 2 ? parts[0] : parts[parts.length - 2];
  if (!registrable || registrable.length < 2) return true;
  if (/^[a-z]$/i.test(registrable)) return true;

  return false;
}

/**
 * Hide the generic Gmail sign-in URL only (e.g. https://gmail.com) — not other paths under gmail.com.
 */
export function isPortfolioLinkHiddenFromProfileDisplay(url: string | undefined | null): boolean {
  if (isJunkPortfolioUrl(url)) return true;

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
