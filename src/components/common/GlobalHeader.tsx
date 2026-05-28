'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/common/Header';
import { stripLocaleFromPathname } from '@/lib/i18n';

export default function GlobalHeader() {
    const pathname = usePathname();
    const normalizedPath = stripLocaleFromPathname(pathname || '/');
    
    // Pages that should hide the global header (e.g., login, verify, etc. and new website pages)
    const hideHeaderPaths = [
        '/whatsapp', 
        '/whatsapp/verify', 
        '/', 
        '/employers', 
        '/searchjobs',
        '/extract', 
        '/uploadcv', 
        '/services', 
        '/ats-check', 
        '/executive-services',
        '/courses',
        '/privacypolicy',
        '/terms',
        '/trust-safety',
        '/aboutus',
        '/contact',
        '/explore-jobs',
        '/help'
    ];
    const shouldHide = hideHeaderPaths.some(path => normalizedPath === path || normalizedPath.startsWith(path + '/'));

    if (shouldHide) return null;

    return <Header />;
}
