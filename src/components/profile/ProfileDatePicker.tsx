'use client';

import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatProfileIsoDate, openNativeDatePicker } from '@/lib/profile-date-utils';
import { profileFieldClass } from '@/lib/profile-modal-ui';

export type ProfileDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  /** Shown when empty (default: Select date from calendar) */
  placeholder?: string;
  /** Override label text (e.g. "Present") while keeping value for validation */
  displayValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  min?: string;
  max?: string;
  className?: string;
  'aria-label'?: string;
};

export default function ProfileDatePicker({
  value,
  onChange,
  placeholder = 'Select date from calendar',
  displayValue,
  disabled = false,
  invalid = false,
  min,
  max,
  className = '',
  'aria-label': ariaLabel = 'Open calendar to select date',
}: ProfileDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const hasCustomDisplay = displayValue !== undefined && displayValue !== '';
  const labelText = hasCustomDisplay
    ? displayValue
    : value
      ? formatProfileIsoDate(value)
      : placeholder;
  const showPlaceholder = !hasCustomDisplay && !value;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => openNativeDatePicker(inputRef.current)}
        aria-label={ariaLabel}
        className={`${profileFieldClass(invalid)} flex w-full items-center justify-between gap-2 text-left shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 ${
          disabled ? 'cursor-not-allowed bg-gray-100 opacity-70' : 'hover:border-slate-300'
        }`}
      >
        <span className={showPlaceholder ? 'text-slate-400' : 'text-gray-900'}>{labelText}</span>
        <CalendarDays className="h-5 w-5 shrink-0 text-[#28A8E1]" strokeWidth={2} aria-hidden />
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          onChange(e.target.value);
          e.currentTarget.blur();
        }}
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-hidden
      />
    </div>
  );
}
