'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { GlobalLoader } from '@/components/auth/GlobalLoader';

import { stripLocaleFromPathname } from '@/lib/i18n';

const SHOW_DELAY_MS = 180;

export function NavigationLoader() {
  const pathname = usePathname();
  const normalizedPath = stripLocaleFromPathname(pathname || '/');
  const [showLoader, setShowLoader] = useState(false);
  const prevPathname = useRef(pathname);
  const showDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      const isInternal =
        href.startsWith('/') &&
        !href.startsWith('//') &&
        !anchor.hasAttribute('download') &&
        anchor.target !== '_blank';

      if (!isInternal) return;

      const destinationPath = stripLocaleFromPathname(href.split('?')[0] || '/');

      if (normalizedPath === '/' || destinationPath === '/') return;
      if (href === pathname || href === '/extract' || href.startsWith('/extract/')) return;

      isNavigatingRef.current = true;
      if (showDelayRef.current) clearTimeout(showDelayRef.current);
      showDelayRef.current = setTimeout(() => {
        if (isNavigatingRef.current) {
          setShowLoader(true);
        }
      }, SHOW_DELAY_MS);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname, normalizedPath]);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      isNavigatingRef.current = false;
      if (showDelayRef.current) {
        clearTimeout(showDelayRef.current);
        showDelayRef.current = null;
      }
      setShowLoader(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!showLoader) return;
    const safetyTimer = setTimeout(() => setShowLoader(false), 8000);
    return () => clearTimeout(safetyTimer);
  }, [showLoader]);

  useEffect(() => {
    return () => {
      if (showDelayRef.current) clearTimeout(showDelayRef.current);
    };
  }, []);

  if (
    !showLoader ||
    normalizedPath === '/' ||
    pathname === '/extract' ||
    pathname?.startsWith('/extract/')
  ) {
    return null;
  }
  return <GlobalLoader />;
}
