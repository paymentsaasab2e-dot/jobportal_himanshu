'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Eye, Lock, X } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
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
  /** Locked row: price only revealed after "View details" */
  const [revealedPriceId, setRevealedPriceId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setViews(listProfileViews(userId));
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    refresh();
    setRevealedPriceId(null);
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
      setRevealedPriceId(null);
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
              <Eye className="h-4 w-4 text-[#28A8E1]" />
              Profile viewers
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              See who viewed your profile. Premium unlock may apply for some viewers.
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
            views.map((v) => {
              const priceRevealed = revealedPriceId === v.id;
              return (
                <li
                  key={v.id}
                  className="rounded-xl px-2.5 py-2.5 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        v.unlocked
                          ? 'bg-[#28A8E1] text-white'
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
                            className="truncate text-left text-sm font-semibold text-slate-900 hover:text-[#28A8E1]"
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
                          <p className="text-sm font-semibold text-slate-800">
                            Someone viewed your profile
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {formatViewAge(v.createdAt)}
                          </p>
                        </>
                      )}
                    </div>
                    {!v.unlocked && !priceRevealed ? (
                      <button
                        type="button"
                        onClick={() => setRevealedPriceId(v.id)}
                        className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#28A8E1] hover:underline"
                      >
                        View details
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {!v.unlocked && priceRevealed ? (
                    <div className="mt-2.5 ml-[3.25rem] rounded-xl border border-[rgba(40,168,225,0.18)] bg-[var(--brand-primary-soft)]/60 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-slate-600">
                        Unlock this viewer to see their name and anonymity status.
                      </p>
                      <button
                        type="button"
                        disabled={busyId === v.id}
                        onClick={() => void handleUnlock(v.id)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#28A8E1] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_8px_16px_rgba(40,168,225,0.22)] hover:bg-[#28A8DF] disabled:opacity-60"
                      >
                        {busyId === v.id ? (
                          '…'
                        ) : (
                          <>
                            Unlock · <TokenCoinIcon className="h-3.5 w-3.5" />{' '}
                            {PROFILE_VIEW_UNLOCK_COST}
                          </>
                        )}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
