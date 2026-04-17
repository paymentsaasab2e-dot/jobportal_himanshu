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
  const [scrollPadPx, setScrollPadPx] = useState(160);
  const tabGroupIds = useMemo(
    () => sectionGroups.map((g) => g.id),
    [sectionGroups],
  );
  const [activeTabId, setActiveTabId] = useState<string>(tabGroupIds[0] ?? '');
  const sectionToGroupRef = useRef<Map<string, string>>(new Map());
  const orderedSectionIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const sectionToGroup = new Map<string, string>();
    const orderedSectionIds: string[] = [];
    sectionGroups.forEach((group) => {
      group.sections.forEach((sectionId) => {
        sectionToGroup.set(sectionId, group.id);
        orderedSectionIds.push(sectionId);
      });
    });
    sectionToGroupRef.current = sectionToGroup;
    orderedSectionIdsRef.current = orderedSectionIds;
    if (tabGroupIds.length > 0) {
      setActiveTabId((prev) => prev || tabGroupIds[0]);
    }
  }, [sectionGroups, tabGroupIds]);

  useLayoutEffect(() => {
    const el = tabsBarRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    const ro = new ResizeObserver(() => {
      const h = el.getBoundingClientRect().height;
      setScrollPadPx(Math.round(NAVBAR_ESTIMATE_PX + h + 12));
    });
    ro.observe(el);
    const h = el.getBoundingClientRect().height;
    setScrollPadPx(Math.round(NAVBAR_ESTIMATE_PX + h + 12));
    return () => ro.disconnect();
  }, []);

  const scrollToTabGroup = useCallback(
    (id: string) => {
      const targetGroup = sectionGroups.find((group) => group.id === id);
      const firstSectionId = targetGroup?.sections?.[0];
      if (!firstSectionId) return;
      const node = document.getElementById(firstSectionId);
      if (!node) return;
      setActiveTabId(id);
      const top = node.getBoundingClientRect().top + window.scrollY - scrollPadPx;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth',
      });
    },
    [scrollPadPx, sectionGroups],
  );

  useEffect(() => {
    const orderedSectionIds = orderedSectionIdsRef.current;
    if (orderedSectionIds.length === 0 || tabGroupIds.length === 0) return;

    const resolveActiveGroup = () => {
      // Slight forward buffer so tab switches when next subsection is just under sticky tabs.
      const activationBufferPx = 48;
      const y = window.scrollY + scrollPadPx + activationBufferPx;
      let currentSectionId = orderedSectionIds[0];
      for (const sectionId of orderedSectionIds) {
        const el = document.getElementById(sectionId);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) currentSectionId = sectionId;
      }
      const groupId = sectionToGroupRef.current.get(currentSectionId) ?? tabGroupIds[0];
      setActiveTabId((prev) => (prev === groupId ? prev : groupId));
    };

    const observedElements = orderedSectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    resolveActiveGroup();

    const observer = new IntersectionObserver(
      () => resolveActiveGroup(),
      {
        root: null,
        rootMargin: `-${Math.max(120, scrollPadPx)}px 0px -55% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        resolveActiveGroup();
      });
    };

    observedElements.forEach((el) => observer.observe(el));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resolveActiveGroup);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resolveActiveGroup);
    };
  }, [tabGroupIds, scrollPadPx]);

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
