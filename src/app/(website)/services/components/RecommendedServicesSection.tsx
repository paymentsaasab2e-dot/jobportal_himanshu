'use client';

import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { getRecommendedServices } from '../data/services';
import { SVC_SECTION_TITLE, SVC_PRIMARY_BTN } from '../constants';
import ServiceIcon from './ServiceIcon';

const REASON_COLORS: Record<string, string> = {
  'Resume needs improvement': 'bg-rose-50 text-rose-700 border-rose-100',
  'ATS score below target': 'bg-amber-50 text-amber-700 border-amber-100',
  'Skill gap detected': 'bg-violet-50 text-violet-700 border-violet-100',
  'Interview preparation needed': 'bg-blue-50 text-blue-700 border-blue-100',
  'Interview preparation recommended': 'bg-blue-50 text-blue-700 border-blue-100',
  'Upcoming interviews': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export default function RecommendedServicesSection() {
  const router = useRouter();
  const recommended = getRecommendedServices();

  return (
    <section className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" strokeWidth={2} />
          <h2 className={SVC_SECTION_TITLE}>Recommended for You</h2>
        </div>
        <p className="text-gray-500 text-sm mt-1 font-normal">
          Based on your profile and job-readiness analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {recommended.map((service) => (
          <div
            key={service.id}
            className="group relative rounded-2xl bg-white border border-gray-200/80 p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-gray-300/80 hover:-translate-y-0.5 cursor-pointer"
            onClick={() => router.push(`/services/${service.slug}`)}
          >
            {/* Icon + Badge */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#28A8E1]/10 to-[#28A8E1]/5 border border-[#28A8E1]/15">
                <ServiceIcon iconKey={service.iconKey} className="h-6 w-6 text-[#28A8E1]" />
              </div>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border bg-${service.badgeColor}-50 text-${service.badgeColor}-700 border-${service.badgeColor}-200`}
              >
                {service.badge}
              </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">{service.title}</h3>
            <p className="text-sm text-gray-500 font-normal leading-relaxed mb-4 line-clamp-2">
              {service.shortDescription}
            </p>

            {/* Recommendation reason chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {service.recommendationReasons.map((reason) => (
                <span
                  key={reason}
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${REASON_COLORS[reason] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                >
                  {reason}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/services/${service.slug}`);
              }}
              className={SVC_PRIMARY_BTN + ' w-full justify-center'}
            >
              {service.ctaLabel}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
