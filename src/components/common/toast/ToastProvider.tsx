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
  dismiss: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION = 4200;
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

function toneStyles(tone: Exclude<ToastTone, 'critical' | 'destructive'>) {
  if (tone === 'success') {
    return {
      accent: '#10B981',
      icon: 'bg-emerald-500 text-white',
      title: 'text-slate-900',
      message: 'text-slate-600',
      close: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
      progress: 'bg-emerald-500',
    };
  }

  if (tone === 'error') {
    return {
      accent: '#F43F5E',
      icon: 'bg-rose-500 text-white',
      title: 'text-slate-900',
      message: 'text-slate-600',
      close: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
      progress: 'bg-rose-500',
    };
  }

  if (tone === 'warning') {
    return {
      accent: '#F59E0B',
      icon: 'bg-amber-500 text-white',
      title: 'text-slate-900',
      message: 'text-slate-600',
      close: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
      progress: 'bg-amber-500',
    };
  }

  return {
    accent: '#0EA5E9',
    icon: 'bg-sky-500 text-white',
    title: 'text-slate-900',
    message: 'text-slate-600',
    close: 'text-slate-400 hover:bg-slate-100 hover:text-slate-700',
    progress: 'bg-sky-500',
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const dismissTimersRef = useRef<Map<string, number>>(new Map());
  const dedupeRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = dismissTimersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    dismissTimersRef.current.delete(id);
  }, []);

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
    [removeToast],
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
      dismiss: removeToast,
      success: (title, message, duration) => push({ title, message, duration, tone: 'success' }),
      error: (title, message, duration) => push({ title, message, duration, tone: 'error' }),
      warning: (title, message, duration) => push({ title, message, duration, tone: 'warning' }),
      info: (title, message, duration) => push({ title, message, duration, tone: 'info' }),
    }),
    [push, removeToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {isMounted && typeof document !== 'undefined'
        ? createPortal(
            <div className="pointer-events-none fixed inset-x-3 top-3 z-[11000] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end sm:w-[380px]">
              <AnimatePresence mode="popLayout" initial={false}>
                {toasts.map((toast) => {
                  const tone = normalizeTone(toast.tone);
                  const Icon = iconForTone(tone);
                  const styles = toneStyles(tone);
                  const duration = toast.duration ?? DEFAULT_DURATION;

                  return (
                    <motion.div
                      key={toast.id}
                      layout
                      initial={{ opacity: 0, y: -28, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.96, transition: { duration: 0.18 } }}
                      transition={{
                        layout: { type: 'spring', damping: 28, stiffness: 340 },
                        type: 'spring',
                        damping: 26,
                        stiffness: 340,
                      }}
                      style={{ position: 'relative' }}
                      className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.18)] ring-1 ring-black/5"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="flex items-stretch">
                        <span
                          className="w-1.5 shrink-0"
                          style={{ backgroundColor: styles.accent }}
                          aria-hidden
                        />
                        <div className="flex min-w-0 flex-1 items-start gap-3 px-3.5 py-3.5">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${styles.icon}`}
                          >
                            <Icon className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className={`text-[15px] font-semibold leading-5 ${styles.title}`}>
                              {toast.title}
                            </p>
                            {toast.message ? (
                              <p className={`mt-1 text-sm leading-5 ${styles.message}`}>
                                {toast.message}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Dismiss notification"
                            className={`rounded-lg p-1.5 transition-colors ${styles.close}`}
                          >
                            <X className="h-4 w-4" strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                      <motion.div
                        className={`h-0.5 origin-left ${styles.progress}`}
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: duration / 1000, ease: 'linear' }}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>,
            document.body,
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
