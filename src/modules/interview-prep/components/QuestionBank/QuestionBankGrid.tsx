'use client';

import { QuestionCategoryCard } from './QuestionCategoryCard';
import type { QuestionCategory } from '../../types/interview.types';

type QuestionBankGridProps = {
  categories: QuestionCategory[];
  onOpenCategory?: (title: string) => void;
};

export function QuestionBankGrid({ categories, onOpenCategory }: QuestionBankGridProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Question bank</h2>
        <p className="mt-1 text-sm font-normal text-gray-500">Browse by interview style — counts from mock CMS.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {categories.map((c) => (
          <QuestionCategoryCard
            key={c.title}
            category={c}
            onOpen={() => onOpenCategory?.(c.title)}
          />
        ))}
      </div>
    </section>
  );
}
