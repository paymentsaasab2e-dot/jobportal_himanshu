/** ISO `YYYY-MM-DD` → display `DD/MM/YYYY`. Returns input unchanged if already slash-formatted. */
export function formatDobDisplay(value: string | undefined | null): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return raw;
}
