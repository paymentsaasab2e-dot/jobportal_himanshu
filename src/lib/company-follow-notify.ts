/**
 * When a company page publishes an update, nudge followers via
 * HRYantra verified chat + header bell — copy is lightly personalized
 * from their recent activity (roles / companies they've been browsing).
 */

import { pushHryantraVerifiedMessage } from '@/lib/hryantra-verified-chat-store';
import { listCompanyFollowerIds } from '@/lib/social-store';
import { buildUserActivityRollup } from '@/lib/user-activity-tracker';
import { listUserInterests, syncInterestsFromBehaviour } from '@/lib/interest-affinity-store';

function previewText(text: string, max = 100): string {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function personalAngle(userId: string, companyName: string): string {
  try {
    syncInterestsFromBehaviour(userId);
    const topInterest = listUserInterests(userId, 12)[0];
    const rollup = buildUserActivityRollup(userId, 'week', { skipSignals: true });
    const topRole = rollup?.topRoles?.[0]?.label?.trim();
    const topCompany = rollup?.topCompanies?.[0]?.label?.trim();

    if (topInterest?.label && companyName) {
      return `Given your interest in ${topInterest.label}, this update from ${companyName} may fit what you’ve been exploring.`;
    }
    if (topRole && companyName) {
      return `You’ve been exploring ${topRole} roles lately — this update from ${companyName} may be worth a look.`;
    }
    if (topCompany && topCompany.toLowerCase() !== companyName.toLowerCase()) {
      return `Based on companies you’ve been researching (like ${topCompany}), you might like this from ${companyName}.`;
    }
  } catch {
    /* ignore personalization failures */
  }
  return `You’re following ${companyName} — here’s their latest update.`;
}

export function notifyCompanyFollowersOfPost(input: {
  companyPageId: string;
  companyName: string;
  postId: string;
  postText?: string;
  postType?: string;
  /** Don’t notify the author / page owner */
  excludeUserId?: string;
}): number {
  if (typeof window === 'undefined') return 0;
  const followers = listCompanyFollowerIds(input.companyPageId).filter(
    (id) => id && id !== input.excludeUserId,
  );
  if (followers.length === 0) return 0;

  const snippet = previewText(input.postText || '');
  const mediaHint =
    input.postType === 'image'
      ? ' (with photos)'
      : input.postType === 'video'
        ? ' (with a video)'
        : '';
  const actionUrl = `/community?company=${encodeURIComponent(input.companyPageId)}`;

  let sent = 0;
  for (const followerId of followers) {
    const angle = personalAngle(followerId, input.companyName);
    const body = [
      `${input.companyName} posted something new${mediaHint}.`,
      snippet ? `“${snippet}”` : null,
      angle,
      'Want to view it on their page?',
    ]
      .filter(Boolean)
      .join('\n\n');

    const result = pushHryantraVerifiedMessage({
      userId: followerId,
      text: body,
      actionUrl,
      notificationTitle: `${input.companyName} posted an update`,
      notificationDescription: snippet
        ? `${snippet} — open to view`
        : `New post from a company you follow. Open to view.`,
      notificationActionButton: 'View post',
      notificationActionPath: '/community',
      hqMeta: {
        kind: 'company_follow_post',
        companyPageId: input.companyPageId,
        companyName: input.companyName,
        postId: input.postId,
        channel: 'alert',
      },
    });
    if (result.ok) sent += 1;
  }
  return sent;
}
