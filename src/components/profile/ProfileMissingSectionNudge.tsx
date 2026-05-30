'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import type { ProfileMissingSection } from '@/lib/profile-section-routes';
import { buildProfileMissingSignature } from '@/lib/profile-section-routes';
import { AppLocale, localizePath } from '@/lib/i18n';

const RE_SHOW_AFTER_MS = 30 * 60 * 1000;

type DismissRecord = {
  signature: string;
  dismissedAt: number;
};

type ProfileMissingSectionNudgeProps = {
  locale: AppLocale;
  missingSections: ProfileMissingSection[];
  onNavigate: (href: string) => void;
  storageKeyPrefix?: string;
};

function readDismissRecord(key: string): DismissRecord | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<DismissRecord>;
    if (typeof parsed.signature === 'string' && typeof parsed.dismissedAt === 'number') {
      return { signature: parsed.signature, dismissedAt: parsed.dismissedAt };
    }
  } catch {
    /* legacy plain signature string */
  }

  return { signature: raw, dismissedAt: Date.now() };
}

function isDismissCooldownActive(
  record: DismissRecord | null,
  signature: string,
  now = Date.now(),
): boolean {
  if (!record || record.signature !== signature) return false;
  return now - record.dismissedAt < RE_SHOW_AFTER_MS;
}

export default function ProfileMissingSectionNudge({
  locale,
  missingSections,
  onNavigate,
  storageKeyPrefix = 'profileMissingNudge',
}: ProfileMissingSectionNudgeProps) {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const signature = useMemo(
    () => buildProfileMissingSignature(missingSections),
    [missingSections],
  );

  const dismissKey = `${storageKeyPrefix}:dismissed`;
  const activeSection = missingSections[activeIndex] ?? null;
  const remainingCount = Math.max(0, missingSections.length - activeIndex - 1);

  const syncVisibility = useCallback(() => {
    if (missingSections.length === 0) {
      setVisible(false);
      return;
    }

    const record = readDismissRecord(dismissKey);
    if (isDismissCooldownActive(record, signature)) {
      setVisible(false);
      return;
    }

    setActiveIndex(0);
    setVisible(true);
  }, [dismissKey, missingSections.length, signature]);

  useEffect(() => {
    syncVisibility();

    const record = readDismissRecord(dismissKey);
    if (!record || record.signature !== signature) return;

    const elapsed = Date.now() - record.dismissedAt;
    const remaining = RE_SHOW_AFTER_MS - elapsed;
    if (remaining <= 0) return;

    const timer = window.setTimeout(syncVisibility, remaining + 100);
    return () => window.clearTimeout(timer);
  }, [dismissKey, signature, syncVisibility]);

  if (!visible || !activeSection) return null;

  const handleDismiss = () => {
    const payload: DismissRecord = {
      signature,
      dismissedAt: Date.now(),
    };
    localStorage.setItem(dismissKey, JSON.stringify(payload));
    setVisible(false);
  };

  const handleComplete = () => {
    const href = localizePath(
      `/profile?open=${encodeURIComponent(activeSection.slug)}&tab=${encodeURIComponent(activeSection.tabId)}`,
      locale,
    );
    onNavigate(href);
  };

  const handleNext = () => {
    if (activeIndex < missingSections.length - 1) {
      setActiveIndex((prev) => prev + 1);
      return;
    }
    handleDismiss();
  };

  return (
    <div className="pointer-events-none fixed bottom-5 left-3 z-[120] max-w-[min(272px,calc(100vw-1.5rem))] sm:bottom-6 sm:left-5">
      <div
        className="profile-page-typography candidate-dashboard-page pointer-events-auto animate-in slide-in-from-left-4 fade-in duration-300 rounded-xl border border-amber-200/90 bg-amber-50/95 p-3 shadow-[0_10px_28px_rgba(180,83,9,0.12)] backdrop-blur-sm"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-amber-800">
                Profile alert
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="-mr-0.5 shrink-0 rounded-md p-0.5 text-amber-700/70 transition-colors hover:bg-amber-100 hover:text-amber-900"
                aria-label="Dismiss profile reminder"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-0.5 text-[0.8125rem] font-semibold leading-snug text-amber-950">
              {activeSection.label} is missing
            </p>
            <p className="mt-1 text-[0.75rem] leading-snug text-amber-900/80">
              Add this section to improve your profile strength and job matches.
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 pl-9">
          <button
            type="button"
            onClick={handleComplete}
            className="profile-modal-btn inline-flex flex-1 items-center justify-center gap-0.5 rounded-lg bg-orange-500 px-2.5 py-1.5 text-[0.75rem] font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Complete now
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {remainingCount > 0 ? (
            <button
              type="button"
              onClick={handleNext}
              className="profile-modal-btn shrink-0 rounded-lg border border-amber-300/80 bg-white/80 px-2 py-1.5 text-[0.75rem] font-medium text-amber-900 transition-colors hover:bg-amber-100/60"
            >
              +{remainingCount} more
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
