'use client';

import type { QuestionCategory } from '../../types/interview.types';

type QuestionCategoryCardProps = {
  category: QuestionCategory;
  onOpen?: () => void;
};

export function QuestionCategoryCard({ category, onOpen }: QuestionCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 text-left shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900">{category.title}</h3>
        <span className="rounded-full bg-[#28A8E1]/10 px-2.5 py-0.5 text-xs font-bold text-[#28A8E1]">
          {category.count}
        </span>
      </div>
      <p className="mt-2 text-sm font-normal text-gray-500 leading-relaxed">{category.description}</p>
      <span className="mt-4 inline-block text-sm font-bold text-[#28A8E1] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        Open bank →
      </span>
    </button>
  );
}
