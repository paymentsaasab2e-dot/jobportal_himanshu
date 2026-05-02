'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/common/Footer';

export default function GlobalFooter() {
    const pathname = usePathname();
    
    // Pages that should hide the global footer
    const hideFooterPaths = [
        '/whatsapp',
        '/whatsapp/verify'
    ];
    
    const shouldHide = hideFooterPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (shouldHide) return null;

    return <Footer />;
}
