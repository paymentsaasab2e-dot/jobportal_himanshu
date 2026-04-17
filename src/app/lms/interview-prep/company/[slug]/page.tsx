'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';
import { LMS_CARD_CLASS } from '@/app/lms/constants';
import { LmsInlineError } from '@/app/lms/components/states/LmsInlineError';
import { mockCompanyResearch } from '@/modules/interview-prep/data/mockInterviewData';
import { useLmsState } from '@/app/lms/state/LmsStateProvider';
import { useLmsToast } from '@/app/lms/components/ux/LmsToastProvider';

export default function CompanyResearchPage() {
  const params = useParams() as { slug: string };
  const toast = useLmsToast();
  const { addPlannedItem } = useLmsState();

  const slug = params.slug?.toLowerCase();
  const company = mockCompanyResearch[slug];

  if (!company) {
    return (
      <div className="space-y-8 pb-8">
        <Link href="/lms/interview-prep" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to prep
        </Link>
        <LmsInlineError
          title="Company research not found"
          message="This company does not have a supported mock research profile yet. Please return to Interview Prep and choose one of the suggested companies."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="min-w-0 flex items-center justify-between">
        <div>
          <Link href="/lms/interview-prep" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to prep
          </Link>
          <div className="mt-4 flex items-center gap-4">
             <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#28A8E1]/10 text-[#28A8E1]">
               <Building2 className="h-8 w-8" />
             </div>
             <div>
               <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{company.name}</h1>
               <p className="text-gray-600 mt-1">{company.overview}</p>
             </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            addPlannedItem({ 
              id: `ip:co:${company.slug}`, 
              type: 'topic', 
              label: `Target: ${company.name}`, 
              href: `/lms/interview-prep/company/${company.slug}`,
              sourceModule: 'interview-prep',
              sourceLabel: 'Company Research'
            });
            toast.push({ title: 'Company Targeted', message: 'Added to study plan.', tone: 'success' });
          }}
          className="shrink-0 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:shadow-sm"
        >
          Target this company
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={LMS_CARD_CLASS}>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Culture & Values</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {company.culture.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
        <div className={LMS_CARD_CLASS}>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Product Themes</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {company.productTopics.map(c => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </div>

      <div className={LMS_CARD_CLASS}>
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Sample Questions</h2>
        <div className="space-y-6">
          {company.sampleQuestions.map(q => (
            <div key={q.id} className="space-y-3">
              <span className="inline-flex rounded-full bg-violet-50 text-violet-800 text-xs font-semibold px-2 py-0.5 border border-violet-100 uppercase tracking-widest">
                {q.category}
              </span>
              <p className="text-lg font-bold text-gray-900">{q.prompt}</p>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700">
                <span className="font-bold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Recommended Angle:</span>
                <p className="mt-1">{q.rubric}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${LMS_CARD_CLASS} border-orange-100 bg-orange-50/20`}>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Revision Tips</h2>
        <ul className="list-disc pl-5 text-gray-800 space-y-1">
          {company.revisionTips.map(t => <li key={t}>{t}</li>)}
        </ul>
      </div>

    </div>
  );
}
