'use client';

import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';

export function EventRegisterSheet({
  title,
  isRegistered,
  tokenCost = 0,
}: {
  title: string;
  isRegistered: boolean;
  tokenCost?: number;
}) {
  const cost = Math.max(0, Number(tokenCost) || 0);
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {isRegistered ? (
        <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-normal text-rose-600">
          {cost > 0
            ? 'This was a paid join. Paid event registrations cannot be cancelled.'
            : 'Unregistering will free your seat. You can join again later.'}
        </p>
      ) : cost > 0 ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-normal text-amber-900">
          This event requires{' '}
          <span className="inline-flex items-center gap-1 font-semibold">
            <TokenCoinIcon className="h-3.5 w-3.5" />
            {cost}
          </span>{' '}
          tokens. They will be deducted from your wallet and credited to the organizer.
        </p>
      ) : (
        <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-normal text-emerald-800">
          This event is free. Confirm to save your seat.
        </p>
      )}
    </div>
  );
}
