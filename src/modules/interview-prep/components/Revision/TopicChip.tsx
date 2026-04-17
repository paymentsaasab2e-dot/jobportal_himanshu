'use client';

import type { RevisionTopic } from '../../types/interview.types';

const TYPE_STYLES: Record<RevisionTopic['type'], string> = {
  technical: 'border-blue-100 bg-blue-50/60 text-blue-950',
  behavioral: 'border-emerald-100 bg-emerald-50/60 text-emerald-950',
  system: 'border-violet-100 bg-violet-50/60 text-violet-950',
};

type TopicChipProps = {
  topic: RevisionTopic;
  onSelect?: (topic: RevisionTopic) => void;
};

export function TopicChip({ topic, onSelect }: TopicChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(topic)}
      className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] ${TYPE_STYLES[topic.type]}`}
    >
      <span className="block text-[10px] font-bold uppercase tracking-wide opacity-70">{topic.type}</span>
      <span className="mt-1 block leading-snug">{topic.title}</span>
    </button>
  );
}
