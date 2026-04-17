'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '../data/faqs';
import { SVC_SECTION_TITLE } from '../constants';

export default function ServicesFaqPreview() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="space-y-5">
      <div className="text-center">
        <h2 className={SVC_SECTION_TITLE}>Frequently Asked Questions</h2>
        <p className="text-gray-500 text-sm font-normal mt-1">
          Quick answers to common questions about our services
        </p>
      </div>

      <div className="mx-auto max-w-3xl space-y-3">
        {FAQS.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer"
              >
                <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  strokeWidth={2}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-4 pb-4 text-sm text-gray-600 font-normal leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
