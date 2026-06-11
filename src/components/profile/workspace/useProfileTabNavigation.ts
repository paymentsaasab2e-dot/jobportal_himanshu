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

type ScrollAnchor = {
  elementId: string;
  tabId: string;
};

function buildScrollAnchors(
  sectionGroups: readonly ProfileSectionGroup[],
): ScrollAnchor[] {
  const anchors: ScrollAnchor[] = [];
  const seen = new Set<string>();

  for (const group of sectionGroups) {
    if (!seen.has(group.id)) {
      anchors.push({ elementId: group.id, tabId: group.id });
      seen.add(group.id);
    }

    for (const sectionId of group.sections) {
      if (seen.has(sectionId)) continue;
      anchors.push({ elementId: sectionId, tabId: group.id });
      seen.add(sectionId);
    }
  }

  return anchors;
}

function findScrollTarget(
  sectionGroups: readonly ProfileSectionGroup[],
  tabId: string,
): HTMLElement | null {
  const group = sectionGroups.find((entry) => entry.id === tabId);
  if (!group) return document.getElementById(tabId);

  const candidateIds = [group.id, ...group.sections];
  for (const elementId of candidateIds) {
    const el = document.getElementById(elementId);
    if (el) return el;
  }

  return null;
}

/**
 * Tab navigation for the profile page using document scroll (no nested scroll pane).
 * Active tab follows visible section group while the user scrolls the page.
 */
export function useProfileTabNavigation(
  sectionGroups: readonly ProfileSectionGroup[],
  contentReady = true,
) {
  const tabsBarRef = useRef<HTMLDivElement | null>(null);
  const [scrollPadPx, setScrollPadPx] = useState(160);
  const scrollAnchors = useMemo(
    () => buildScrollAnchors(sectionGroups),
    [sectionGroups],
  );
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
      setScrollPadPx(Math.round(getHeaderHeightPx() + tabsH + 12));
    };
    const ro = new ResizeObserver(updatePad);
    ro.observe(el);
    updatePad();
    return () => ro.disconnect();
  }, []);

  const scrollToTabGroup = useCallback(
    (id: string) => {
      const groupEl = findScrollTarget(sectionGroups, id);
      if (!groupEl) return;

      setActiveTabId(id);
      const tabsH = tabsBarRef.current?.getBoundingClientRect().height ?? 0;
      const offset = getHeaderHeightPx() + tabsH + 8;
      const top =
        groupEl.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: 'smooth',
      });
    },
    [sectionGroups],
  );

  useEffect(() => {
    if (sectionGroups.length === 0 || !contentReady) return;

    const resolveActiveGroup = () => {
      const tabsH = tabsBarRef.current?.getBoundingClientRect().height ?? 0;
      const activationPoint = getHeaderHeightPx() + tabsH + 20;

      let activeGroupId = sectionGroups[0].id;

      for (const anchor of scrollAnchors) {
        const el = document.getElementById(anchor.elementId);
        if (el && el.getBoundingClientRect().top <= activationPoint) {
          activeGroupId = anchor.tabId;
        } else if (el) {
          break;
        }
      }

      setActiveTabId((prev) => (prev === activeGroupId ? prev : activeGroupId));
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        resolveActiveGroup();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resolveActiveGroup);
    resolveActiveGroup();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resolveActiveGroup);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [sectionGroups, scrollAnchors, contentReady]);

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
