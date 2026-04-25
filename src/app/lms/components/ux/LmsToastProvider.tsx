'use client';

import { useMemo, type ReactNode } from 'react';
import { useToast } from '@/components/common/toast/ToastProvider';
import type { ToastPayload } from '@/components/common/toast/toast';

export type LmsToast = ToastPayload;

export function LmsToastProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useLmsToast() {
  const toast = useToast();

  return useMemo(() => ({
    push: toast.push,
    dismiss: toast.dismiss,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
  }), [toast.push, toast.dismiss, toast.success, toast.error, toast.warning, toast.info]);
}

