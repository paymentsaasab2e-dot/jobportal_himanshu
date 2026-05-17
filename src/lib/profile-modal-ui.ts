/** Shared compact field styles for profile drawers (Basic Information scale). */

export const profileFieldBase =
  'profile-modal-field w-full text-gray-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25';

export const profileFieldOk =
  'border-slate-200 bg-white hover:border-slate-300';

export const profileFieldWarn =
  'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500/25';

export function profileFieldClass(invalid?: boolean) {
  return `${profileFieldBase} ${invalid ? profileFieldWarn : profileFieldOk}`;
}

export const profileTextareaClass =
  'profile-modal-textarea w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25';

export const profileLabelClass = 'profile-modal-label block';

/** View-mode labels/values on /profile — same scale as profile-modal-label & inputs */
export const profileDisplayLabelClass = 'profile-page-label';
export const profileDisplayValueClass = 'profile-page-value';

export const profileSectionTitleClass = 'profile-modal-section-title';

export const profileSectionClass = 'profile-modal-section';

export const profileFormGridClass =
  'profile-modal-form-grid profile-modal-form-grid--split';

export const profileFieldGroupClass = 'profile-modal-field-group';

/** Legacy alias — use profileFieldClass in new code. */
export const profileInputClassName = profileFieldClass();
export const profileSelectClassName = `${profileFieldClass()} appearance-none bg-white`;

export const profileCancelBtnClass =
  'profile-modal-btn rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50';

export const profileSaveBtnClass =
  'profile-modal-btn rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50';
