'use client';

import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { TOAST_EVENT, inferAlertTone, type ToastPayload, type ToastTone } from './toast';

type ToastItem = Required<Pick<ToastPayload, 'id' | 'title'>> &
  Pick<ToastPayload, 'message' | 'duration'> & {
    tone: ToastTone;
  };

type ToastApi = {
  push: (toast: ToastPayload) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 3400;
const MAX_VISIBLE_TOASTS = 4;

function normalizeTone(tone?: ToastTone): Exclude<ToastTone, 'critical' | 'destructive'> {
  if (tone === 'critical' || tone === 'destructive') return 'error';
  return tone ?? 'success';
}

function iconForTone(tone: Exclude<ToastTone, 'critical' | 'destructive'>) {
  if (tone === 'success') return CheckCircle2;
  if (tone === 'error') return AlertCircle;
  if (tone === 'warning') return AlertTriangle;
  return Info;
}

function toneClasses(tone: Exclude<ToastTone, 'critical' | 'destructive'>) {
  if (tone === 'success') {
    return {
      shell:
        'border-emerald-200/80 bg-emerald-50/95 text-emerald-950 shadow-[0_18px_45px_rgba(16,185,129,0.14)]',
      icon: 'bg-emerald-100 text-emerald-600',
      close: 'text-emerald-700/70 hover:bg-emerald-100 hover:text-emerald-800',
    };
  }

  if (tone === 'error') {
    return {
      shell:
        'border-rose-200/80 bg-rose-50/95 text-rose-950 shadow-[0_18px_45px_rgba(244,63,94,0.16)]',
      icon: 'bg-rose-100 text-rose-600',
      close: 'text-rose-700/70 hover:bg-rose-100 hover:text-rose-800',
    };
  }

  if (tone === 'warning') {
    return {
      shell:
        'border-amber-200/80 bg-amber-50/95 text-amber-950 shadow-[0_18px_45px_rgba(245,158,11,0.14)]',
      icon: 'bg-amber-100 text-amber-600',
      close: 'text-amber-700/70 hover:bg-amber-100 hover:text-amber-800',
    };
  }

  return {
    shell:
      'border-sky-200/80 bg-sky-50/95 text-sky-950 shadow-[0_18px_45px_rgba(14,165,233,0.14)]',
    icon: 'bg-sky-100 text-sky-600',
    close: 'text-sky-700/70 hover:bg-sky-100 hover:text-sky-800',
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const dismissTimersRef = useRef<Map<string, number>>(new Map());
  const dedupeRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback(
    (id: string) => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      const timer = dismissTimersRef.current.get(id);
      if (timer) window.clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    },
    []
  );

  const push = useCallback(
    (toast: ToastPayload) => {
      const title = toast.title.trim();
      if (!title) return;

      const tone = normalizeTone(toast.tone);
      const signature = `${tone}|${title}|${toast.message ?? ''}`;
      const now = Date.now();
      const lastShown = dedupeRef.current.get(signature) ?? 0;

      if (now - lastShown < 900) {
        return;
      }

      dedupeRef.current.set(signature, now);

      const id = toast.id ?? `${now}-${Math.random().toString(16).slice(2)}`;
      const duration = toast.duration ?? DEFAULT_DURATION;
      const nextToast: ToastItem = {
        id,
        title,
        message: toast.message,
        duration,
        tone,
      };

      setToasts((current) => [nextToast, ...current].slice(0, MAX_VISIBLE_TOASTS));

      const timer = window.setTimeout(() => removeToast(id), duration);
      dismissTimersRef.current.set(id, timer);
    },
    [removeToast]
  );

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      if (customEvent.detail) {
        push(customEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT, handleEvent as EventListener);
    return () => window.removeEventListener(TOAST_EVENT, handleEvent as EventListener);
  }, [push]);

  useEffect(() => {
    const originalAlert = window.alert.bind(window);

    window.alert = ((message?: string) => {
      const normalizedMessage = String(message ?? '').trim();
      if (!normalizedMessage) return;

      push({
        title: normalizedMessage,
        tone: inferAlertTone(normalizedMessage),
      });
    }) as typeof window.alert;

    return () => {
      window.alert = originalAlert;
    };
  }, [push]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      dismissTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      dismissTimersRef.current.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, message, duration) => push({ title, message, duration, tone: 'success' }),
      error: (title, message, duration) => push({ title, message, duration, tone: 'error' }),
      warning: (title, message, duration) => push({ title, message, duration, tone: 'warning' }),
      info: (title, message, duration) => push({ title, message, duration, tone: 'info' }),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {isMounted && typeof document !== 'undefined'
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-4 top-4 z-[10000] flex flex-col items-end gap-2 sm:left-auto sm:right-4 sm:w-[360px]">
              <AnimatePresence mode="popLayout">
                {toasts.map((toast) => {
                  const tone = normalizeTone(toast.tone);
                  const Icon = iconForTone(tone);
                  const classes = toneClasses(tone);

                  return (
                    <motion.div
                      key={toast.id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      transition={{ 
                        type: 'spring', 
                        damping: 25, 
                        stiffness: 300 
                      }}
                      className={`pointer-events-auto w-full rounded-2xl border px-4 py-3 backdrop-blur-md ${classes.shell}`}
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-5">{toast.title}</p>
                          {toast.message ? (
                            <p className="mt-1 text-xs font-medium leading-5 opacity-80">{toast.message}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeToast(toast.id)}
                          aria-label="Dismiss notification"
                          className={`rounded-xl p-1.5 transition-colors ${classes.close}`}
                        >
                          <X className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
