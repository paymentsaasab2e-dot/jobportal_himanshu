/**
 * Display job titles in proper case: first letter of each word capital, rest lowercase.
 * "BUSINESS HEAD" → "Business Head"
 */
export function formatJobTitleDisplay(title: string | null | undefined): string {
  const raw = String(title || '').trim();
  if (!raw) return '';

  return raw.replace(/[^\s]+/g, (token) =>
    token
      .split('-')
      .map((part) => {
        if (!part) return part;
        const lower = part.toLocaleLowerCase();
        return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
      })
      .join('-'),
  );
}
