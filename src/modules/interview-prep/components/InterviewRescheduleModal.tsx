'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  open: boolean;
  title?: string;
  subtitle?: string;
  initialDate?: string;
  initialTime?: string;
  submitting?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (input: { date: string; time: string }) => void | Promise<void>;
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function todayParts() {
  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseDateParts(value?: string | Date | null) {
  const today = todayParts();
  const fallback = { ...today };
  const apply = (year: number, month: number, day: number) => {
    if (!isValidBookingParts(year, month, day)) return fallback;
    return { year, month, day };
  };

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return apply(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  const raw = String(value || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return apply(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return apply(Number(slash[3]), Number(slash[1]), Number(slash[2]));

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return apply(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

function isValidBookingParts(year: number, month: number, day: number) {
  const today = todayParts();
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < today.year || year > today.year + 1) return false;
  if (month < 1 || month > 12) return false;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return false;
  const key = toDateKey(year, month, day);
  const todayKey = toDateKey(today.year, today.month, today.day);
  const max = new Date(today.year, today.month - 1, today.day);
  max.setFullYear(max.getFullYear() + 1);
  const maxKey = toDateKey(max.getFullYear(), max.getMonth() + 1, max.getDate());
  return key >= todayKey && key <= maxKey;
}

function toTimeInputValue(value?: string) {
  const raw = String(value || '').trim();
  const match24 = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (match24) {
    const hour = Number(match24[1]);
    const minute = Number(match24[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${pad(hour)}:${pad(minute)}`;
    }
  }
  const match12 = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(raw);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = Number(match12[2]);
    const period = match12[3].toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${pad(hour)}:${pad(minute)}`;
    }
  }
  return '10:00';
}

function validateSlot(year: number, month: number, day: number, time: string) {
  if (!isValidBookingParts(year, month, day)) {
    return 'Pick a valid date from today through the next 12 months. Past years like 2001 or 2021 are not allowed.';
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return 'Pick a valid interview time.';
  }
  return '';
}

export function InterviewRescheduleModal({
  open,
  title = 'Propose a new slot',
  subtitle = 'Pick a date and time. The other person will confirm to continue.',
  initialDate,
  initialTime,
  submitting = false,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [year, setYear] = useState(() => parseDateParts(initialDate).year);
  const [month, setMonth] = useState(() => parseDateParts(initialDate).month);
  const [day, setDay] = useState(() => parseDateParts(initialDate).day);
  const [time, setTime] = useState(() => toTimeInputValue(initialTime));
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    const parts = parseDateParts(initialDate);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
    setTime(toTimeInputValue(initialTime));
    setLocalError('');
  }, [initialDate, initialTime, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, submitting]);

  const today = todayParts();
  const yearOptions = [today.year, today.year + 1];
  const maxDay = daysInMonth(year, month);
  const dayOptions = useMemo(() => Array.from({ length: maxDay }, (_, index) => index + 1), [maxDay]);

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
    if (year === today.year && month < today.month) setMonth(today.month);
    if (year === today.year && month === today.month && day < today.day) setDay(today.day);
  }, [day, maxDay, month, today.day, today.month, today.year, year]);

  if (!open || typeof document === 'undefined') return null;

  const handleSend = () => {
    const message = validateSlot(year, month, day, time);
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError('');
    void onSubmit({ date: toDateKey(year, month, day), time });
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return createPortal(
    <div className="fixed inset-0 z-[4000]">
      <button
        type="button"
        aria-label="Close propose slot dialog"
        className="absolute inset-0 bg-slate-900/55"
        disabled={submitting}
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 pointer-events-none">
        <form
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          onClick={(event) => event.stopPropagation()}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!submitting) handleSend();
          }}
        >
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          <div className="relative z-20 mt-4 flex justify-end gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!submitting) onClose();
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send new slot'}
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</p>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <label className="block text-[11px] font-medium text-slate-500">
                  Month
                  <select
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
                  >
                    {monthNames.map((name, index) => {
                      const monthValue = index + 1;
                      const disabled = year === today.year && monthValue < today.month;
                      return (
                        <option key={name} value={monthValue} disabled={disabled}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-slate-500">
                  Day
                  <select
                    value={Math.min(day, maxDay)}
                    onChange={(event) => setDay(Number(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
                  >
                    {dayOptions.map((value) => {
                      const disabled = year === today.year && month === today.month && value < today.day;
                      return (
                        <option key={value} value={value} disabled={disabled}>
                          {value}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-slate-500">
                  Year
                  <select
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
                  >
                    {yearOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Time
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400"
              />
            </label>
          </div>
          {localError || error ? (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {localError || error}
            </p>
          ) : null}
        </form>
      </div>
    </div>,
    document.body
  );
}
