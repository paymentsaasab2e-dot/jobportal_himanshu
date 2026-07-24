export const TOKEN_EARN_EVENT = 'saasa:token-earn';

export type TokenEarnDetail = {
  amount: number;
  title?: string;
  subtitle?: string;
  tokenBalance?: number;
  items?: Array<{ label?: string; amount?: number }>;
};

let lastEarnSignature = '';
let lastEarnAt = 0;

/** Fire celebrate modal + optional balance update across the app. */
export function dispatchTokenEarn(detail: TokenEarnDetail) {
  if (typeof window === 'undefined') return;
  if (!detail.amount || detail.amount <= 0) return;

  const signature = `${detail.amount}|${detail.title || ''}|${detail.subtitle || ''}`;
  const now = Date.now();
  // Avoid duplicate popups when save + catalog sync race the same grant.
  if (signature === lastEarnSignature && now - lastEarnAt < 2500) return;
  lastEarnSignature = signature;
  lastEarnAt = now;

  window.dispatchEvent(new CustomEvent(TOKEN_EARN_EVENT, { detail }));
  if (typeof detail.tokenBalance === 'number') {
    window.dispatchEvent(
      new CustomEvent('saasa:token-balance', {
        detail: { tokenBalance: detail.tokenBalance },
      }),
    );
  }
}

/** Friendly label for earn keys in celebrate UI. */
export function formatEarnLabel(earnKey?: string): string {
  if (!earnKey) return 'Reward';
  if (earnKey === 'welcome') return 'Welcome bonus';
  if (earnKey === 'earn.cv_upload') return 'CV upload';
  const profile = earnKey.replace(/^earn\.profile\./, '');
  if (profile !== earnKey) {
    return profile
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }
  return earnKey;
}
