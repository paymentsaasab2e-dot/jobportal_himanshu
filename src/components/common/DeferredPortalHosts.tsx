'use client';

/**
 * Mounts non-critical global hosts after first paint / idle time so the
 * initial route is not blocked by chat sync, gossips, suggestions, etc.
 */
import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const FloatingAlertsHost = dynamic(
  () =>
    import('@/components/common/FloatingAlertsHost').then((m) => ({
      default: m.FloatingAlertsHost,
    })),
  { ssr: false },
);
const HryantraChatSyncHost = dynamic(
  () =>
    import('@/components/common/HryantraChatSyncHost').then((m) => ({
      default: m.HryantraChatSyncHost,
    })),
  { ssr: false },
);
const OfficeGossipsSyncHost = dynamic(
  () =>
    import('@/components/common/OfficeGossipsSyncHost').then((m) => ({
      default: m.OfficeGossipsSyncHost,
    })),
  { ssr: false },
);
const HryantraChatFab = dynamic(
  () =>
    import('@/components/common/HryantraChatFab').then((m) => ({
      default: m.HryantraChatFab,
    })),
  { ssr: false },
);
const SuggestionsEngineHost = dynamic(
  () =>
    import('@/components/common/SuggestionsEngineHost').then((m) => ({
      default: m.SuggestionsEngineHost,
    })),
  { ssr: false },
);
const UserActivityTrackerHost = dynamic(
  () =>
    import('@/components/common/UserActivityTrackerHost').then((m) => ({
      default: m.UserActivityTrackerHost,
    })),
  { ssr: false },
);
const PortalNavigationWarmup = dynamic(
  () =>
    import('@/components/common/PortalNavigationWarmup').then((m) => ({
      default: m.PortalNavigationWarmup,
    })),
  { ssr: false },
);

type Tier = 'early' | 'idle';

function useDeferredMount(tier: Tier, delayMs: number) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const enable = () => {
      if (!cancelled) setReady(true);
    };

    if (tier === 'early') {
      timeoutId = setTimeout(enable, delayMs);
    } else if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(() => enable(), { timeout: delayMs });
    } else {
      timeoutId = setTimeout(enable, delayMs);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleId !== undefined && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [tier, delayMs]);

  return ready;
}

function Deferred({
  tier,
  delayMs,
  children,
}: {
  tier: Tier;
  delayMs: number;
  children: ReactNode;
}) {
  const ready = useDeferredMount(tier, delayMs);
  if (!ready) return null;
  return <>{children}</>;
}

export function DeferredPortalHosts() {
  return (
    <>
      {/* Warm caches + alerts soon after paint (notifications / earn nudges). */}
      <Deferred tier="early" delayMs={400}>
        <PortalNavigationWarmup />
        <FloatingAlertsHost />
      </Deferred>

      {/* Chat / social / suggestions / activity — after idle. */}
      <Deferred tier="idle" delayMs={2500}>
        <HryantraChatSyncHost />
        <OfficeGossipsSyncHost />
        <HryantraChatFab />
        <SuggestionsEngineHost />
        <UserActivityTrackerHost />
      </Deferred>
    </>
  );
}
