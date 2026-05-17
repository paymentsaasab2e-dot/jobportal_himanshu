/**
 * Basic Information / profile drawer typography (implemented in globals.css
 * under `.profile-modal-typography` and `.profile-page-typography`).
 */
export const PROFILE_TYPOGRAPHY = {
  colors: {
    text: '#111827',
    label: '#64748b',
    muted: '#94a3b8',
    placeholder: '#94a3b8',
    section: '#64748b',
    alert: '#d97706',
    error: '#dc2626',
    success: '#16a34a',
    cancel: '#334155',
    border: '#e2e8f0',
    closeIcon: '#9095a1',
    saveBg: '#f97316',
  },
  drawerTitle: { size: '1.25rem', weight: 600, lineHeight: 1.3 },
  sectionTitle: { size: '0.875rem', weight: 600, lineHeight: 1.35 },
  label: { size: '0.8125rem', weight: 500, lineHeight: 1.4 },
  field: { size: '0.8125rem', weight: 400, lineHeight: 1.4 },
  helper: { size: '0.75rem', weight: 400, lineHeight: 1.45 },
  button: { size: '0.875rem', weight: 500, lineHeight: 1.4 },
  pageSectionTitle: { size: '0.875rem', weight: 600, lineHeight: 1.35 },
  pageLabel: { size: '0.75rem', weight: 500, lineHeight: 1.45 },
  pageValue: { size: '0.8125rem', weight: 500, lineHeight: 1.4 },
  basicInfoLabel: { size: '0.8125rem', weight: 500, lineHeight: 1.4, color: '#64748b' },
  basicInfoValue: { size: '0.8125rem', weight: 400, lineHeight: 1.4, color: '#111827' },
} as const;

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

export const profileHelperClass = 'profile-modal-helper';

export const profileOptionalHintClass = 'profile-modal-helper font-normal inline';

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
export const profileSelectClassName = `${profileFieldClass()} appearance-none bg-white pr-8`;

/** Wrap inputs that have a left icon (date, search, etc.) */
export const profileIconFieldClass = `${profileFieldClass()} profile-modal-field--icon-left`;

export const profileIconFieldWrapClass = 'profile-modal-icon-field';

export const profileCancelBtnClass =
  'profile-modal-btn rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50';

export const profileSaveBtnClass =
  'profile-modal-btn rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50';
