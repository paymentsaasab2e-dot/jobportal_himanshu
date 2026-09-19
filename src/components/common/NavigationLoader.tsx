'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { stripLocaleFromPathname } from '@/lib/i18n';

const SHOW_DELAY_MS = 220;

/**
 * Top progress bar for internal navigations — replaces full-screen GlobalLoader
 * so page shells / skeletons can paint immediately.
 */
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
    normalizedPath === '/extract' ||
    normalizedPath.startsWith('/extract/') ||
    normalizedPath === '/uploadcv' ||
    normalizedPath.startsWith('/uploadcv/')
  ) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[99999] h-0.5 overflow-hidden bg-transparent"
      aria-hidden
    >
      <div className="h-full w-1/3 animate-pulse bg-sky-500/90 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
    </div>
  );
}
