'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from "next-intl";

export type MathCaptchaChallenge = {
  a: number;
  b: number;
  operator: '+' | '-';
  answer: number;
  label: string;
};

const INITIAL_CHALLENGE: MathCaptchaChallenge = {
  a: 1,
  b: 1,
  operator: '+',
  answer: 2,
  label: '1 + 1',
};

function buildChallenge(): MathCaptchaChallenge {
  const operator: '+' | '-' = Math.random() < 0.5 ? '+' : '-';
  let a = Math.floor(Math.random() * 9) + 1;
  let b = Math.floor(Math.random() * 9) + 1;
  if (operator === '-' && b > a) {
    [a, b] = [b, a];
  }
  const answer = operator === '+' ? a + b : a - b;
  return {
    a,
    b,
    operator,
    answer,
    label: `${a} ${operator} ${b}`,
  };
}

type MathCaptchaProps = {
  value: string;
  onChange: (value: string) => void;
  onChallengeChange?: (challenge: MathCaptchaChallenge) => void;
  disabled?: boolean;
  error?: string;
  compact?: boolean;
};

export function MathCaptcha({
  value,
  onChange,
  onChallengeChange,
  disabled = false,
  error,
  compact = false,
}: MathCaptchaProps) {
  const t = useTranslations();
  const [challenge, setChallenge] = useState<MathCaptchaChallenge>(INITIAL_CHALLENGE);

  useEffect(() => {
    setChallenge(buildChallenge());
  }, []);

  useEffect(() => {
    onChallengeChange?.(challenge);
  }, [challenge, onChallengeChange]);

  const refresh = useCallback(() => {
    const next = buildChallenge();
    setChallenge(next);
    onChange('');
    onChallengeChange?.(next);
  }, [onChange, onChallengeChange]);

  const isCorrect = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return Number(trimmed) === challenge.answer;
  }, [value, challenge.answer]);

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <label className={`block font-black text-slate-700 uppercase tracking-widest ml-1 ${compact ? "text-[11px]" : "text-[12px]"}`}>
        {t("mathCaptcha.securityCheck")}
      </label>
      <div
        className={`w-full overflow-hidden border bg-white shadow-sm transition-all ${
          compact ? "rounded-[14px]" : "rounded-[16px]"
        } ${
          error
            ? 'border-red-300 ring-4 ring-red-100/60'
            : isCorrect && value.trim()
              ? 'border-emerald-300 ring-4 ring-emerald-100/50'
              : 'border-slate-200 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100/50'
        }`}
      >
        <div className={`flex w-full min-w-0 items-center gap-2 ${compact ? "p-2.5" : "p-3"}`}>
          <div className={`flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 ${compact ? "px-2.5 py-2" : "px-3 py-3"}`}>
            <span className={`font-mono font-black text-slate-800 tracking-tight ${compact ? "text-[16px]" : "text-[18px]"}`}>
              {challenge.label}
            </span>
            <span className={`font-black text-slate-400 ${compact ? "text-[16px]" : "text-[18px]"}`}>=</span>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
              disabled={disabled}
              className={`min-w-[100px] w-full max-w-[168px] flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-center font-black text-slate-900 outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100/50 disabled:opacity-50 ${
                compact ? "h-[44px] text-[16px]" : "h-[52px] text-[18px]"
              }`}
              placeholder="?"
              aria-label={t("mathCaptcha.enterAnswerAria")}
            />
            <button
              type="button"
              onClick={refresh}
              disabled={disabled}
              className={`flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-sky-600 disabled:opacity-50 ${
                compact ? "h-[44px] w-[44px]" : "h-[52px] w-[52px]"
              }`}
            title={t("mathCaptcha.newQuestion")}
            aria-label={t("mathCaptcha.generateNewQuestionAria")}
          >
            <RefreshCw className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </button>
          </div>
        </div>
      </div>
      {error ? (
        <p className="text-[12px] font-bold text-red-600 ml-1">{error}</p>
      ) : (
        <p className={`font-semibold text-slate-400 ml-1 ${compact ? "text-[10px]" : "text-[11px]"}`}>
          {t("mathCaptcha.solveToContinue")}
        </p>
      )}
    </div>
  );
}

export function validateMathCaptchaAnswer(
  challenge: MathCaptchaChallenge,
  userAnswer: string,
): boolean {
  const trimmed = userAnswer.trim();
  if (!trimmed) return false;
  return Number(trimmed) === challenge.answer;
}
