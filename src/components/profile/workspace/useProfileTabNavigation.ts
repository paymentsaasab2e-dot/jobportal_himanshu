'use client';

import type { CSSProperties } from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

function getHeaderHeightPx(): number {
  if (typeof window === 'undefined') return 92;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--app-header-height')
    .trim();
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 92;
}

export type ProfileSectionGroup = {
  id: string;
  label: string;
  sections: string[];
};

/**
 * Tab navigation for the profile page using document scroll (no nested scroll pane).
 * Active tab follows visible section group while the user scrolls the page.
 */
export function useProfileTabNavigation(sectionGroups: readonly ProfileSectionGroup[]) {
  const tabsBarRef = useRef<HTMLDivElement | null>(null);
  const [scrollPadPx, setScrollPadPx] = useState(160);
  const tabGroupIds = useMemo(
    () => sectionGroups.map((g) => g.id),
    [sectionGroups],
  );
  const [activeTabId, setActiveTabId] = useState<string>(tabGroupIds[0] ?? '');

  useLayoutEffect(() => {
    const el = tabsBarRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const updatePad = () => {
      const tabsH = el.getBoundingClientRect().height;
      setScrollPadPx(Math.round(getHeaderHeightPx() + tabsH + 16));
    };
    const ro = new ResizeObserver(updatePad);
    ro.observe(el);
    updatePad();
    return () => ro.disconnect();
  }, []);

  const scrollToTabGroup = useCallback((id: string) => {
    const groupEl = document.getElementById(id);
    if (!groupEl) return;

    setActiveTabId(id);
    const tabsH = tabsBarRef.current?.getBoundingClientRect().height ?? 0;
    const offset = getHeaderHeightPx() + tabsH + 12;
    const top =
      groupEl.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (sectionGroups.length === 0) return;

    const resolveActiveGroup = () => {
      const tabsH = tabsBarRef.current?.getBoundingClientRect().height ?? 0;
      const activationPoint = getHeaderHeightPx() + tabsH + 24;

      let activeGroupId = sectionGroups[0].id;

      for (const group of sectionGroups) {
        const el = document.getElementById(group.id);
        if (el && el.getBoundingClientRect().top <= activationPoint) {
          activeGroupId = group.id;
        } else if (el) {
          break;
        }
      }

      setActiveTabId((prev) => (prev === activeGroupId ? prev : activeGroupId));
    };

    const onScroll = () => resolveActiveGroup();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resolveActiveGroup);
    resolveActiveGroup();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resolveActiveGroup);
    };
  }, [sectionGroups]);

  return {
    tabsBarRef,
    activeTabId,
    scrollToTabGroup,
    scrollPadPx,
    scrollPaddingStyle: {
      ['--profile-scroll-pad' as string]: `${scrollPadPx}px`,
    } as CSSProperties,
  };
}
