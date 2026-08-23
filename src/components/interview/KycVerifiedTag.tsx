'use client';

export function KycVerifiedTag({
  verified,
  className = '',
}: {
  verified?: boolean | null;
  className?: string;
}) {
  if (!verified) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ${className}`}
    >
      KYC verified
    </span>
  );
}
