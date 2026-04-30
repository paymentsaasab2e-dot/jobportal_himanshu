'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { GlobalLoader } from '@/components/auth/GlobalLoader';

export function NavigationLoader() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minShowTimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showingSince = useRef<number | null>(null);

  // Detect link/tab clicks and start the loader
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Only trigger for internal navigation links
      const isInternal =
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !anchor.hasAttribute('download') &&
        anchor.target !== '_blank';

      if (!isInternal) return;

      // Don't show loader if navigating to the same page or to the extract page
      if (href === pathname || href === '/extract' || href.startsWith('/extract/')) return;

      // Start loader
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsNavigating(true);
      showingSince.current = Date.now();
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  // Hide loader when navigation completes (pathname changes)
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;

      // Ensure the loader shows for at least 400ms for a smooth experience
      const elapsed = showingSince.current ? Date.now() - showingSince.current : 0;
      const minRemaining = Math.max(0, 1500 - elapsed);

      if (minShowTimeRef.current) clearTimeout(minShowTimeRef.current);
      minShowTimeRef.current = setTimeout(() => {
        setIsNavigating(false);
        showingSince.current = null;
      }, minRemaining);
    }
  }, [pathname]);

  // Safety: auto-hide after 5 seconds in case navigation fails
  useEffect(() => {
    if (!isNavigating) return;
    const safetyTimer = setTimeout(() => setIsNavigating(false), 5000);
    return () => clearTimeout(safetyTimer);
  }, [isNavigating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (minShowTimeRef.current) clearTimeout(minShowTimeRef.current);
    };
  }, []);

  if (!isNavigating || pathname === '/extract' || pathname?.startsWith('/extract/')) return null;
  return <GlobalLoader />;
}
