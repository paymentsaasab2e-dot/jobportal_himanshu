'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type LmsCtaVariant = 'primary' | 'secondary' | 'ghost';

type LmsCtaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: LmsCtaVariant;
  loading?: boolean;
  leftIcon?: ReactNode;
};

function variantClass(variant: LmsCtaVariant) {
  if (variant === 'secondary') {
    return 'border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:shadow-sm';
  }
  if (variant === 'ghost') {
    return 'bg-transparent text-gray-900 hover:bg-gray-50';
  }
  return 'bg-[#28A8E1] text-white hover:opacity-95 hover:shadow-md';
}

export function LmsCtaButton({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  leftIcon,
  children,
  ...rest
}: LmsCtaButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-100 ${
        isDisabled ? 'opacity-60 cursor-not-allowed shadow-none' : 'cursor-pointer'
      } ${variantClass(variant)} ${className}`}
      {...rest}
    >
      {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      {loading ? <span className="animate-pulse">Working…</span> : children}
    </button>
  );
}

