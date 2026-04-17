import type { ReactNode } from 'react';
import Image from 'next/image';

export type ProfileAlert = {
  id: string;
  tone: 'warning' | 'neutral';
  label: string;
};

type ProfileWorkspaceRailProps = {
  identity: {
    initials: string;
    displayName: string;
    photoUrl?: string | null;
    roleLine?: string;
    headline?: string;
    location?: string;
  };
  onEditIdentity: () => void;
  alerts: ProfileAlert[];
  completionPct: number;
  pendingRows: string[];
  atsDisplay: string | null;
  aiSuggestions: string[];
  promo?: ReactNode;
  onImprove: () => void;
};

export function ProfileWorkspaceRail({
  identity,
  onEditIdentity,
  alerts,
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
    <aside className="space-y-3.5 lg:sticky lg:top-[calc(var(--app-header-height,92px)+8px)] lg:self-start">
      {/* Identity */}
      <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
        <div className="flex gap-3">
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: '#28A8E1' }}
          >
            {identity.photoUrl ? (
              <Image
                src={identity.photoUrl}
                alt={`${identity.displayName} profile photo`}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              identity.initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {identity.displayName}
                </p>
                {identity.roleLine ? (
                  <p className="mt-0.5 truncate text-xs text-gray-600">
                    {identity.roleLine}
                  </p>
                ) : null}
                {identity.headline ? (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {identity.headline}
                  </p>
                ) : null}
                {identity.location ? (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {identity.location}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Alerts
          </p>
          <ul className="mt-2 space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`flex gap-2 rounded-lg px-2 py-1.5 text-xs ${
                  a.tone === 'warning'
                    ? 'bg-amber-50 text-amber-900'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                <span>{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Score + pending */}
      <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Profile health
        </p>
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
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Suggestions
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-gray-600">
              {aiSuggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="line-clamp-2">
                  {s}
                </li>
              ))}
            </ul>
          </div>
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
