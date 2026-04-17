import { AlertTriangle } from 'lucide-react';
import { LMS_CARD_CLASS } from '../../constants';

type LmsInlineErrorProps = {
  title?: string;
  message: string;
  className?: string;
};

export function LmsInlineError({ title = 'Something went wrong', message, className = '' }: LmsInlineErrorProps) {
  return (
    <div className={`${LMS_CARD_CLASS} border-rose-200 bg-rose-50/30 ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-700 mt-0.5" strokeWidth={2} aria-hidden />
        <div>
          <p className="text-sm font-bold text-rose-900">{title}</p>
          <p className="mt-1 text-sm font-normal text-rose-900/80">{message}</p>
        </div>
      </div>
    </div>
  );
}

