'use client';

type TabItem = {
  id: string;
  label: string;
  count?: number;
};

type Props = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
};

/** Compact top tabs — keeps interview layouts short without long scrolling. */
export function InterviewSimpleTabs({ tabs, active, onChange, className = '' }: Props) {
  return (
    <div
      className={`flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selected
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                  selected ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/80 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
