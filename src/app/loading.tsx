'use client';

import { usePathname } from 'next/navigation';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { stripLocaleFromPathname } from '@/lib/i18n';

export default function Loading() {
  const pathname = usePathname();
  const normalizedPath = stripLocaleFromPathname(pathname || '/');

  if (normalizedPath === '/') {
    return null;
  }

  return <GlobalLoader />;
}
