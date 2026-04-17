// ─── Design tokens & CSS class constants for the Services module ───
// Mirrors the LMS `constants.ts` pattern for consistency.

/** Page background — matches the LMS gradient feel but slightly cooler */
export const SVC_PAGE_BG =
  'linear-gradient(135deg, #e8f4fd 0%, #f0f7fd 12%, #fafbfc 30%, #f8f6fb 55%, #f5f3fa 85%, #f5f3fa 100%)';

/** Content wrapper — centers and constrains width */
export const SVC_CONTENT_CLASS =
  'mx-auto max-w-[1280px] px-5 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 w-full';

/** Base card — static panels */
export const SVC_CARD_CLASS =
  'rounded-2xl bg-white border border-gray-200/80 shadow-sm p-5 sm:p-6';

/** Interactive card — hover lift & shadow */
export const SVC_CARD_INTERACTIVE = `${SVC_CARD_CLASS} cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-gray-300/80 hover:-translate-y-0.5 active:scale-[0.99]`;

/** Section titles */
export const SVC_SECTION_TITLE = 'text-xl sm:text-2xl font-bold text-gray-900 tracking-tight';
export const SVC_SECTION_SUBTITLE = 'text-gray-500 font-normal text-base mt-1';

/** Primary CTA style (button-level) */
export const SVC_PRIMARY_BTN =
  'inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98] cursor-pointer';

/** Secondary CTA style */
export const SVC_SECONDARY_BTN =
  'inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] cursor-pointer';

/** Accent color (same as Header / LMS) */
export const SVC_ACCENT = '#28A8E1';
