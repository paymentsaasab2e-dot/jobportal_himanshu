'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Mic2,
  ClipboardList,
  CalendarDays,
  FileText,
  StickyNote,
  Route,
} from 'lucide-react';
import Header from '@/components/common/Header';
import { LMS_PAGE_BG, LMS_CONTENT_CLASS } from './constants';
import { LmsCareerEngineStrip } from './components/LmsCareerEngineStrip';
import { LmsDailyMomentum } from './components/LmsDailyMomentum';
import { LmsSharedIntelligenceHint } from './components/LmsSharedIntelligenceHint';
import { LmsOverlayProvider } from './components/overlays/LmsOverlayProvider';
import { LmsToastProvider } from './components/ux/LmsToastProvider';
import { LmsStateProvider, useLmsState } from './state/LmsStateProvider';
import { LmsOnboardingGoalModal } from './components/overlays/LmsOnboardingGoalModal';
import { useState, useEffect, useRef, useCallback } from 'react';

const NAV_ITEMS = [
  // { href: '/lms', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/lms/courses', label: 'Courses', icon: BookOpen, exact: false },
  { href: '/lms/interview-prep', label: 'Interview Prep', icon: Mic2, exact: false },
  { href: '/lms/quizzes', label: 'Quizzes', icon: ClipboardList, exact: false },
  { href: '/lms/events', label: 'Events', icon: CalendarDays, exact: false },
  { href: '/lms/resume-builder/editor', label: 'Resume Builder', icon: FileText, exact: false },
  { href: '/lms/notes', label: 'Notes', icon: StickyNote, exact: false },
  { href: '/lms/career-path', label: 'Career Path', icon: Route, exact: false },
] as const;

function isSidebarActive(pathname: string | null, href: string, exact: boolean) {
  if (!pathname) return false;
  if (exact) return pathname === href || pathname === `${href}/`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function LmsLayout({ children }: { children: ReactNode }) {
  return (
    <LmsToastProvider>
      <LmsStateProvider>
        <LmsLayoutInner>{children}</LmsLayoutInner>
      </LmsStateProvider>
    </LmsToastProvider>
  );
}

function LmsLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useLmsState();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCollapseTimer = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setCollapsed(true), 4000);
  }, []);

  const cancelCollapseTimer = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
  }, []);

  const handleSidebarEnter = () => {
    cancelCollapseTimer();
    setCollapsed(false);
  };

  const handleSidebarLeave = () => {
    startCollapseTimer();
  };

  // Start auto-collapse on mount
  useEffect(() => {
    startCollapseTimer();
    return () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); };
  }, [startCollapseTimer]);

  useEffect(() => {
    // Show onboarding if mission hasn't started and no goal is set
    // Only trigger if we have data (isHydrated)
    console.log('[LMS_ONBOARDING_DEBUG]', { 
      isHydrated: state.isHydrated, 
      started: state.careerPath.started, 
      role: state.careerPath.role 
    });

    if (state.isHydrated && !state.careerPath.role) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [state.isHydrated, state.careerPath.role]);

  return (
    <LmsOverlayProvider>
      <div className="min-h-screen flex flex-col font-sans" style={{ background: LMS_PAGE_BG }}>
        <Header />

        <div className="flex flex-1 flex-col lg:flex-row w-full min-w-0 max-w-[1550px] mx-auto -mt-4 sm:-mt-6 lg:-mt-8 relative z-10">
          {/* Mobile / small: horizontal strip */}
          <aside className="lg:hidden w-full shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-[var(--app-header-height,92px)] z-30 shadow-sm">
            <nav
              className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="LMS sections"
            >
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const active = isSidebarActive(pathname, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all duration-300 ${active
                      ? 'bg-[#28A8E1] text-white shadow-md shadow-[#28A8E1]/20 scale-[1.02] font-bold'
                      : 'bg-slate-50 text-slate-900 font-medium border border-slate-200/60 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-100 text-slate-900'}`} strokeWidth={active ? 2.5 : 2} />
                    <span className={active ? "" : "text-slate-900"}>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Desktop: vertical sidebar - collapsible */}
          <aside
            className={`hidden lg:flex shrink-0 flex-col pt-8 pb-8 sticky top-[calc(var(--app-header-height,92px)+10px)] self-start z-30 transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px] px-2' : 'w-64 px-6'}`}
            onMouseEnter={handleSidebarEnter}
            onMouseLeave={handleSidebarLeave}
          >
            <nav
              className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-xl p-3 space-y-1.5 overflow-hidden transition-shadow duration-300 hover:shadow-2xl hover:bg-white/90"
              aria-label="LMS sections"
            >
              {/* Header – hide label when collapsed */}
              <div className={`pb-3 mb-1 border-b border-slate-100 transition-all duration-200 ${collapsed ? 'px-1' : 'px-2'}`}>
                {collapsed ? (
                  <div className="flex justify-center">
                    <div className="h-1.5 w-6 rounded-full bg-slate-200" />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Learning Hub</span>
                )}
              </div>
              {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                const active = isSidebarActive(pathname, href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`flex items-center rounded-xl px-3 py-3 text-[0.95rem] transition-all duration-200 group ${
                      collapsed ? 'justify-center gap-0' : 'gap-3 justify-start'
                    } ${
                      active
                        ? 'bg-gradient-to-r from-[#28A8E1] to-[#1e85b4] text-white shadow-md shadow-[#28A8E1]/20 font-bold'
                        : 'text-slate-900 font-medium hover:bg-slate-50 border border-transparent hover:border-slate-200/50'
                    }`}
                    onClick={() => { cancelCollapseTimer(); startCollapseTimer(); }}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-transform ${active ? 'opacity-100 scale-110' : 'opacity-100 text-slate-900 group-hover:scale-110'}`} strokeWidth={active ? 2.5 : 2} />
                    <span className={`truncate transition-all duration-200 ${collapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'} ${active ? '' : 'text-slate-900'}`}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className={`flex-1 min-w-0 flex flex-col relative z-10 w-full transition-all duration-300 ${collapsed ? 'lg:max-w-[calc(100%-68px)]' : 'lg:max-w-[calc(100%-16rem)]'} overflow-hidden`}>
            <div className={LMS_CONTENT_CLASS}>
{/* <LmsCareerEngineStrip /> */}
              <div className="relative isolate px-6 pt-3 lg:px-8">
                {pathname === '/lms/courses' && <LmsDailyMomentum />}
                {pathname !== '/lms/interview-prep' && pathname !== '/lms/courses' && <LmsSharedIntelligenceHint />}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* {showOnboarding && <LmsOnboardingGoalModal onClose={() => setShowOnboarding(false)} />} */}
      </div>
    </LmsOverlayProvider>
  );
}
