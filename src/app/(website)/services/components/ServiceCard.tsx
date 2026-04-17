'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import type { ServiceDefinition } from '../data/services';
import { SVC_PRIMARY_BTN } from '../constants';
import ServiceIcon from './ServiceIcon';

const BADGE_STYLES: Record<string, string> = {
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
};

interface ServiceCardProps {
  service: ServiceDefinition;
  onRequestService?: (service: ServiceDefinition) => void;
}

export default function ServiceCard({ service, onRequestService }: ServiceCardProps) {
  const router = useRouter();
  const badgeStyle = BADGE_STYLES[service.badgeColor] || BADGE_STYLES.blue;

  return (
    <div className="group flex flex-col rounded-2xl bg-white border border-gray-200/80 p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-gray-300/80 hover:-translate-y-0.5">
      {/* Top: Icon + Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#28A8E1]/10 to-[#28A8E1]/5 border border-[#28A8E1]/15 transition-colors duration-200 group-hover:from-[#28A8E1]/15 group-hover:to-[#28A8E1]/10">
          <ServiceIcon iconKey={service.iconKey} className="h-5 w-5 text-[#28A8E1]" />
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${badgeStyle}`}
        >
          {service.badge}
        </span>
      </div>

      {/* Title + Subtitle */}
      <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">{service.title}</h3>
      <p className="text-sm text-gray-500 font-normal leading-relaxed mb-4 line-clamp-2">
        {service.subtitle}
      </p>

      {/* Preview deliverables */}
      <ul className="space-y-2 mb-5 flex-1">
        {service.previewDeliverables.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="font-normal">{item}</span>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        <button
          type="button"
          onClick={() => onRequestService?.(service)}
          className={SVC_PRIMARY_BTN + ' w-full justify-center'}
        >
          {service.ctaLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/services/${service.slug}`)}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
