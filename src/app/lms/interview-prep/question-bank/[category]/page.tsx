'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Library, Search } from 'lucide-react';
import { LMS_CARD_CLASS } from '@/app/lms/constants';
import { useLmsState } from '@/app/lms/state/LmsStateProvider';
import { useLmsToast } from '@/app/lms/components/ux/LmsToastProvider';
import { generateMockQuestions } from '@/modules/interview-prep/data/mockInterviewData';
import { useState, useMemo, useEffect } from 'react';
import type { MockQuestion } from '@/modules/interview-prep/types/interview.types';

export default function QuestionBankCategoryPage() {
  const router = useRouter();
  const params = useParams() as { category: string };
  const toast = useLmsToast();
  const { addPlannedItem } = useLmsState();

  const categoryDecoded = decodeURIComponent(params.category || '').toLowerCase();
  
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Generate a bulk list of questions tailored to the category name
    const kind = categoryDecoded.includes('hr') ? 'hr' : categoryDecoded.includes('system') ? 'system' : 'technical';
    const set1 = generateMockQuestions(kind);
    const set2 = generateMockQuestions(kind); // Generating twice just to populate the array with more items
    // Reassign IDs to make them unique
    const mapped = [...set1, ...set2].map((q, i) => ({ ...q, id: `qb-${i}-${q.id}` }));
    setQuestions(mapped);
  }, [categoryDecoded]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(item => item.prompt.toLowerCase().includes(q) || item.rubric.toLowerCase().includes(q));
  }, [query, questions]);

  return (
    <div className="space-y-8 pb-8 max-w-5xl mx-auto">
      <div className="min-w-0">
        <Link href="/lms/interview-prep" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to prep
        </Link>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Library className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight capitalize">{categoryDecoded} Question Bank</h1>
            <p className="text-gray-500 mt-1">{questions.length} mock questions found.</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search within category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-gray-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-gray-400"
        />
      </div>

      <div className="space-y-4">
        {filtered.map(q => (
          <div key={q.id} className={`${LMS_CARD_CLASS} space-y-3 transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between gap-4">
              <p className="text-lg font-bold text-gray-900 leading-snug">{q.prompt}</p>
              <span className="shrink-0 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 border border-blue-100 uppercase tracking-widest">
                {q.difficulty}
              </span>
            </div>
            
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 mt-4 space-y-3">
              <div>
                <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Hint</span>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{q.hint}</p>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Rubric</span>
                <p className="text-sm text-gray-600 mt-0.5">{q.rubric}</p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  addPlannedItem({ 
                    id: `ip:qb:${q.id}`, 
                    type: 'topic', 
                    label: `Review: ${q.category} bank`, 
                    href: `/lms/interview-prep/question-bank/${encodeURIComponent(categoryDecoded)}`,
                    sourceModule: 'interview-prep',
                    sourceLabel: 'Question Bank',
                    context: `Reviewing ${q.category} questions to improve depth and performance in technical rounds.`
                  });
                  toast.push({ title: 'Question Saved', message: 'Added to your study plan.', tone: 'success' });
                }}
                className="text-sm font-bold text-[#28A8E1] hover:text-[#208bc0] hover:underline"
              >
                + Add to study plan
              </button>
            </div>
          </div>
        ))}
        {query.trim() && filtered.length === 0 ? (
          <p className="py-12 text-center text-sm font-medium text-gray-500">No matches found for "{query}".</p>
        ) : null}
      </div>
    </div>
  );
}
