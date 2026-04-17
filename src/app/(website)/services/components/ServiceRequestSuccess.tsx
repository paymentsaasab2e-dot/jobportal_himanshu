'use client';

import { X, CheckCircle2 } from 'lucide-react';
import type { ServiceDefinition } from '../data/services';
import { SVC_PRIMARY_BTN } from '../constants';

interface ServiceRequestSuccessProps {
  service: ServiceDefinition;
  onClose: () => void;
  onGoToMyServices: () => void;
}

export default function ServiceRequestSuccess({ 
  service, 
  onClose, 
  onGoToMyServices 
}: ServiceRequestSuccessProps) {
  return (
    <div className="flex flex-col items-center text-center py-6 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-5 relative">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-50 animate-ping opacity-20" />
        <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
      
      <p className="text-sm text-gray-500 font-normal mb-8 max-w-[280px]">
        We've successfully received your request for <strong>{service.title}</strong>.
      </p>

      <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5 mb-8 w-full text-left">
        <h3 className="text-sm font-bold text-gray-900 mb-2">What happens next?</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-2.5 text-sm text-gray-600">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">1</span>
            Our team will review your submitted details.
          </li>
          <li className="flex items-start gap-2.5 text-sm text-gray-600">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">2</span>
            You'll receive an email notification when processing begins.
          </li>
          <li className="flex items-start gap-2.5 text-sm text-gray-600">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">3</span>
            Track progress anytime from your dashboard.
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row w-full gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Explore More Services
        </button>
        <button
          onClick={onGoToMyServices}
          className={SVC_PRIMARY_BTN + " flex-1"}
        >
          Go to My Services
        </button>
      </div>
    </div>
  );
}
