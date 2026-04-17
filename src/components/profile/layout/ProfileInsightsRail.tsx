type ProfileInsightsRailProps = {
  percentage: number;
  missingSections: string[];
  cvScore?: number | null;
  aiSuggestions: string[];
  onImprove: () => void;
};

export function ProfileInsightsRail({
  percentage,
  missingSections,
  cvScore,
  aiSuggestions,
  onImprove,
}: ProfileInsightsRailProps) {
  const pct = Math.min(100, Math.max(0, Math.round(Number(percentage) || 0)));
  const displayScore =
    cvScore !== undefined && cvScore !== null && !Number.isNaN(Number(cvScore))
      ? Math.round(Number(cvScore))
      : null;

  const shownMissing = missingSections.slice(0, 6);
  const suggestions = aiSuggestions.slice(0, 5);

  return (
    <aside className="sticky top-6 space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Profile intelligence
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Completeness, ATS, gaps, and AI suggestions in one place.
        </p>
      </div>

      <section className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Profile completeness
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-gray-900">
            {pct}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%`, backgroundColor: '#28A8E1' }}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          ATS score
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-gray-900">
          {displayScore !== null ? `${displayScore}%` : '—'}
        </p>
        {displayScore === null ? (
          <p className="mt-1 text-xs text-gray-500">
            Upload or analyze a resume to see a score.
          </p>
        ) : null}
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Missing sections
        </p>
        {shownMissing.length > 0 ? (
          <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
            {shownMissing.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                <span className="leading-snug">{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">No mandatory gaps right now.</p>
        )}
      </section>

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          AI suggestions
        </p>
        {suggestions.length > 0 ? (
          <ul className="mt-2 space-y-2 text-sm text-gray-700">
            {suggestions.map((line, i) => (
              <li key={i} className="flex gap-2 leading-snug">
                <span className="text-gray-400">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">No suggestions to show.</p>
        )}
      </section>

      <button
        type="button"
        onClick={onImprove}
        className="w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 hover:shadow-md active:scale-[0.99]"
      >
        Improve profile
      </button>
    </aside>
  );
}
