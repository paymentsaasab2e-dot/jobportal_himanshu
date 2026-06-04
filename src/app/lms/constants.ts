/** Shared with Explore Jobs / Applications — peach & blue gradient */
export const LMS_PAGE_BG =
  'linear-gradient(135deg, #e0f2fe 0%, #ecf7fd 12%, #fafbfb 30%, #fdf6f0 55%, #fef5ed 85%, #fef5ed 100%)';

export const LMS_CONTENT_CLASS =
  'mx-auto max-w-[1180px] px-4 sm:px-5 lg:px-6 pt-0 pb-8 sm:pb-10 lg:pb-12 w-full';

/** Page title — matches /profile (1.25rem) */
export const LMS_PAGE_TITLE = 'application-detail-title';

/** Small uppercase label above page title */
export const LMS_PAGE_EYEBROW = 'profile-page-label';

/** Card / block headings — profile section title (0.875rem) */
export const LMS_CARD_TITLE = 'profile-page-section-title';

/** Body copy — profile helper scale */
export const LMS_BODY = 'application-detail-helper';

/** Form controls — profile field text (0.8125rem / medium) */
export const LMS_FIELD_CLASS =
  'rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[0.8125rem] font-medium leading-normal text-gray-900 outline-none focus:border-[#28A8E1] focus:ring-4 focus:ring-[#28A8E1]/15';

export const LMS_INPUT_CLASS = `w-full ${LMS_FIELD_CLASS}`;

export const LMS_SELECT_CLASS = LMS_FIELD_CLASS;

export const LMS_FILTER_CHIP =
  'rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[0.75rem] font-medium text-gray-700 transition-colors hover:bg-gray-50';

export const LMS_FILTER_CHIP_ACTIVE =
  'rounded-full border border-[#28A8E1]/40 bg-[#28A8E1]/10 px-3 py-1.5 text-[0.75rem] font-medium text-gray-900';

/** Primary text link / button on LMS pages */
export const LMS_PRIMARY_LINK_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-[0.8125rem] font-medium text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]';

/** Base card — static panels, premium glassmorphic border */
export const LMS_CARD_CLASS =
  'rounded-2xl bg-white/95 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] p-6 sm:p-7 relative overflow-hidden backdrop-blur-sm';

/** Interactive section cards: hover lift, rich shadow, pointer */
export const LMS_CARD_INTERACTIVE = `${LMS_CARD_CLASS} cursor-pointer transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] hover:border-slate-300 hover:-translate-y-[2px] active:scale-[0.98]`;

/** Section headings — profile scale (0.875rem) */
export const LMS_SECTION_TITLE =
  'profile-page-section-title flex items-center gap-2 relative';

/** Page intro line — profile helper scale */
export const LMS_PAGE_SUBTITLE = 'application-detail-helper max-w-2xl mt-1.5';
