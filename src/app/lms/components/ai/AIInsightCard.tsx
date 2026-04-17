import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { LMS_CARD_INTERACTIVE } from '../../constants';

const ctaClassName =
  'mt-1 inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98] cursor-pointer';

export type AIInsightCardProps = {
  icon: LucideIcon;
  title: string;
  recommendation: string;
  scoreOrTag?: string;
  ctaLabel: string;
  /** When set, CTA renders as navigation (valid nested markup). */
  ctaHref?: string;
  onCta?: () => void;
  className?: string;
};

export function AIInsightCard({
  icon: Icon,
  title,
  recommendation,
  scoreOrTag,
  ctaLabel,
  ctaHref,
  onCta,
  className = '',
}: AIInsightCardProps) {
  const isButtonCta = !ctaHref;
  const isDisabled = isButtonCta && !onCta;
  return (
    <div
      className={`${LMS_CARD_INTERACTIVE} border-violet-100 bg-gradient-to-br from-white to-violet-50/40 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 border border-violet-200/80">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            {scoreOrTag ? (
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-violet-800 border border-violet-100 shadow-sm">
                {scoreOrTag}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-normal text-gray-600 leading-relaxed">{recommendation}</p>
          {ctaHref ? (
            <Link href={ctaHref} className={ctaClassName}>
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCta}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              className={`${ctaClassName} ${isDisabled ? 'opacity-60 cursor-not-allowed shadow-none' : ''}`}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
