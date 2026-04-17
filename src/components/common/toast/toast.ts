'use client';

export type ToastTone =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'critical'
  | 'destructive';

export type ToastPayload = {
  id?: string;
  title: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
};

export const TOAST_EVENT = 'saasa:toast';

function dispatchToast(payload: ToastPayload) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function showToast(payload: ToastPayload) {
  dispatchToast(payload);
}

export function showSuccessToast(title: string, message?: string, duration?: number) {
  dispatchToast({ title, message, duration, tone: 'success' });
}

export function showErrorToast(title: string, message?: string, duration?: number) {
  dispatchToast({ title, message, duration, tone: 'error' });
}

export function showWarningToast(title: string, message?: string, duration?: number) {
  dispatchToast({ title, message, duration, tone: 'warning' });
}

export function showInfoToast(title: string, message?: string, duration?: number) {
  dispatchToast({ title, message, duration, tone: 'info' });
}

export function inferAlertTone(message: string): Exclude<ToastTone, 'critical' | 'destructive'> {
  const normalized = message.trim().toLowerCase();

  if (
    /(saved|updated|uploaded|replaced|submitted|confirmed|completed|created|deleted|removed|applied|bookmarked|requested|sent|verified|exported|downloaded|registered|rescheduled)/.test(
      normalized
    ) &&
    !/(failed|error|invalid|unable|missing|not found|cannot|could not|warning|please)/.test(normalized)
  ) {
    return 'success';
  }

  if (/(failed|error|unable|not found|missing|denied|invalid|could not|network)/.test(normalized)) {
    return 'error';
  }

  if (/(warning|please|required|already|unavailable|locked)/.test(normalized)) {
    return 'warning';
  }

  return 'info';
}
