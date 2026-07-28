'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, Lock, X } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import {
  PROFILE_VIEW_UNLOCK_COST,
  PROFILE_VIEWS_UPDATED_EVENT,
  formatViewAge,
  listProfileViews,
  unlockProfileView,
  type ProfileView,
} from '@/lib/profile-view-store';

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
  onOpenProfile?: (userId: string) => void;
};

export function ProfileViewsPanel({ userId, open, onClose, onOpenProfile }: Props) {
  const [views, setViews] = useState<ProfileView[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setViews(listProfileViews(userId));
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onUp = () => refresh();
    window.addEventListener(PROFILE_VIEWS_UPDATED_EVENT, onUp);
    return () => window.removeEventListener(PROFILE_VIEWS_UPDATED_EVENT, onUp);
  }, [open, refresh]);

  if (!open) return null;

  const handleUnlock = async (viewId: string) => {
    setBusyId(viewId);
    try {
      const result = await unlockProfileView(viewId, userId);
      if (!result.ok) {
        showErrorToast('Unlock', result.error);
        return;
      }
      showSuccessToast(
        'Unlocked',
        result.view.viewerWasAnonymous
          ? `${result.view.viewerDisplayName} (anonymous)`
          : result.view.viewerDisplayName,
      );
      refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[450] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(84dvh,560px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Eye className="h-4 w-4 text-[#0A66C2]" />
              Who viewed you
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Spend {PROFILE_VIEW_UNLOCK_COST} tokens to see each viewer — name and whether they were
              anonymous.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {views.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-slate-500">
              No profile views yet. When someone opens your profile, you’ll get a nudge here.
            </li>
          ) : (
            views.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-slate-50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    v.unlocked
                      ? 'bg-[#1B3A5F] text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {v.unlocked ? (
                    v.viewerDisplayName.slice(0, 1).toUpperCase()
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {v.unlocked ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenProfile?.(v.viewerId)}
                        className="truncate text-left text-sm font-semibold text-slate-900 hover:text-[#0A66C2]"
                      >
                        {v.viewerDisplayName}
                      </button>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            v.viewerWasAnonymous
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-sky-50 text-sky-800'
                          }`}
                        >
                          {v.viewerWasAnonymous ? 'Anonymous' : 'Named'}
                        </span>
                        <span>· {formatViewAge(v.createdAt)}</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-700">Someone</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Viewed your profile · {formatViewAge(v.createdAt)}
                      </p>
                    </>
                  )}
                </div>
                {!v.unlocked ? (
                  <button
                    type="button"
                    disabled={busyId === v.id}
                    onClick={() => void handleUnlock(v.id)}
                    className="shrink-0 rounded-full bg-[#0A66C2] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#004182] disabled:opacity-60"
                  >
                    {busyId === v.id ? '…' : `${PROFILE_VIEW_UNLOCK_COST} tokens`}
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
