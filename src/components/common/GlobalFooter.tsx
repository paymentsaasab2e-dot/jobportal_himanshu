'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/common/Footer';
import { stripLocaleFromPathname } from '@/lib/i18n';

export default function GlobalFooter() {
    const pathname = usePathname();
    const normalizedPath = stripLocaleFromPathname(pathname || '/');
    
    // Pages that should hide the global footer
    const hideFooterPaths = [
        '/whatsapp',
        '/whatsapp/verify',
        '/profile',
        '/explore-jobs',
        '/extract',
        '/uploadcv',
    ];
    
    const shouldHide = hideFooterPaths.some(path => normalizedPath === path || normalizedPath.startsWith(path + '/'));

    if (shouldHide) return null;

    return <Footer />;
}
