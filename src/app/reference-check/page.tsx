'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { CompanyPageView } from '@/components/community/CompanyPageView';
import {
  ReferenceCheckInbox,
  type ReferenceInboxFilter,
} from '@/components/community/ReferenceCheckInbox';
import { ReferenceCheckReviewPanel } from '@/components/community/ReferenceCheckReviewPanel';
import { ReferenceCheckWizard } from '@/components/community/ReferenceCheckWizard';
import {
  canConnectToCompany,
  connectCompanyPage,
  getGossipDisplayName,
  getOwnedCompanyPages,
  getVisibleFeed,
  listOpenForReferenceOnCompany,
  loadCommunityState,
  searchCompanyPages,
  type CommunityPost,
  type CompanyPage,
} from '@/lib/community-store';
import { listReferenceChecksForUser } from '@/lib/reference-check-store';

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
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [wizardCompany, setWizardCompany] = useState<CompanyPage | null>(null);
  const [tick, setTick] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [inboxFilter, setInboxFilter] = useState<ReferenceInboxFilter>('all');
  const cvCompanies: string[] = [];

  const refresh = useCallback(() => {
    const state = loadCommunityState();
    setCompanyPages(state.companyPages);
    setFeed(getVisibleFeed(userId));
    setTick((n) => n + 1);
  }, [userId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) refresh();
  }, [authLoading, isAuthenticated, refresh]);

  useEffect(() => {
    const onHydrated = () => refresh();
    window.addEventListener('saasa:office-gossips-hydrated', onHydrated);
    return () => window.removeEventListener('saasa:office-gossips-hydrated', onHydrated);
  }, [refresh]);

  useEffect(() => {
    const fromQuery = searchParams.get('company');
    if (!fromQuery || companyPages.length === 0) return;
    const co = companyPages.find((c) => c.id === fromQuery);
    if (!co) return;
    setSelectedCompanyId(co.id);
    if (searchParams.get('wizard') === '1') {
      setWizardCompany(co);
    }
  }, [searchParams, companyPages]);

  const ownedCompanies = useMemo(
    () => (userId ? getOwnedCompanyPages(userId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, companyPages, tick],
  );

  const filteredCompanies = useMemo(() => {
    return search.trim() ? searchCompanyPages(search) : companyPages;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, companyPages, tick]);

  const selectedCompany = useMemo(
    () => companyPages.find((c) => c.id === selectedCompanyId) || null,
    [companyPages, selectedCompanyId],
  );

  const referenceRequests = useMemo(
    () => (userId ? listReferenceChecksForUser(userId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, tick],
  );

  const attentionRequests = useMemo(() => {
    if (!userId) return [];
    return referenceRequests.filter(
      (r) =>
        r.refereeId === userId &&
        (r.status === 'pending' || r.status === 'awaiting_answers'),
    );
  }, [referenceRequests, userId]);

  const openCompany = (pageId: string) => {
    setSelectedCompanyId(pageId);
    setSearch('');
  };

  const handleConnect = (page: CompanyPage) => {
    if (!userId) return;
    const ok = canConnectToCompany(page, { email: user?.email, cvCompanies });
    if (!ok) {
      showErrorToast('Connect', 'You cannot connect to this company page yet.');
      return;
    }
    connectCompanyPage(page.id, userId);
    showSuccessToast('Connected', `${page.name} is linked to your account.`);
    refresh();
  };

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
    <div
      className="h-[calc(100dvh-var(--app-header-height,96px))] overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(16,185,129,0.08), transparent 28%), radial-gradient(circle at 85% 10%, rgba(40,168,225,0.1), transparent 22%), linear-gradient(180deg, #f3f8fb 0%, #eef3f8 45%, #f7fafc 100%)',
      }}
    >
      <div className="mx-auto flex h-full max-w-[1520px] flex-col gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_10px_22px_rgba(16,185,129,0.28)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900">
                Reference Check
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Set your fee · browse companies · review requests
              </p>
            </div>
          </div>
          {attentionRequests.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-900">
              {attentionRequests.length} need
              {attentionRequests.length === 1 ? 's' : ''} your action
            </span>
          ) : null}
        </header>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(300px,360px)]">
          {/* LEFT — status inbox + fee setup */}
          <aside className="min-h-0">
            {userId ? (
              <ReferenceCheckInbox
                userId={userId}
                requests={referenceRequests}
                filter={inboxFilter}
                onFilterChange={setInboxFilter}
                selectedId={selectedRequestId}
                onSelect={setSelectedRequestId}
                onIdentityChange={refresh}
              />
            ) : null}
          </aside>

          {/* CENTER — companies / company page */}
          <section className="min-h-0 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <div className="h-full min-h-0 overflow-y-auto p-4">
              {selectedCompany && userId ? (
                <CompanyPageView
                  company={selectedCompany}
                  userId={userId}
                  authorName={authorName}
                  posts={feed}
                  isConnected={selectedCompany.memberIds.includes(userId)}
                  canConnect={canConnectToCompany(selectedCompany, {
                    email: user?.email,
                    cvCompanies,
                  })}
                  variant="reference"
                  initialTab="people"
                  backLabel="Back to companies"
                  onBack={() => setSelectedCompanyId(null)}
                  onConnect={() => handleConnect(selectedCompany)}
                  onRefresh={refresh}
                  onStartReferenceCheck={() => setWizardCompany(selectedCompany)}
                  viewerRealName={displayName(user)}
                />
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search companies by name or domain…"
                      className="h-11 w-full rounded-full border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm font-medium outline-none focus:border-[rgba(40,168,225,0.45)] focus:bg-white focus:ring-2 focus:ring-[rgba(40,168,225,0.12)]"
                    />
                  </div>

                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Companies
                  </p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {filteredCompanies.map((co) => {
                      const openCount = listOpenForReferenceOnCompany(co.id).length;
                      return (
                        <li key={co.id}>
                          <button
                            type="button"
                            onClick={() => openCompany(co.id)}
                            className="flex w-full items-start gap-3 rounded-[16px] border border-slate-200/90 bg-slate-50/60 px-3 py-3 text-left transition hover:border-[rgba(40,168,225,0.35)] hover:bg-sky-50/80"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#08428c] text-sm font-bold text-white">
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
                    <div className="mt-10 flex flex-col items-center px-4 text-center">
                      <Building2 className="h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-800">No companies found</p>
                      <p className="mt-1 text-xs text-slate-500">Try another search term.</p>
                    </div>
                  ) : null}
                  {ownedCompanies.length > 0 ? (
                    <p className="mt-4 text-[10px] text-slate-400">
                      You admin {ownedCompanies.length} page
                      {ownedCompanies.length === 1 ? '' : 's'}.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </section>

          {/* RIGHT — review panel */}
          <aside className="min-h-0">
            {userId ? (
              <ReferenceCheckReviewPanel
                userId={userId}
                requestId={selectedRequestId}
                attention={attentionRequests}
                onSelect={setSelectedRequestId}
                onChanged={refresh}
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
            setSelectedRequestId(id);
            setInboxFilter('sent');
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
