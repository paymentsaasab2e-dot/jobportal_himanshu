/** Event to open a profile section drawer immediately (avoids slow deep-link round-trip). */
export const PROFILE_OPEN_SECTION_EVENT = 'saasa:open-profile-section';

/** Fired while any profile editor drawer is open so floating alerts can hide. */
export const PROFILE_EDITOR_OPEN_EVENT = 'saasa:profile-editor-open';

export type ProfileOpenSectionDetail = {
  slug: string;
  tabId?: string | null;
};

export function dispatchOpenProfileSection(slug: string, tabId?: string | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ProfileOpenSectionDetail>(PROFILE_OPEN_SECTION_EVENT, {
      detail: { slug, tabId: tabId || null },
    }),
  );
}

export function dispatchProfileEditorOpen(open: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(PROFILE_EDITOR_OPEN_EVENT, { detail: { open: Boolean(open) } }),
  );
}
