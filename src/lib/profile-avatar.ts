import {
  isPortalPlaceholderFullName,
} from '@/components/dashboard/dashboard-utils';

export type ProfileAvatarSource = {
  fullName?: string | null;
  whatsappNumber?: string | null;
};

/** First two word initials — matches the dashboard profile card. */
export function getProfileInitials(fullName?: string | null): string {
  const parts =
    fullName
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2) || [];

  if (parts.length === 0) return 'UP';

  const initials = parts
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'UP';
}

/** Same rules as ProfileOverviewCard — prefers stored fullName, then WhatsApp digits, then display name. */
export function getAvatarInitials(
  profile?: ProfileAvatarSource | null,
  displayFullName?: string | null,
): string {
  const raw = profile?.fullName?.trim() || '';
  if (raw && !isPortalPlaceholderFullName(raw)) {
    return getProfileInitials(raw);
  }

  const digits = String(profile?.whatsappNumber || '').replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(-2).toUpperCase();
  }

  return getProfileInitials(displayFullName);
}

/** Shared gradient + initials styling used across dashboard, navbar, and profile drawer. */
export const profileAvatarSurfaceClass =
  'bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.9),transparent_34%),linear-gradient(145deg,rgba(40,168,225,0.14),rgba(40,168,223,0.2))]';

export const profileAvatarInitialsClass =
  'font-semibold uppercase tracking-[-0.04em] text-slate-600';
