'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ChevronRight, Crown, Gift, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useTokens } from '@/components/tokens/TokensContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import {
  detectLocationCurrency,
  formatLocalPackPrice,
  type LocationCurrency,
} from '@/lib/location-currency';
import {
  localizeEarnPath,
  resolveEarnTaskHref,
} from '@/lib/earn-lifecycle';

type TabId = 'premium' | 'earn';

function serviceHref(serviceId: string, category: string): string {
  if (serviceId.startsWith('lms.resume') || serviceId.startsWith('cveditor')) {
    return '/lms/resume-builder';
  }
  if (serviceId.startsWith('lms.quizzes')) return '/lms/quizzes';
  if (serviceId === 'lms.interview.mock-session-start') return '/lms/interview-prep';
  if (serviceId === 'lms.interview.unlock-request') return '/lms/interview-prep/request-interview';
  if (serviceId === 'lms.interview.unlock-interviewer') {
    return '/lms/interview-prep/become-interviewer';
  }
  if (serviceId.startsWith('lms.interview')) return '/lms/interview-prep';
  if (serviceId.startsWith('lms.notes')) return '/lms/notes';
  if (serviceId.startsWith('lms.career-path')) return '/lms/career-path';
  if (serviceId.startsWith('lms.courses') || category === 'Courses') return '/lms/courses';
  return '/lms';
}

export default function SubscriptionsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    balance,
    services,
    packs,
    earnTasks,
    earnLifecycle,
    claimedEarnKeys,
    loading,
    purchase,
    refresh,
  } = useTokens();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('premium');
  const [locCurrency, setLocCurrency] = useState<LocationCurrency | null>(null);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    setLocCurrency(detectLocationCurrency());
  }, []);

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, typeof services>();
    for (const s of services) {
      const list = map.get(s.category) || [];
      list.push(s);
      map.set(s.category, list);
    }
    return Array.from(map.entries());
  }, [services]);

  const earnByCategory = useMemo(() => {
    const claimed = new Set(claimedEarnKeys);
    const list =
      earnLifecycle.length > 0
        ? [...earnLifecycle].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        : earnTasks.map((t) => ({
            ...t,
            done: claimed.has(t.id),
            status: (claimed.has(t.id) ? 'done' : 'pending') as 'done' | 'pending',
          }));
    const map = new Map<string, typeof list>();
    for (const t of list) {
      const cat = t.category || 'Other';
      const bucket = map.get(cat) || [];
      bucket.push(t);
      map.set(cat, bucket);
    }
    return Array.from(map.entries());
  }, [earnTasks, earnLifecycle, claimedEarnKeys]);

  const currency = locCurrency?.currency || 'USD';

  const handlePurchase = async (packageId: string) => {
    setBuyingId(packageId);
    try {
      const result = await purchase(packageId);
      showSuccessToast(`Added ${result.credited}`, `Balance: ${result.tokenBalance}`);
      void refresh();
    } catch (err) {
      showErrorToast('Purchase failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBuyingId(null);
    }
  };

  const go = (path: string) => {
    router.push(localizeEarnPath(path, locale));
  };

  if (authLoading || loading) {
    return <GlobalLoader />;
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Subscriptions</h1>
        <p className="mt-3 text-slate-600">Sign in to view your balance and packs.</p>
        <button
          type="button"
          onClick={() => go('/whatsapp')}
          className="mt-6 rounded-xl bg-(--brand-primary) px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-5xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(32,152,200,0.12),transparent_55%)]"
      />

      {/* Floating balance — below navbar, no border */}
      <div
        className="sticky z-30 mb-8"
        style={{ top: 'calc(var(--app-header-height, 96px) + 12px)' }}
      >
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/90 px-5 py-4 shadow-[0_10px_36px_-10px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Balance
            </p>
            <p className="mt-1 inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <TokenCoinIcon className="h-7 w-7" />
              {balance}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('premium');
              document.getElementById('buy-packs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="shrink-0 rounded-xl bg-(--brand-primary) px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Buy more
          </button>
        </div>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Subscriptions
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-600">
          Unlock premium LMS tools, or earn coins by completing profile tasks.
        </p>
      </header>

      {/* Premium | Earn tabs */}
      <div
        className="mb-8 grid grid-cols-2 gap-2"
        role="tablist"
        aria-label="Subscriptions sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'premium'}
          onClick={() => setTab('premium')}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            tab === 'premium'
              ? 'border border-transparent bg-[#176F96] text-white shadow-md shadow-slate-900/15'
              : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <Crown className={`h-4 w-4 ${tab === 'premium' ? 'text-amber-300' : 'text-slate-500'}`} />
          Premium
          <Sparkles className={`h-3.5 w-3.5 ${tab === 'premium' ? 'text-amber-300' : 'text-slate-400'}`} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'earn'}
          onClick={() => setTab('earn')}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            tab === 'earn'
              ? 'border border-transparent bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
              : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <Gift className={`h-4 w-4 ${tab === 'earn' ? 'text-emerald-100' : 'text-slate-500'}`} />
          Earn
          <TokenCoinIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {tab === 'premium' ? (
        <div className="space-y-10">
          <section id="buy-packs">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Buy packs</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {packs.map((pack) => {
                const price = formatLocalPackPrice(pack.priceAmount, currency, locale);
                return (
                  <div
                    key={pack.id}
                    className={`relative flex flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.18)] transition hover:shadow-[0_12px_32px_-10px_rgba(15,23,42,0.22)] ${
                      pack.popular ? 'ring-2 ring-[#2098C8]/35' : ''
                    }`}
                  >
                    {pack.popular ? (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#176F96] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        Popular
                      </span>
                    ) : null}
                    <h3 className="pr-16 text-base font-semibold text-slate-900">{pack.name}</h3>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{price}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                      <TokenCoinIcon className="h-4 w-4" />
                      {pack.tokens}
                    </p>
                    <button
                      type="button"
                      disabled={buyingId !== null}
                      onClick={() => void handlePurchase(pack.id)}
                      className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                        pack.popular
                          ? 'bg-[#176F96] hover:opacity-95'
                          : 'bg-(--brand-primary) hover:opacity-90'
                      }`}
                    >
                      {buyingId === pack.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Purchasing…
                        </>
                      ) : (
                        'Purchase'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-5 text-lg font-semibold text-slate-900">Premium services</h2>
            <div className="space-y-7">
              {servicesByCategory.map(([category, items]) => (
                <div key={category}>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#176F96]/70">
                    <span className="h-px w-4 bg-[#2098C8]/50" />
                    {category}
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {items.map((service) => {
                      const shortfall = Math.max(0, service.cost - balance);
                      const canAfford = shortfall === 0;
                      const href = serviceHref(service.id, service.category);
                      return (
                        <li key={service.id}>
                          <button
                            type="button"
                            onClick={() => go(href)}
                            className="group flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-4 text-left shadow-[0_6px_24px_-10px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(32,152,200,0.25)] active:scale-[0.99]"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#176F96] text-amber-300">
                              <Crown className="h-[18px] w-[18px]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">{service.name}</p>
                              <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                                {service.description}
                              </p>
                              <p
                                className={`mt-1.5 text-[11px] font-semibold ${
                                  canAfford ? 'text-emerald-600' : 'text-[#2098C8]'
                                }`}
                              >
                                {canAfford ? 'Ready to use' : `Need ${shortfall} more`}
                              </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-800">
                              <TokenCoinIcon className="h-3.5 w-3.5" />
                              {service.cost}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#2098C8]" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            {services.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Services will appear after the catalog loads.
              </p>
            ) : null}
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 sm:p-5">
            <p className="text-sm text-emerald-900/80">
              Account path in order. If you undo a profile task (e.g. delete all projects),
              it becomes pending again — re-complete for a smaller repeat credit.
            </p>
          </div>
          {earnByCategory.map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700/80">
                <span className="h-px w-4 bg-emerald-300" />
                {category}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((task) => {
                  const done = Boolean(task.done);
                  const repeat = Boolean(task.repeat);
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        disabled={done && !task.auto}
                        onClick={() => {
                          if (done && task.auto) {
                            go(resolveEarnTaskHref(task));
                            return;
                          }
                          if (done) return;
                          go(resolveEarnTaskHref(task));
                        }}
                        className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
                          done
                            ? 'cursor-default border-slate-100 bg-slate-50 opacity-80'
                            : 'border-emerald-100 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.99]'
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                            done
                              ? 'bg-slate-100 text-slate-500 ring-slate-200'
                              : 'bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-700 ring-emerald-200/70'
                          }`}
                        >
                          <Gift className="h-[18px] w-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">
                            {task.order ? `${task.order}. ` : ''}
                            {task.name}
                            {repeat ? (
                              <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                                again
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">
                            {done
                              ? 'Completed'
                              : repeat
                                ? 'Re-add after undo — smaller credit'
                                : task.auto
                                  ? 'Automatic on first dashboard visit'
                                  : task.description}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                            done
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {done ? 'Done' : '+'}
                          {!done ? (
                            <>
                              <TokenCoinIcon className="h-3.5 w-3.5" />
                              {task.nextTokens || task.tokens}
                            </>
                          ) : null}
                        </span>
                        {!done ? (
                          <ChevronRight className="h-4 w-4 shrink-0 text-emerald-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {earnTasks.length === 0 && earnLifecycle.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Earn tasks will appear after the catalog loads.
            </p>
          ) : null}
        </div>
      )}
    </main>
  );
}
