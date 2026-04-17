import { LMS_CARD_CLASS } from '../../constants';

export type AIScoreVisual = 'bar' | 'ring';

export type AIScoreCardProps = {
  title: string;
  score: number;
  supportingText: string;
  visual?: AIScoreVisual;
  className?: string;
};

function clampScore(n: number) {
  return Math.min(100, Math.max(0, n));
}

export function AIScoreCard({
  title,
  score,
  supportingText,
  visual = 'bar',
  className = '',
}: AIScoreCardProps) {
  const pct = clampScore(score);
  const r = 36;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - pct / 100);

  return (
    <div
      className={`${LMS_CARD_CLASS} border-violet-50 bg-gradient-to-b from-white to-slate-50/40 transition-all duration-200 hover:shadow-md ${className}`}
    >
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-xs font-normal text-gray-500 leading-relaxed">{supportingText}</p>

      {visual === 'ring' ? (
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 88 88" aria-hidden>
              <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="44"
                cy="44"
                r={r}
                fill="none"
                stroke="#28A8E1"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={dashOffset}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
              {pct}%
            </span>
          </div>
          <p className="text-xs font-medium text-gray-500">Mock score — replace with model output later.</p>
        </div>
      ) : (
        <div className="mt-4">
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden border border-gray-100">
            <div
              className="h-full rounded-full bg-[#28A8E1] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm font-bold text-[#28A8E1]">{pct}%</p>
        </div>
      )}
    </div>
  );
}
