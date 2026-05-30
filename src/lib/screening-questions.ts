export type ScreeningQuestionType = 'short_text' | 'yes_no' | 'single_choice' | 'slider';

export type ScreeningQuestion = {
  id: string;
  type: ScreeningQuestionType;
  label: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
};

export function isScreeningAnswerFilled(
  question: ScreeningQuestion,
  value: string | number | null | undefined,
): boolean {
  if (question.type === 'slider') {
    return typeof value === 'number' && !Number.isNaN(value);
  }
  if (question.type === 'yes_no') {
    return value === 'yes' || value === 'no';
  }
  if (question.type === 'single_choice') {
    const v = typeof value === 'string' ? value.trim() : '';
    if (!v) return false;
    const opts = (question.options || []).map((o) => String(o).trim()).filter(Boolean);
    return opts.length === 0 || opts.includes(v);
  }
  return typeof value === 'string' && value.trim().length > 0;
}

export function getScreeningValidationError(
  questions: ScreeningQuestion[],
  answers: Record<string, string | number | null>,
): string | null {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!isScreeningAnswerFilled(q, answers[q.id])) {
      const label = q.label?.trim() || `Question ${i + 1}`;
      return `Please answer Q${i + 1}: ${label}`;
    }
  }
  return null;
}

export function isScreeningFormComplete(
  questions: ScreeningQuestion[],
  answers: Record<string, string | number | null>,
): boolean {
  return questions.length > 0 && getScreeningValidationError(questions, answers) === null;
}
