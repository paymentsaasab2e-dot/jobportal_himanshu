'use client';

import { MousePointerClick, FileInput, Headset, LayoutList } from 'lucide-react';
import { SVC_SECTION_TITLE } from '../constants';

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Choose a service',
    description: 'Browse and select the service that matches your current career need.',
    color: 'text-[#28A8E1]',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: FileInput,
    title: 'Submit your details',
    description: 'Provide the required information like your resume, target role, or skills.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
  },
  {
    icon: Headset,
    title: 'Receive personalized support',
    description: 'Get AI-powered analysis or expert guidance tailored to your profile.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: LayoutList,
    title: 'Track from My Services',
    description: 'Monitor progress, view results, and take action from your dashboard.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
];

export default function ServicesHowItWorks() {
  return (
    <section className="space-y-6">
      <div className="text-center">
        <h2 className={SVC_SECTION_TITLE}>How It Works</h2>
        <p className="text-gray-500 text-sm font-normal mt-1">
          Get started in 4 simple steps
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center text-center p-5">
            {/* Step number */}
            <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
              {i + 1}
            </div>

            {/* Connector line (hidden on last + mobile) */}
            {i < STEPS.length - 1 && (
              <div className="hidden lg:block absolute top-10 left-[calc(50%+32px)] w-[calc(100%-64px)] h-px bg-gray-200" />
            )}

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg} ${step.border} border mb-4`}
            >
              <step.icon className={`h-6 w-6 ${step.color}`} strokeWidth={2} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-xs text-gray-500 font-normal leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
