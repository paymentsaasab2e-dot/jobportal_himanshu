/** Display `YYYY-MM-DD` as DD-MM-YYYY without timezone shift. */
export function formatProfileIsoDate(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ymd || '').trim());
  if (!m) return ymd;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function openNativeDatePicker(input: HTMLInputElement | null | undefined) {
  if (!input || input.disabled) return;
  input.focus();
  if (typeof input.showPicker === 'function') {
    input.showPicker();
  }
}
