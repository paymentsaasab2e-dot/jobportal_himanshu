'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/common/Header';

export default function GlobalHeader() {
    const pathname = usePathname();
    
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
        '/executive-services'
    ];
    const shouldHide = hideHeaderPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (shouldHide) return null;

    return <Header />;
}
