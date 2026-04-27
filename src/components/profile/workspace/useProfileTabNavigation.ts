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

const NAVBAR_ESTIMATE_PX = 80;

export type ProfileSectionGroup = {
  id: string;
  label: string;
  sections: string[];
};

/**
 * Smooth scroll to a tab group with offset (navbar + sticky tab bar).
 * Active tab follows visible section group via IntersectionObserver.
 */
export function useProfileTabNavigation(sectionGroups: readonly ProfileSectionGroup[]) {
  const tabsBarRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollPadPx, setScrollPadPx] = useState(160);
  const tabGroupIds = useMemo(
    () => sectionGroups.map((g) => g.id),
    [sectionGroups],
  );
  const [activeTabId, setActiveTabId] = useState<string>(tabGroupIds[0] ?? '');
  // Map sections to groups and maintain order for detection logic
  const { sectionToGroup, orderedSectionIds } = useMemo(() => {
    const s2g = new Map<string, string>();
    const ids: string[] = [];
    sectionGroups.forEach((group) => {
      group.sections.forEach((sectionId) => {
        s2g.set(sectionId, group.id);
        ids.push(sectionId);
      });
    });
    return { sectionToGroup: s2g, orderedSectionIds: ids };
  }, [sectionGroups]);

  useLayoutEffect(() => {
    const el = tabsBarRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height;
      setScrollPadPx(Math.round(h + 12)); // No navbar estimate needed for internal scroll
    });
    ro.observe(el);
    const h = el.getBoundingClientRect().height;
    setScrollPadPx(Math.round(h + 12));
    return () => ro.disconnect();
  }, []);

  const scrollToTabGroup = useCallback(
    (id: string) => {
      const container = scrollContainerRef.current;
      const groupEl = document.getElementById(id);
      if (!container || !groupEl) return;
      
      setActiveTabId(id);
      const containerTop = container.getBoundingClientRect().top;
      const groupTop = groupEl.getBoundingClientRect().top;
      const scrollOffset = groupTop - containerTop + container.scrollTop - 2; // Exact alignment

      container.scrollTo({
        top: Math.max(0, scrollOffset),
        behavior: 'smooth',
      });
    },
    [sectionGroups],
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || sectionGroups.length === 0) return;

    const resolveActiveGroup = () => {
      const scrollTop = container.scrollTop;
      const activationPoint = scrollTop + 140; // Detection threshold from top
      
      let activeGroupId = sectionGroups[0].id;

      // Find the last section that has reached the activation point
      for (const group of sectionGroups) {
        const el = document.getElementById(group.id);
        if (el) {
          // offsetTop is relative to the "relative" container we just set
          if (el.offsetTop <= activationPoint) {
            activeGroupId = group.id;
          } else {
            break;
          }
        }
      }
      
      setActiveTabId((prev) => (prev === activeGroupId ? prev : activeGroupId));
    };

    const onScroll = () => {
      resolveActiveGroup();
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resolveActiveGroup);

    // Initial check
    resolveActiveGroup();

    return () => {
      container.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resolveActiveGroup);
    };
  }, [sectionGroups, sectionToGroup, orderedSectionIds]);

  return {
    tabsBarRef,
    scrollContainerRef,
    activeTabId,
    scrollToTabGroup,
    scrollPadPx,
    scrollPaddingStyle: {
      ['--profile-scroll-pad' as string]: `${scrollPadPx}px`,
    } as CSSProperties,
  };
}
