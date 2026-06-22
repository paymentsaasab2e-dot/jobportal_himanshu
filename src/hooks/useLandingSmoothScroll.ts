'use client';

import { useEffect } from 'react';

const LANDING_SCROLL_CLASS = 'candmain-smooth-scroll';
export const LANDING_SCROLL_EVENT = 'landing-smooth-scroll';

type LandingScrollDetail = {
  scroll: number;
  velocity: number;
  direction: number;
};

export function useLandingSmoothScroll() {
  useEffect(() => {
    let lenis: {
      destroy: () => void;
      stop: () => void;
      start: () => void;
      on: (event: string, callback: (payload: LandingScrollDetail) => void) => void;
    } | null = null;
    let disposed = false;
    const root = document.documentElement;

    const init = async () => {
      try {
        const { default: Lenis } = await import('lenis');
        if (disposed) return;

        root.classList.add(LANDING_SCROLL_CLASS);

        lenis = new Lenis({
          autoRaf: true,
          lerp: 0.07,
          smoothWheel: true,
          wheelMultiplier: 0.85,
          touchMultiplier: 1.35,
          syncTouch: true,
          syncTouchLerp: 0.08,
          touchInertiaExponent: 1.6,
          anchors: {
            offset: 96,
            duration: 1.25,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          },
          prevent: (node) =>
            node instanceof Element &&
            Boolean(
              node.closest(
                '[data-lenis-prevent], [data-lenis-prevent-wheel], [data-lenis-prevent-touch], .overflow-y-auto, .overflow-x-auto, .dashboard-scrollbar, .profile-modal-scroll'
              )
            ),
        });

        lenis.on('scroll', ({ scroll, velocity, direction }) => {
          window.dispatchEvent(
            new CustomEvent<LandingScrollDetail>(LANDING_SCROLL_EVENT, {
              detail: { scroll, velocity, direction },
            })
          );
        });

        window.__landingLenis = lenis;
      } catch {
        root.classList.remove(LANDING_SCROLL_CLASS);
      }
    };

    void init();

    return () => {
      disposed = true;
      root.classList.remove(LANDING_SCROLL_CLASS);
      window.__landingLenis = undefined;
      lenis?.destroy();
    };
  }, []);
}

declare global {
  interface Window {
    __landingLenis?: {
      destroy: () => void;
      stop: () => void;
      start: () => void;
      scrollTo: (
        target: number,
        options?: { immediate?: boolean },
      ) => void;
    };
  }
}
