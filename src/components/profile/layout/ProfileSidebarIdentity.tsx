function initials(first?: string, last?: string) {
  const f = first?.trim()?.[0];
  const l = last?.trim()?.[0];
  if (f || l) return `${f ?? ''}${l ?? ''}`.toUpperCase();
  return '?';
}

function formatLocation(city?: string, country?: string) {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  return parts.length ? parts.join(', ') : '';
}

type ProfileSidebarIdentityProps = {
  firstName?: string;
  lastName?: string;
  percentage: number;
  /** Current employment status / title from basic info */
  employment?: string;
  city?: string;
  country?: string;
  /** Primary target role from career preferences */
  targetRole?: string;
  atsScore?: number | null;
};

export function ProfileSidebarIdentity({
  firstName,
  lastName,
  percentage,
  employment,
  city,
  country,
  targetRole,
  atsScore,
}: ProfileSidebarIdentityProps) {
  const pct = Math.min(100, Math.max(0, Math.round(Number(percentage) || 0)));
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') || '';
  const location = formatLocation(city, country);
  const roleLine = targetRole?.trim() || employment?.trim() || '';
  const atsDisplay =
    atsScore !== undefined && atsScore !== null && !Number.isNaN(Number(atsScore))
      ? Math.round(Number(atsScore))
      : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200">
      <div className="flex gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-sm"
          style={{ backgroundColor: '#28A8E1' }}
        >
          {initials(firstName, lastName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {displayName}
          </p>
          {roleLine ? (
            <p className="mt-0.5 truncate text-xs font-medium text-gray-700">
              {roleLine}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-gray-500">Add role in Basic Info or Career Preferences</p>
          )}
          {location ? (
            <p className="mt-1 truncate text-xs text-gray-500">{location}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Profile
        </span>
        <div className="h-2 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: '#28A8E1' }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-gray-800">
          {pct}%
        </span>
        {atsDisplay !== null ? (
          <span
            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-800"
            title="ATS score"
          >
            ATS {atsDisplay}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
