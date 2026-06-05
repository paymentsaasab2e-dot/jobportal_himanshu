import type { ReactNode } from 'react';
import { PROFILE_DASHBOARD_CARD } from '@/components/profile/layout/profile-layout.constants';

type ProfileWorkspaceRailProps = {
  completionPct: number;
  pendingRows: string[];
  atsDisplay: string | null;
  aiSuggestions: string[];
  promo?: ReactNode;
  onImprove: () => void;
};

export function ProfileWorkspaceRail({
  completionPct,
  pendingRows,
  atsDisplay,
  aiSuggestions,
  promo,
  onImprove,
}: ProfileWorkspaceRailProps) {
  const pct = Math.min(100, Math.max(0, Math.round(Number(completionPct) || 0)));
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <aside className="mx-auto w-full max-w-[248px] space-y-3 lg:mx-0 lg:sticky lg:top-[var(--app-header-height,92px)] lg:w-[248px] lg:max-w-none lg:self-start xl:w-[256px]">
      <div className={`${PROFILE_DASHBOARD_CARD} p-4 sm:p-5`}>
        <p className="profile-page-label">Profile health</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-22 w-22 shrink-0">
            <svg className="-rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#28A8E1"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular-nums text-gray-900">
                {pct}%
              </span>
              <span className="text-[9px] font-medium uppercase text-gray-500">
                done
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            {atsDisplay ? (
              <p className="text-xs text-gray-600">
                ATS{' '}
                <span className="font-semibold text-gray-900">{atsDisplay}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500">ATS — add a resume to score</p>
            )}
            {pendingRows.slice(0, 4).map((row) => (
              <p key={row} className="truncate text-xs text-gray-600">
                · {row}
              </p>
            ))}
          </div>
        </div>

        {aiSuggestions.length > 0 ? (
          <>
            <p className="profile-page-label mt-4 border-t border-gray-100 pt-4">
              Suggestions
            </p>
            <ul className="mt-2 space-y-2">
              {aiSuggestions.slice(0, 3).map((s, i) => (
                <li
                  key={i}
                  className="flex gap-2 rounded-lg px-2.5 py-2 text-xs leading-snug"
                  style={{ backgroundColor: '#FFF9E6', color: '#8B6E4E' }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full opacity-80"
                    style={{ backgroundColor: '#8B6E4E' }}
                    aria-hidden
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <button
          type="button"
          onClick={onImprove}
          className="mt-4 w-full rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-orange-600"
        >
          Improve profile
        </button>
      </div>

      {promo}
    </aside>
  );
}
