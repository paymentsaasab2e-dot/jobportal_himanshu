'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { useTokensOptional } from '@/components/tokens/TokensContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { notifyInsufficientTokens } from '@/lib/token-errors';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';

type Props = {
  tokenCost: number;
  /** Action verb only, e.g. "Unlock" or "Unlock & launch" — cost shown as coin + number */
  label?: string;
  lockedLabel?: string;
  disabled?: boolean;
  className?: string;
  onSpend: () => Promise<void>;
  subscriptionsHref?: string;
};

function CostInline({ amount, className = 'h-4 w-4' }: { amount: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <TokenCoinIcon className={className} />
      <span>{amount}</span>
    </span>
  );
}

/**
 * Spend CTA. Uses coin icon for cost — not the word "tokens".
 */
export function TokenSpendButton({
  tokenCost,
  label,
  lockedLabel,
  disabled,
  className = '',
  onSpend,
  subscriptionsHref = '/subscriptions',
}: Props) {
  const tokens = useTokensOptional();
  const [busy, setBusy] = useState(false);
  const balance = tokens?.balance ?? 0;
  const canAfford = balance >= tokenCost;
  const action = label || (tokenCost > 0 ? 'Unlock' : 'Start free');

  const handleClick = async () => {
    if (busy || disabled) return;
    if (tokenCost > 0 && !canAfford) {
      showErrorToast('Need more coins', 'Get more on Subscriptions.');
      return;
    }
    setBusy(true);
    if (tokenCost > 0 && tokens?.setBalance) {
      tokens.setBalance(Math.max(0, balance - tokenCost));
    }
    try {
      await onSpend();
      if (tokenCost > 0) {
        showSuccessToast('Unlocked', `−${tokenCost}`);
        void tokens?.refresh?.();
      }
    } catch (err) {
      if (tokenCost > 0 && tokens?.setBalance) {
        tokens.setBalance(balance);
      }
      if (!notifyInsufficientTokens(err)) {
        showErrorToast('Could not unlock', err instanceof Error ? err.message : 'Try again');
      }
    } finally {
      setBusy(false);
    }
  };

  let buttonBody: ReactNode;
  if (busy) {
    buttonBody = (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Working…
      </>
    );
  } else if (tokenCost <= 0) {
    buttonBody = action;
  } else if (!canAfford) {
    buttonBody = (
      <>
        <Lock className="h-4 w-4" />
        {lockedLabel || 'Need'}
        <CostInline amount={tokenCost} />
      </>
    );
  } else {
    buttonBody = (
      <>
        <Unlock className="h-4 w-4" />
        {action}
        <span className="opacity-80">·</span>
        <CostInline amount={tokenCost} />
      </>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => void handleClick()}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
          canAfford || tokenCost === 0 ? 'btn-brand' : 'bg-amber-500 hover:opacity-95'
        }`}
      >
        {buttonBody}
      </button>
      {tokenCost > 0 ? (
        <p className="text-center text-[11px] text-slate-500">
          <Link
            href={subscriptionsHref}
            className="inline-flex items-center gap-1 font-semibold text-[#28A8E1] hover:underline"
          >
            Get more <TokenCoinIcon className="h-3.5 w-3.5" />
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function CourseAccessBadge({
  accessTier,
  tokenCost,
  isCertified,
}: {
  accessTier?: string;
  tokenCost?: number;
  isCertified?: boolean;
}) {
  const tier = (accessTier || (tokenCost && tokenCost > 0 ? 'premium' : 'free')).toLowerCase();
  if (tier === 'certified' || isCertified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-900">
        Certified · <TokenCoinIcon className="h-3 w-3" /> {tokenCost || 50}
      </span>
    );
  }
  if (tier === 'premium' || (tokenCost && tokenCost > 0)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
        Premium · <TokenCoinIcon className="h-3 w-3" /> {tokenCost}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
      Free
    </span>
  );
}

export { CostInline as TokenCostInline };
