import { getApiBaseUrl } from '@/lib/api-base';

export const PROFILE_PHOTO_UPDATED_EVENT = 'saasa:profile-photo-updated';

export type ProfilePhotoUpdatedDetail = {
  profilePhotoUrl: string | null;
};

/** Resolve API-relative or absolute profile photo paths for <Image src>. */
export function resolveProfilePhotoUrl(
  photoUrl: string | null | undefined,
  apiBaseUrl: string = getApiBaseUrl()
): string | null {
  if (!photoUrl || !photoUrl.trim()) return null;
  if (
    photoUrl.startsWith('data:') ||
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://')
  ) {
    return photoUrl;
  }

  const baseUrl = apiBaseUrl.replace('/api', '');
  const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${baseUrl}${cleanPath}`;
}

function withCacheBust(url: string): string {
  if (url.startsWith('data:')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

/** Notify navbar, auth context, and other listeners that the profile photo changed. */
export function dispatchProfilePhotoUpdated(
  photoUrl: string | null | undefined,
  apiBaseUrl?: string
) {
  if (typeof window === 'undefined') return;

  const resolved = resolveProfilePhotoUrl(photoUrl, apiBaseUrl);
  const profilePhotoUrl = resolved ? withCacheBust(resolved) : null;

  window.dispatchEvent(
    new CustomEvent<ProfilePhotoUpdatedDetail>(PROFILE_PHOTO_UPDATED_EVENT, {
      detail: { profilePhotoUrl },
    })
  );
}
