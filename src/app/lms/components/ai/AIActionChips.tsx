export type AIActionChipItem = {
  id: string;
  label: string;
};

export type AIActionChipsProps = {
  actions: AIActionChipItem[];
  onAction?: (action: AIActionChipItem) => void;
  className?: string;
};

export function AIActionChips({ actions, onAction, className = '' }: AIActionChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {actions.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={onAction ? () => onAction(a) : undefined}
          disabled={!onAction}
          aria-disabled={!onAction}
          className={`rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-900 shadow-sm transition-all duration-200 active:scale-[0.98] ${
            onAction
              ? 'cursor-pointer hover:bg-violet-50 hover:shadow-md hover:scale-[1.02]'
              : 'cursor-not-allowed opacity-60'
          } focus:outline-none focus:ring-4 focus:ring-blue-100`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
