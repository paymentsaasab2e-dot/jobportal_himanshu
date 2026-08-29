'use client';

import { useEffect, useState } from 'react';
import { APP_TIME_ZONE } from '@/lib/i18n';
import {
  USER_TIMEZONE_EVENT,
  getUserTimeZone,
} from '@/lib/user-timezone';

export function useUserTimezone() {
  const [timeZone, setTimeZone] = useState(APP_TIME_ZONE);

  useEffect(() => {
    const sync = () => setTimeZone(getUserTimeZone());
    sync();
    window.addEventListener(USER_TIMEZONE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(USER_TIMEZONE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return timeZone;
}
