'use client';

import type { LucideIcon } from 'lucide-react';
import { Wand2 } from 'lucide-react';

type QuestionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  onGenerate: () => void;
};

export function QuestionCard({ title, description, icon: Icon, onGenerate }: QuestionCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5 cursor-default">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 ring-1 ring-violet-100 transition-transform duration-200 ease-in-out group-hover:scale-105">
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm font-normal text-gray-500 leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={onGenerate}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#28A8E1] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      >
        <Wand2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        Generate set
      </button>
    </div>
  );
}
