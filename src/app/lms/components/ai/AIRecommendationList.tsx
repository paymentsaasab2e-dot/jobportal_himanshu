import { LMS_CARD_CLASS } from '../../constants';
import Link from 'next/link';

export type AIRecommendationItem = {
  id: string;
  label: string;
  text: string;
  ctaLabel: string;
  ctaHref?: string;
};

export type AIRecommendationListProps = {
  sectionTitle: string;
  items: AIRecommendationItem[];
  onCta?: (item: AIRecommendationItem) => void;
  className?: string;
};

export function AIRecommendationList({ sectionTitle, items, onCta, className = '' }: AIRecommendationListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-base font-bold text-gray-900">{sectionTitle}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`${LMS_CARD_CLASS} py-4 transition-all duration-200 hover:shadow-md border-violet-50/80`}
          >
            <p className="text-sm font-bold text-gray-900">{item.label}</p>
            <p className="mt-1 text-sm font-normal text-gray-500 leading-relaxed">{item.text}</p>
            {item.ctaHref ? (
              <Link
                href={item.ctaHref}
                className="mt-3 inline-block text-sm font-semibold text-[#28A8E1] transition-colors duration-200 hover:underline cursor-pointer"
              >
                {item.ctaLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onCta ? () => onCta(item) : undefined}
                disabled={!onCta}
                aria-disabled={!onCta}
                className={`mt-3 text-sm font-semibold text-[#28A8E1] transition-colors duration-200 ${
                  onCta ? 'hover:underline cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {item.ctaLabel}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
