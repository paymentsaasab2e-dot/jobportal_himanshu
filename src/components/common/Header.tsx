'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';

import { API_BASE_URL, getApiBaseUrl } from '@/lib/api-base';
import NotificationPanel from '@/components/common/NotificationPanel';
import ProfilePanel from '@/components/common/ProfilePanel';
import GlobalAIAssistant from '@/components/common/GlobalAIAssistant';
const PRIMARY = '#28A8E1';
const JOBS_PATH = '/explore-jobs';

async function fetchWithRetry(
    input: RequestInfo | URL,
    init: RequestInit,
    retries = 2,
    retryDelayMs = 500
): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fetch(input, init);
        } catch (error) {
            lastError = error;
            if (attempt === retries) break;
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error('Network error while calling API');
}

export default function Header({ showNav = true }: { showNav?: boolean }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [profileCompletion, setProfileCompletion] = useState<number | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const isActive = useCallback(
        (path: string) => {
            if (path === '/candidate-dashboard') {
                return pathname === path;
            }
            if (path === '/applications') {
                return pathname?.startsWith('/applications') || pathname?.startsWith('/interviews');
            }
            if (path === '/lms/courses') {
                return pathname?.startsWith('/lms');
            }
            return pathname?.startsWith(path);
        },
        [pathname]
    );

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const [showJobSearch, setShowJobSearch] = useState(false);
    const [jobSearchValue, setJobSearchValue] = useState('');

    const headerShellRef = useRef<HTMLElement | null>(null);
    /** Reserves document flow space equal to the fixed header so page content is not hidden underneath. */
    const [headerSpacerPx, setHeaderSpacerPx] = useState(96);

    // Fetch profile data (photo, name, email)
    useEffect(() => {
        const fetchProfileData = async () => {
            const candidateId = sessionStorage.getItem("candidateId");
            if (!candidateId) {
                setIsLoggedIn(false);
                return;
            }
            setIsLoggedIn(true);

            // Try to load from cache first for instant UI response
            const cachedProfile = sessionStorage.getItem(`profile_${candidateId}`);
            if (cachedProfile) {
                try {
                    const profile = JSON.parse(cachedProfile);
                    if (profile.fullName) setUserName(profile.fullName.split(' ')[0]);
                    if (profile.email) setUserEmail(profile.email);
                    if (profile.profileCompleteness) setProfileCompletion(profile.profileCompleteness);
                    if (profile.profilePhotoUrl) setProfilePhotoUrl(profile.profilePhotoUrl);
                } catch (e) {
                    console.error("Error parsing cached profile:", e);
                }
            }

            try {
                const response = await fetchWithRetry(`${getApiBaseUrl()}/cv/dashboard/${candidateId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data?.profile) {
                        const profile = result.data.profile;
                        
                        // Save to cache
                        sessionStorage.setItem(`profile_${candidateId}`, JSON.stringify(profile));

                        // Update state
                        if (profile.fullName) {
                            const firstName = profile.fullName.split(' ')[0];
                            setUserName(firstName);
                        }
                        if (profile.email) setUserEmail(profile.email);
                        if (typeof profile.profileCompleteness === 'number') {
                            setProfileCompletion(profile.profileCompleteness);
                        }

                        if (profile.profilePhotoUrl) {
                            const photoUrl = profile.profilePhotoUrl;
                            if (photoUrl && photoUrl.trim() !== '') {
                                let imageSrc: string;
                                if (photoUrl.startsWith('data:') || photoUrl.startsWith('http')) {
                                    imageSrc = photoUrl;
                                } else {
                                    const baseUrl = getApiBaseUrl().replace('/api', '');
                                    const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
                                    imageSrc = `${baseUrl}${cleanPath}`;
                                }
                                setProfilePhotoUrl(imageSrc);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchProfileData();
    }, []);

    useEffect(() => {
        const el = headerShellRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;

        const sync = () => {
            const h = Math.ceil(el.getBoundingClientRect().height);
            setHeaderSpacerPx(h);
            document.documentElement.style.setProperty('--app-header-height', `${h}px`);
        };

        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(el);
        window.addEventListener('orientationchange', sync);

        return () => {
            ro.disconnect();
            window.removeEventListener('orientationchange', sync);
            document.documentElement.style.removeProperty('--app-header-height');
        };
    }, [showNav]);

    // Close modals when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
                setIsMobileMenuOpen(false);
            }
            if (showJobSearch) {
                const navEl = navRef.current;
                if (navEl && !navEl.contains(target)) {
                    setShowJobSearch(false);
                }
            }
        };

        if (isMobileMenuOpen || showJobSearch) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobileMenuOpen, showJobSearch]);

    useEffect(() => {
        if (typeof document === 'undefined') return;

        const shouldLockScroll = isNotificationsModalOpen || isProfileModalOpen;
        if (!shouldLockScroll) return;

        const { body } = document;
        const previousOverflow = body.style.overflow;
        const previousTouchAction = body.style.touchAction;
        body.style.overflow = 'hidden';
        body.style.touchAction = 'none';

        return () => {
            body.style.overflow = previousOverflow;
            body.style.touchAction = previousTouchAction;
        };
    }, [isNotificationsModalOpen, isProfileModalOpen]);

    // Autofocus after the Jobs search animates in
    useEffect(() => {
        if (!showJobSearch) return;
        const t = setTimeout(() => searchInputRef.current?.focus(), 120);
        return () => clearTimeout(t);
    }, [showJobSearch]);

    const isLandingPage = pathname === '/';

    // Core public items
    const publicNavItems = [
        { label: 'Explore Jobs', path: '/explore-jobs' },
        { label: 'Courses', path: '/lms/courses' },
        { label: 'Services', path: '/services' },

    ];

    const navItems = isLandingPage ? publicNavItems : isLoggedIn ? [
        { label: 'Dashboard', path: '/candidate-dashboard' },
        { label: 'Jobs', path: '/explore-jobs' },
        { label: 'Applications', path: '/applications' },
        { label: 'LMS', path: '/lms/courses' },
        { label: 'Profile', path: '/profile' },
        { label: 'Services', path: '/services' },
    ] : publicNavItems;

    const handleTabClick = (path: string) => {
        setShowJobSearch(false);
        router.push(path);
    };

    const handleJobsToggleSearch = () => {
        setShowJobSearch((prev) => !prev);
    };

    const handleSearchJobsButtonClick = () => {
        setShowJobSearch(true);
    };

    const handleSearch = () => {
        const q = jobSearchValue.trim();
        if (!q) return;
        router.push(`${JOBS_PATH}?q=${encodeURIComponent(q)}`);
    };

    const isJobsPage = pathname?.startsWith(JOBS_PATH) ?? false;

    return (
        <>
            <header
                ref={headerShellRef}
                className="fixed top-0 left-0 right-0 z-[300] w-full border-b border-slate-200/50 bg-white px-4 sm:px-6 pt-3 pb-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white"
            >
                <div className="mx-auto flex max-w-[1180px] items-center justify-between">
                    {/* Left: Logo and Hamburger */}
                    <div className="flex items-center gap-4">
                        {/* Hamburger Button - Mobile only */}
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="hamburger-button p-2 text-slate-600 hover:text-slate-800 lg:hidden transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {isMobileMenuOpen ? (
                                    <path d="M18 6L6 18M6 6l12 12" />
                                ) : (
                                    <path d="M4 12h16M4 6h16M4 18h16" />
                                )}
                            </svg>
                        </button>

                        <Image
                            src="/SAASA%20Logo.png"
                            alt="SAASA B2E"
                            width={110}
                            height={32}
                            className="h-8 w-auto cursor-pointer"
                            onClick={() => router.push('/candidate-dashboard')}
                        />
                    </div>

                    {/* Navigation Container - Desktop only */}
                    {showNav ? (
                        <nav
                            ref={navRef}
                            className="relative hidden lg:flex min-w-0 max-w-[900px] items-center justify-center gap-1 overflow-visible rounded-full border border-white/50 bg-white/50 px-3 py-2 shadow-[0_2px_16px_rgba(15,23,42,0.08)] backdrop-blur-xl backdrop-saturate-150"
                        >
                            {/* ── Tabs row + Search trigger pill ──────────────────────────────── */}
                            <div className="flex w-full items-center">
                                <LayoutGroup id="header-main-nav">
                                    <div className="relative flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full">
                                        {navItems.map((item) => {
                                            const active = isActive(item.path);
                                            return (
                                                <button
                                                    key={item.path}
                                                    type="button"
                                                    onClick={() => {
                                                        if (item.path === JOBS_PATH && active) {
                                                            handleJobsToggleSearch();
                                                        } else {
                                                            handleTabClick(item.path);
                                                        }
                                                    }}
                                                    className={`relative z-10 flex min-w-[72px] flex-1 items-center justify-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out sm:min-w-[80px] sm:flex-none ${active
                                                        ? 'text-white'
                                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                                        }`}
                                                    style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif' }}
                                                >
                                                    {active && (
                                                        <motion.div
                                                            layoutId="nav-pill"
                                                            className="pointer-events-none absolute inset-0 z-0 rounded-full"
                                                            style={{ backgroundColor: PRIMARY }}
                                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                        />
                                                    )}
                                                    <span className="relative z-10">{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </LayoutGroup>

                                {/* Search trigger — Persistent state */}
                                {!showJobSearch && (
                                    <div
                                        className="relative ml-4 shrink-0 overflow-hidden"
                                    >
                                        <button
                                            type="button"
                                            onClick={handleSearchJobsButtonClick}
                                            aria-label="Universal Search"
                                            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100/80 transition-all duration-200 group/search-btn"
                                        >
                                            <span
                                                className="text-gray-500 group-hover/search-btn:text-gray-900"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="11" cy="11" r="8" />
                                                    <path d="m21 21-4.35-4.35" />
                                                </svg>
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ── Expanded search overlay — drops down below the nav pill ──────── */}
                            <AnimatePresence>
                                {showJobSearch && (
                                    <motion.div
                                        key="search-overlay" 
                                        initial={{ opacity: 0, y: -10, scaleY: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                                        exit={{ opacity: 0, y: -10, scaleY: 0.94 }}
                                        transition={{ duration: 0.26, ease: [0.34, 1.3, 0.64, 1] }}
                                        style={{ transformOrigin: 'top center' }}
                                        className="absolute left-0 right-0 top-full mt-3 z-40"
                                    >
                                        <div className="w-full max-w-3xl mx-auto px-4">
                                            <motion.div
                                                className="relative rounded-full"
                                                initial={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
                                                animate={{ boxShadow: '0 0 0 3px rgba(40,168,225,0.18), 0 14px 36px rgba(0,0,0,0.13)' }}
                                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                            >
                                                {/* Icon inside input — fades in with slight delay */}
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.75 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.75 }}
                                                    transition={{ duration: 0.18, delay: 0.12 }}
                                                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="11" cy="11" r="8" />
                                                        <path d="m21 21-4.35-4.35" />
                                                    </svg>
                                                </motion.div>

                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={jobSearchValue}
                                                    onChange={(e) => setJobSearchValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') { e.preventDefault(); handleSearch(); }
                                                        if (e.key === 'Escape') { setShowJobSearch(false); }
                                                    }}
                                                    placeholder="Search for roles, companies, or insights..."
                                                    className="w-full rounded-full border bg-white pl-12 pr-14 py-4 text-base focus:outline-none focus:ring-2 focus:ring-offset-0"
                                                    style={{
                                                        borderColor: 'var(--border-color)',
                                                        fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
                                                        ['--tw-ring-color' as string]: 'rgba(40,168,225,0.28)',
                                                    }}
                                                />

                                                {/* Submit button — pops in */}
                                                <motion.button
                                                    type="button"
                                                    onClick={handleSearch}
                                                    aria-label="Search jobs"
                                                    initial={{ opacity: 0, scale: 0.7 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.7 }}
                                                    transition={{ duration: 0.18, delay: 0.14 }}
                                                    whileHover={{ scale: 1.08 }}
                                                    whileTap={{ scale: 0.93 }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-white"
                                                    style={{ backgroundColor: PRIMARY }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="11" cy="11" r="8" />
                                                        <path d="m21 21-4.35-4.35" />
                                                    </svg>
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </nav>
                    ) : null}

                    {/* Mobile Menu Overlay */}
                    {isMobileMenuOpen && (
                        <div className="mobile-menu fixed inset-0 z-10002 lg:hidden">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />

                            {/* Menu Content */}
                            <nav className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl p-6 flex flex-col gap-4 animate-in slide-in-from-left duration-300">
                                <div className="flex items-center justify-between mb-8">
                                    <Image
                                        src="/SAASA%20Logo.png"
                                        alt="SAASA B2E"
                                        width={100}
                                        height={28}
                                        className="h-6 w-auto"
                                    />
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {navItems.map((item) => {
                                        const active = isActive(item.path);
                                        return (
                                            <button
                                                key={item.path}
                                                onClick={() => {
                                                    router.push(item.path);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                className={`flex items-center px-4 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${active
                                                    ? 'bg-[#28A8E1] text-white shadow-[0_10px_18px_rgba(40,168,225,0.18)]'
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </nav>
                        </div>
                    )}

                    {/* Right side icons - Settings, Notifications, Profile / Login */}
                    <div className="flex items-center gap-3">
                        {isLoggedIn && !isLandingPage ? (
                            <>
                                {/* Notifications trigger */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsNotificationsModalOpen(!isNotificationsModalOpen);
                                            setIsProfileModalOpen(false);
                                        }}
                                        className="relative p-2 text-slate-600 hover:text-slate-800 transition-colors"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Profile trigger */}
                                {profilePhotoUrl ? (
                                    <div className="relative profile-button">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsProfileModalOpen(!isProfileModalOpen);
                                                setIsNotificationsModalOpen(false);
                                            }}
                                            className="profile-button h-8 w-8 cursor-pointer overflow-hidden rounded-full bg-slate-300"
                                        >
                                            <Image
                                                src={profilePhotoUrl}
                                                alt="User avatar"
                                                width={32}
                                                height={32}
                                                className="h-8 w-8 object-cover"
                                                unoptimized
                                            />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative profile-button">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsProfileModalOpen(!isProfileModalOpen);
                                                setIsNotificationsModalOpen(false);
                                            }}
                                            className="profile-button h-8 w-8 cursor-pointer overflow-hidden rounded-full bg-slate-300 flex items-center justify-center text-xs font-semibold text-slate-600"
                                        >
                                            {userName ? userName.charAt(0).toUpperCase() : 'U'}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="hidden sm:flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/employers')}
                                    className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mr-2"
                                >
                                    For Employers
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/whatsapp')}
                                    className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Log In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/whatsapp')}
                                    className="rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <div
                aria-hidden
                data-app-header-spacer
                className="w-full shrink-0"
                style={{ height: headerSpacerPx }}
            />
            <NotificationPanel
                isOpen={isNotificationsModalOpen}
                onClose={() => setIsNotificationsModalOpen(false)}
                onNavigate={(path) => {
                    router.push(path);
                    setIsNotificationsModalOpen(false);
                }}
            />
            <ProfilePanel
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onNavigate={(path) => {
                    router.push(path);
                    setIsProfileModalOpen(false);
                }}
                profilePhotoUrl={profilePhotoUrl}
                userName={userName}
                userEmail={userEmail}
                profileCompletion={profileCompletion}
            />
            {isLoggedIn && !isLandingPage && <GlobalAIAssistant />}
        </>
    );
}
