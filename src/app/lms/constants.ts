/** Matches Applications page background but polished for premium learning environments */
export const LMS_PAGE_BG =
  'radial-gradient(circle at top left, rgba(40,168,225,0.13), transparent 28%), radial-gradient(circle at 85% 12%, rgba(40,168,223,0.1), transparent 16%), radial-gradient(circle at 18% 82%, rgba(252,150,32,0.08), transparent 18%), linear-gradient(180deg, #f5fafd 0%, #f8fcff 44%, #fcfdff 100%)';

export const LMS_CONTENT_CLASS =
  'mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-10 pt-0 pb-8 sm:pb-10 lg:pb-12 w-full';

/** Base card — static panels, premium glassmorphic border */
export const LMS_CARD_CLASS =
  'rounded-2xl bg-white/95 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-7 relative overflow-hidden backdrop-blur-sm';

/** Interactive section cards: hover lift, rich shadow, pointer */
export const LMS_CARD_INTERACTIVE = `${LMS_CARD_CLASS} cursor-pointer transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-slate-300 hover:-translate-y-[2px] active:scale-[0.98]`;

export const LMS_SECTION_TITLE = 'text-[1.15rem] font-bold text-slate-900 tracking-tight flex items-center gap-2 relative';
export const LMS_PAGE_SUBTITLE = 'text-slate-500 font-medium text-[1.05rem] leading-relaxed max-w-2xl mt-1.5';
