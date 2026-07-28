'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { ReferenceCheckPanel } from '@/components/community/ReferenceCheckPanel';
import { ReferenceCheckWizard } from '@/components/community/ReferenceCheckWizard';
import {
  getGossipDisplayName,
  getOwnedCompanyPages,
  listOpenForReferenceOnCompany,
  loadCommunityState,
  searchCompanyPages,
  type CompanyPage,
} from '@/lib/community-store';

function displayName(user: { name?: string | null; email?: string | null } | null | undefined) {
  if (!user) return 'Member';
  if (user.name?.trim()) return user.name.trim();
  if (user.email) return user.email.split('@')[0];
  return 'Member';
}

function ReferenceCheckInner() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const userId = user?.id || null;
  const authorName = getGossipDisplayName(userId, displayName(user));

  const [companyPages, setCompanyPages] = useState<CompanyPage[]>([]);
  const [search, setSearch] = useState('');
  const [wizardCompany, setWizardCompany] = useState<CompanyPage | null>(null);
  const [tick, setTick] = useState(0);
  const [focusRequestId, setFocusRequestId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const state = loadCommunityState();
    setCompanyPages(state.companyPages);
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) refresh();
  }, [authLoading, isAuthenticated, refresh]);

  useEffect(() => {
    const fromQuery = searchParams.get('company');
    if (!fromQuery || companyPages.length === 0) return;
    const co = companyPages.find((c) => c.id === fromQuery);
    if (co) setWizardCompany(co);
  }, [searchParams, companyPages]);

  const ownedCompanies = useMemo(
    () => (userId ? getOwnedCompanyPages(userId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, companyPages, tick],
  );

  const filteredCompanies = useMemo(() => {
    return search.trim() ? searchCompanyPages(search) : companyPages;
  }, [search, companyPages, tick]);

  if (authLoading) return <GlobalLoader />;

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Reference Check</h1>
        <p className="mt-3 text-slate-600">Sign in to search companies and request references.</p>
      </main>
    );
  }

  return (
    <div className="h-[calc(100dvh-var(--app-header-height,96px))] overflow-hidden bg-[#EEF3F8]">
      <div className="mx-auto flex h-full max-w-[1128px] flex-col gap-3 px-3 py-3 sm:px-4">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Reference Check</h1>
              <p className="text-[11px] text-slate-500">
                Search a company → pick person → pay → track accept / response status
              </p>
            </div>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-h-0 overflow-y-auto rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies by name or domain…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#0A66C2] focus:bg-white"
              />
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Companies
            </p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {filteredCompanies.map((co) => {
                const openCount = listOpenForReferenceOnCompany(co.id).length;
                return (
                  <li key={co.id}>
                    <button
                      type="button"
                      onClick={() => setWizardCompany(co)}
                      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-left transition hover:border-[#0A66C2] hover:bg-sky-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1B3A5F] text-sm font-bold text-white">
                        {co.logoLetter || co.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {co.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                          {co.domainKey} · {openCount} open for reference
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {filteredCompanies.length === 0 ? (
              <div className="mt-8 flex flex-col items-center px-4 text-center">
                <Building2 className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-800">No companies found</p>
                <p className="mt-1 text-xs text-slate-500">Try another search term.</p>
              </div>
            ) : null}
            {ownedCompanies.length > 0 ? (
              <p className="mt-4 text-[10px] text-slate-400">
                You admin {ownedCompanies.length} page{ownedCompanies.length === 1 ? '' : 's'}.
              </p>
            ) : null}
          </section>

          <aside className="min-h-0 overflow-y-auto">
            {userId ? (
              <ReferenceCheckPanel
                userId={userId}
                variant="reference"
                focusRequestId={focusRequestId}
                onRefresh={refresh}
                onOpenCompany={(id) => {
                  const co = companyPages.find((c) => c.id === id);
                  if (co) setWizardCompany(co);
                }}
              />
            ) : null}
          </aside>
        </div>
      </div>

      {wizardCompany && userId ? (
        <ReferenceCheckWizard
          company={wizardCompany}
          userId={userId}
          userName={authorName}
          onClose={() => setWizardCompany(null)}
          onSubmitted={(id) => {
            setWizardCompany(null);
            setFocusRequestId(id);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

export default function ReferenceCheckPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <ReferenceCheckInner />
    </Suspense>
  );
}
