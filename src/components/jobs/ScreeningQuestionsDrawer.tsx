'use client';

import { useMemo, type ReactNode } from 'react';
import ProfileDrawer from '@/components/ui/ProfileDrawer';
import {
  isScreeningFormComplete,
  isScreeningAnswerFilled,
  type ScreeningQuestion,
} from '@/lib/screening-questions';
import {
  profileCancelBtnClass,
  profileFieldClass,
  profileSaveBtnClass,
} from '@/lib/profile-modal-ui';

export type { ScreeningQuestion, ScreeningQuestionType } from '@/lib/screening-questions';

type ScreeningQuestionsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  company: string;
  questions: ScreeningQuestion[];
  answers: Record<string, string | number | null>;
  onAnswerChange: (questionId: string, value: string | number | null) => void;
  onSubmit: () => void;
};

function getProficiencyLabel(value: number) {
  if (value === 0) return 'Beginner';
  if (value <= 25) return 'Basic';
  if (value <= 50) return 'Intermediate';
  if (value <= 75) return 'Advanced';
  return 'Expert';
}

function choiceButtonClass(selected: boolean) {
  return [
    'profile-modal-btn inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-[0.8125rem] font-medium capitalize transition-colors',
    selected
      ? 'border-[#28A8E1] bg-[#28A8E1] text-white shadow-sm'
      : 'border-slate-200 bg-white text-[#111827] hover:border-slate-300 hover:bg-slate-50',
  ].join(' ');
}

function QuestionLabel({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <p className="mb-2 flex flex-wrap items-baseline gap-x-1.5 text-[0.8125rem] font-medium leading-snug text-[#111827]">
      <span className="shrink-0 font-semibold text-[#64748b]">Q{index + 1}</span>
      <span>{children}</span>
      <span className="text-red-500" aria-hidden>
        *
      </span>
    </p>
  );
}

export default function ScreeningQuestionsDrawer({
  isOpen,
  onClose,
  jobTitle,
  company,
  questions,
  answers,
  onAnswerChange,
  onSubmit,
}: ScreeningQuestionsDrawerProps) {
  const allAnswered = useMemo(
    () => isScreeningFormComplete(questions, answers),
    [questions, answers],
  );

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Screening Questions"
      subtitle={[jobTitle, company].filter(Boolean).join(' — ')}
      widthClassName="w-full md:w-[min(520px,92vw)] md:max-w-[520px]"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {!allAnswered && questions.length > 0 ? (
            <p className="text-[0.75rem] text-[#64748b] sm:order-1 sm:max-w-[55%]">
              All questions are required before you can continue.
            </p>
          ) : (
            <span className="hidden sm:block sm:flex-1" />
          )}
          <div className="flex w-full items-center justify-between gap-3 sm:order-2 sm:w-auto sm:shrink-0">
            <button type="button" onClick={onClose} className={profileCancelBtnClass}>
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!allAnswered}
              className={`${profileSaveBtnClass} disabled:cursor-not-allowed disabled:opacity-45`}
            >
              Submit &amp; Continue
            </button>
          </div>
        </div>
      }
    >
      <p className="profile-modal-helper mb-4 text-[#111827]">
        These quick questions help us understand if you are a good fit for the role. Please answer every
        question (Q1–Q{questions.length || 0}).
      </p>

      {questions.length === 0 ? (
        <p className="text-[0.8125rem] italic text-[#64748b]">No screening questions configured.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            const value = answers[question.id];
            const filled = isScreeningAnswerFilled(question, value);

            if (question.type === 'yes_no') {
              return (
                <div key={question.id}>
                  <QuestionLabel index={index}>{question.label}</QuestionLabel>
                  <div className="flex flex-wrap gap-2">
                    {['yes', 'no'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onAnswerChange(question.id, opt)}
                        className={choiceButtonClass(value === opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {!filled ? (
                    <p className="mt-1.5 text-[0.75rem] text-amber-700">Select yes or no</p>
                  ) : null}
                </div>
              );
            }

            if (question.type === 'single_choice') {
              const options = Array.isArray(question.options) ? question.options : [];
              return (
                <div key={question.id}>
                  <QuestionLabel index={index}>{question.label}</QuestionLabel>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {options.map((option, idx) => (
                      <button
                        key={`${question.id}-${idx}`}
                        type="button"
                        onClick={() => onAnswerChange(question.id, option)}
                        className={`${choiceButtonClass(value === option)} normal-case`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {!filled ? (
                    <p className="mt-1.5 text-[0.75rem] text-amber-700">Choose one option</p>
                  ) : null}
                </div>
              );
            }

            if (question.type === 'slider') {
              const min = typeof question.min === 'number' ? question.min : 0;
              const max = typeof question.max === 'number' ? question.max : 100;
              const step = typeof question.step === 'number' && question.step > 0 ? question.step : 1;
              const minLabel = question.minLabel || 'Beginner';
              const maxLabel = question.maxLabel || 'Expert';
              const numericValue =
                typeof value === 'number'
                  ? value
                  : typeof value === 'string'
                    ? Number(value) || min
                    : min;
              const range = max - min || 1;
              const fillPercent = Math.max(0, Math.min(100, ((numericValue - min) / range) * 100));

              return (
                <div key={question.id}>
                  <QuestionLabel index={index}>{question.label}</QuestionLabel>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.75rem] text-[#64748b]">{minLabel}</span>
                      <span className="text-[0.75rem] text-[#64748b]">{maxLabel}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={numericValue}
                      onChange={(e) => onAnswerChange(question.id, Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg accent-[#28A8E1]"
                      style={{
                        background: `linear-gradient(to right, #28A8E1 0%, #28A8E1 ${fillPercent}%, #e2e8f0 ${fillPercent}%, #e2e8f0 100%)`,
                      }}
                    />
                    <p className="text-[0.8125rem] font-medium text-[#111827]">
                      Current selection: {numericValue} ({getProficiencyLabel(fillPercent)})
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={question.id}>
                <QuestionLabel index={index}>{question.label}</QuestionLabel>
                <input
                  type="text"
                  value={typeof value === 'string' ? value : ''}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  placeholder="Type your answer"
                  className={profileFieldClass(!filled)}
                />
                {!filled ? (
                  <p className="mt-1.5 text-[0.75rem] text-amber-700">This field is required</p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </ProfileDrawer>
  );
}
