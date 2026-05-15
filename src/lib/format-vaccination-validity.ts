const MONTH_LABELS: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
};

/** Display validity month (01–12) + year for profile preview. */
export function formatVaccinationValidity(
  month?: string | null,
  year?: string | null,
): string {
  const m = (month || '').trim();
  const y = (year || '').trim();
  if (!m && !y) return '—';
  const monthLabel = m ? MONTH_LABELS[m] || m : '';
  if (monthLabel && y) return `${monthLabel} ${y}`;
  if (y) return y;
  return monthLabel || '—';
}
