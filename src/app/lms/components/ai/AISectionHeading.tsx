import { Sparkles } from 'lucide-react';
import { LMS_SECTION_TITLE } from '../../constants';

type AISectionHeadingProps = {
  title: string;
  className?: string;
};

/** Consistent “AI-powered” section label across LMS (presentational). */
export function AISectionHeading({ title, className = '' }: AISectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Sparkles className="h-5 w-5 shrink-0 text-violet-600" strokeWidth={2} aria-hidden />
      <h2 className={LMS_SECTION_TITLE}>{title}</h2>
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800">
        AI
      </span>
    </div>
  );
}
