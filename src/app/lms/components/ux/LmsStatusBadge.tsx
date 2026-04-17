type LmsStatusBadgeProps = {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'neutral';
  className?: string;
};

function toneClass(tone: NonNullable<LmsStatusBadgeProps['tone']>) {
  if (tone === 'success') return 'bg-emerald-50 text-emerald-900 border-emerald-100';
  if (tone === 'warning') return 'bg-amber-50 text-amber-900 border-amber-100';
  if (tone === 'info') return 'bg-sky-50 text-sky-900 border-sky-100';
  return 'bg-gray-50 text-gray-800 border-gray-200';
}

export function LmsStatusBadge({ label, tone = 'neutral', className = '' }: LmsStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${toneClass(
        tone
      )} ${className}`}
    >
      {label}
    </span>
  );
}

