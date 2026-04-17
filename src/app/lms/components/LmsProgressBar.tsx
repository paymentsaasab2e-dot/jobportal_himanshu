type LmsProgressBarProps = {
  value: number;
  className?: string;
};

export function LmsProgressBar({ value, className = '' }: LmsProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={`w-full ${className} group`}>
      <div className="h-2.5 w-full rounded-full bg-slate-100/80 overflow-hidden border border-slate-200/60 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#28A8E1] to-[#1e85b4] transition-all duration-[800ms] ease-out shadow-sm"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
