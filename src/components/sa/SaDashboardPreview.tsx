'use client';

import {
  Bell,
  Check,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react';

const CHART_PATH =
  'M 0 72 C 40 68, 55 42, 90 48 S 150 18, 200 28 S 280 8, 340 22 S 420 12, 480 6';

export function SaDashboardPreview() {
  return (
    <div className="pointer-events-none select-none overflow-hidden rounded-xl bg-background text-[11px] text-foreground">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-semibold text-primary-foreground">
            N
          </div>
          <span className="text-xs font-semibold">Nexora</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>

        <div className="hidden flex-1 items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 md:flex md:max-w-xs">
          <Search className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">Search</span>
          <span className="ml-auto rounded border border-border bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground">
            ⌘K
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] font-medium sm:inline">Move Money</span>
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground">
            JB
          </div>
        </div>
      </div>

      <div className="flex min-h-[320px]">
        <aside className="hidden w-40 shrink-0 border-r border-border bg-background p-3 sm:block">
          <nav className="space-y-1">
            {[
              { label: 'Home', active: true },
              { label: 'Tasks', badge: '10' },
              { label: 'Transactions' },
              { label: 'Payments', chevron: true },
              { label: 'Cards' },
              { label: 'Capital' },
              { label: 'Accounts', chevron: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-md px-2 py-1.5 text-[10px] ${
                  item.active ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  {item.badge ? (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-semibold text-accent-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
                {item.chevron ? <ChevronDown className="h-3 w-3" /> : null}
              </div>
            ))}
          </nav>

          <p className="mb-1 mt-4 px-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Workflows
          </p>
          <nav className="space-y-1">
            {['Trake rutes', 'Payments', 'Notifications', 'Settings'].map((label) => (
              <div key={label} className="rounded-md px-2 py-1.5 text-[10px] text-muted-foreground">
                {label}
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 bg-secondary-30 p-3 md:p-4">
          <p className="text-sm font-semibold text-foreground">Welcome, Jane</p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {['Send', 'Request', 'Transfer', 'Deposit', 'Pay Bill', 'Create Invoice'].map((label, index) => (
              <span
                key={label}
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  index === 0
                    ? 'bg-accent text-accent-foreground'
                    : 'border border-border bg-background text-foreground'
                }`}
              >
                {label}
              </span>
            ))}
            <span className="text-[10px] text-muted-foreground">Customize</span>
          </div>

          <div className="mt-3 flex flex-col gap-3 lg:flex-row">
            <div className="flex-1 basis-0 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold">Mercury Balance</span>
                <Check className="h-3 w-3 text-accent" />
              </div>
              <p className="mt-2 text-lg font-semibold leading-none">
                $8,450,190<span className="text-xs text-muted-foreground">.32</span>
              </p>
              <div className="mt-2 flex gap-4 text-[10px]">
                <span className="text-muted-foreground">Last 30 Days</span>
                <span className="font-medium text-emerald-600">+$1.8M</span>
                <span className="font-medium text-red-500">-$900K</span>
              </div>
              <svg viewBox="0 0 480 80" className="mt-3 h-20 w-full" aria-hidden>
                <defs>
                  <linearGradient id="sa-chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${CHART_PATH} L 480 80 L 0 80 Z`} fill="url(#sa-chart-fill)" />
                <path
                  d={CHART_PATH}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="flex-1 basis-0 rounded-xl border border-border bg-background p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Accounts</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Plus className="h-3 w-3" />
                  <MoreHorizontal className="h-3 w-3" />
                </div>
              </div>
              <div className="mt-2 space-y-3">
                {[
                  ['Credit', '$98,125.50'],
                  ['Treasury', '$6,750,200.00'],
                  ['Operations', '$1,592,864.82'],
                ].map(([label, amount]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-background p-3">
            <p className="text-xs font-semibold">Recent Transactions</p>
            <div className="mt-2 overflow-hidden">
              <div className="grid grid-cols-4 gap-2 border-b border-border pb-2 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Date</span>
                <span>Description</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {[
                ['Mar 12', 'AWS', '-$5,200', 'Pending', 'text-amber-600'],
                ['Mar 11', 'Client Payment', '+$125,000', 'Completed', 'text-emerald-600'],
                ['Mar 10', 'Payroll', '-$85,450', 'Completed', 'text-emerald-600'],
                ['Mar 09', 'Office Supplies', '-$1,200', 'Completed', 'text-emerald-600'],
              ].map(([date, description, amount, status, statusClass]) => (
                <div key={`${date}-${description}`} className="grid grid-cols-4 gap-2 py-2 text-[10px]">
                  <span className="text-muted-foreground">{date}</span>
                  <span>{description}</span>
                  <span className="font-medium">{amount}</span>
                  <span className={statusClass}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
