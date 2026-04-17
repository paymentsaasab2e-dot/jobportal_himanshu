import Link from 'next/link';
import { Flame, Circle } from 'lucide-react';
import { LMS_CARD_CLASS } from '../constants';
import { lmsDailyMomentum } from '../data/ai-mock';
import { useLmsState } from '../state/LmsStateProvider';

export function LmsDailyMomentum() {
  const { state } = useLmsState();
  const d = state.dashboardData?.dailyFocus || lmsDailyMomentum;
  
  return (
    <div className={`${LMS_CARD_CLASS} !p-4 border-orange-100 bg-gradient-to-br from-orange-50/40 to-white transition-all duration-200 hover:shadow-md h-fit`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
            <Flame className="h-4.5 w-4.5" strokeWidth={2.5} aria-hidden />
          </div>
          <h2 className="text-sm font-bold text-gray-900 leading-tight">{d.title || "Today's focus"}</h2>
        </div>
        
        <ul className="space-y-2.5">
          {d.items.map((item: any) => (
            <li key={item.id} className="flex items-start gap-2 text-[13px] font-medium text-slate-700">
              <Circle
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${item.optional ? 'text-gray-300' : 'text-orange-400'}`}
                strokeWidth={3}
                aria-hidden
              />
              <span className="leading-tight">
                {item.text}
                {item.optional ? (
                  <span className="ml-1 text-[9px] font-bold uppercase tracking-tight text-gray-400">Opt</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-1">
          <Link
            href="/lms/quizzes"
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
          >
            Start now
          </Link>
        </div>
      </div>
    </div>
  );
}
