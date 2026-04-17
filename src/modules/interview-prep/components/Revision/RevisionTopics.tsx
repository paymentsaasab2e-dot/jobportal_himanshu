'use client';

import { TopicChip } from './TopicChip';
import type { RevisionTopic } from '../../types/interview.types';

type RevisionTopicsProps = {
  topics: RevisionTopic[];
  onAddToPlan: (topicTitle: string | string[]) => void;
};

export function RevisionTopics({ topics, onAddToPlan }: RevisionTopicsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Suggested revision topics</h2>
        <p className="mt-1 text-sm font-normal text-gray-500">
          Chips sync with quiz weak areas and notes (mock). Click a topic to queue it for career plan.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topics.map((t) => (
          <TopicChip key={t.id} topic={t} onSelect={() => onAddToPlan(t.title)} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onAddToPlan(topics.map(t => t.title))}
        className="w-full sm:w-auto rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 px-5 py-3 text-sm font-bold text-violet-900 transition-all duration-200 ease-in-out hover:bg-violet-50 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      >
        Add all to study plan
      </button>
    </section>
  );
}
