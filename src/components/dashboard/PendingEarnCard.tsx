'use client';

import Link from 'next/link';
import { ChevronRight, Gift } from 'lucide-react';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { useLocale } from 'next-intl';
import {
  localizeEarnPath,
  resolveEarnTaskHref,
} from '@/lib/earn-lifecycle';

export type PendingEarnItem = {
  id: string;
  name: string;
  tokens: number;
  href: string;
  order?: number;
};

type Props = {
  items: PendingEarnItem[];
};

export function PendingEarnCard({ items }: Props) {
  const locale = useLocale();
  if (!items.length) return null;

  const total = items.reduce((s, i) => s + i.tokens, 0);
  const ordered = [...items].sort(
    (a, b) => (a.order ?? 99) - (b.order ?? 99),
  );

  return (
    <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/50 p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
          <Gift className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Earn more tokens</p>
          <p className="mt-0.5 text-xs text-slate-600">
            Next steps in your account path — unlock up to{' '}
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <TokenCoinIcon className="h-3.5 w-3.5" /> {total}
            </span>
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {ordered.slice(0, 5).map((item, idx) => {
          const href = localizeEarnPath(
            resolveEarnTaskHref(item),
            locale,
          );
          return (
            <li key={item.id}>
              <Link
                href={href}
                className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/90 px-3 py-2.5 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                  +<TokenCoinIcon className="h-3 w-3" /> {item.tokens}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            </li>
          );
        })}
      </ul>
      {ordered.length > 5 ? (
        <p className="mt-2 text-center text-[11px] text-slate-500">
          +{ordered.length - 5} more on Subscriptions → Earn
        </p>
      ) : null}
    </div>
  );
}
