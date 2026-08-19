'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import {
  ensureHryantraVerifiedChat,
  getHryantraVerifiedChat,
  openHryantraVerifiedChatInApp,
} from '@/lib/hryantra-verified-chat-store';
import { AppLocale, localizePath, stripLocaleFromPathname } from '@/lib/i18n';

type ChatUpdatedDetail = {
  chatId?: string;
  userId?: string;
  unreadCount?: number;
  lastMessagePreview?: string;
  fromSystem?: boolean;
};

type FabPos = { x: number; y: number };

const HRYANTRA_AVATAR = '/fs.png';
const SHAKE_STYLE_ID = 'hryantra-fab-shake-style';
const POS_KEY = 'saasa:hryantra-fab-pos';
const FAB_SIZE = 56;
const EDGE = 12;
const DRAG_THRESHOLD = 8;

function defaultPos(): FabPos {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: Math.max(EDGE, window.innerWidth - FAB_SIZE - 24),
    y: Math.max(EDGE, Math.round(window.innerHeight / 2 - FAB_SIZE / 2)),
  };
}

function clampPos(pos: FabPos): FabPos {
  if (typeof window === 'undefined') return pos;
  const maxX = Math.max(EDGE, window.innerWidth - FAB_SIZE - EDGE);
  const maxY = Math.max(EDGE, window.innerHeight - FAB_SIZE - EDGE);
  return {
    x: Math.min(maxX, Math.max(EDGE, pos.x)),
    y: Math.min(maxY, Math.max(EDGE, pos.y)),
  };
}

function loadPos(): FabPos {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return defaultPos();
    const parsed = JSON.parse(raw) as FabPos;
    if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return defaultPos();
    return clampPos(parsed);
  } catch {
    return defaultPos();
  }
}

function savePos(pos: FabPos) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify(clampPos(pos)));
  } catch {
    /* ignore */
  }
}

/**
 * Floating HRYantra chat — hold & drag to move; tap to open chat.
 * Position is remembered. Hidden on Office Gossips Chat tab.
 * Only shown when the user is logged in.
 */
export function HryantraChatFab() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const userId = user?.id || null;
  const loggedIn = Boolean(token && isAuthenticated && userId);
  const router = useRouter();
  const pathname = usePathname() || '/';
  const locale = (pathname.split('/').filter(Boolean)[0] || 'en') as AppLocale;
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [shake, setShake] = useState(false);
  const [ogTab, setOgTab] = useState<string | null>(null);
  const [pos, setPos] = useState<FabPos>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const prevUnreadRef = useRef(0);

  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    pointerId: number;
  } | null>(null);
  const posRef = useRef(pos);
  posRef.current = pos;

  const refreshUnread = useCallback(() => {
    if (!userId) {
      setUnread(0);
      prevUnreadRef.current = 0;
      return;
    }
    const thread = getHryantraVerifiedChat(userId) || ensureHryantraVerifiedChat(userId);
    const next = thread?.unreadCount || 0;
    setUnread(next);
    prevUnreadRef.current = next;
  }, [userId]);

  useEffect(() => {
    setMounted(true);
    setPos(loadPos());
    if (typeof document === 'undefined') return;
    if (document.getElementById(SHAKE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SHAKE_STYLE_ID;
    style.textContent = `
      @keyframes hry-fab-shake {
        0%, 100% { transform: translateX(0) rotate(0deg); }
        20% { transform: translateX(-3px) rotate(-4deg); }
        40% { transform: translateX(3px) rotate(4deg); }
        60% { transform: translateX(-2px) rotate(-2deg); }
        80% { transform: translateX(2px) rotate(2deg); }
      }
      .hry-fab-shake {
        animation: hry-fab-shake 0.55s ease-in-out 2;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const bare = stripLocaleFromPathname(pathname);
    const onCommunity = bare === '/community' || bare.startsWith('/community/');
    if (!onCommunity) setOgTab(null);

    const onTab = (event: Event) => {
      const tab = (event as CustomEvent<{ tab?: string }>).detail?.tab;
      setOgTab(tab || null);
    };
    window.addEventListener('saasa:og-tab-changed', onTab as EventListener);
    return () => window.removeEventListener('saasa:og-tab-changed', onTab as EventListener);
  }, [pathname]);

  useEffect(() => {
    if (!loggedIn || !userId) {
      setUnread(0);
      prevUnreadRef.current = 0;
      return;
    }
    refreshUnread();

    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ChatUpdatedDetail>).detail;
      if (detail?.userId && detail.userId !== userId) return;

      let nextUnread = prevUnreadRef.current;
      if (typeof detail?.unreadCount === 'number') {
        nextUnread = detail.unreadCount;
        setUnread(nextUnread);
      } else {
        const thread = getHryantraVerifiedChat(userId);
        nextUnread = thread?.unreadCount || 0;
        setUnread(nextUnread);
      }

      // New / more unread → shake FAB; FloatingAlertsHost stacks the alert card
      if (nextUnread > prevUnreadRef.current) {
        setShake(true);
        window.setTimeout(() => setShake(false), 1200);
      }
      prevUnreadRef.current = nextUnread;
    };

    window.addEventListener('saasa:hryantra-chat-updated', onUpdated as EventListener);
    return () => {
      window.removeEventListener('saasa:hryantra-chat-updated', onUpdated as EventListener);
    };
  }, [loggedIn, userId, refreshUnread]);

  const openChat = () => {
    if (!loggedIn || !userId) return;
    openHryantraVerifiedChatInApp(userId);
    try {
      sessionStorage.setItem('saasa:og-tab', 'chat');
    } catch {
      /* ignore */
    }
    const bare = stripLocaleFromPathname(pathname);
    if (bare === '/community' || bare.startsWith('/community/')) {
      window.dispatchEvent(
        new CustomEvent('saasa:og-open-tab', { detail: { tab: 'chat' } }),
      );
      return;
    }
    router.push(`${localizePath('/community', locale)}?tab=chat`);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      originX: posRef.current.x,
      originY: posRef.current.y,
      pointerId: e.pointerId,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setPos(clampPos({ x: drag.originX + dx, y: drag.originY + dy }));
  };

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const wasDrag = drag.moved;
    dragRef.current = null;
    setDragging(false);
    if (wasDrag) {
      savePos(posRef.current);
      return;
    }
    openChat();
  };

  // Logged-out / loading: never show the floating chat icon
  if (!mounted || isLoading || !loggedIn) {
    return null;
  }

  const barePath = stripLocaleFromPathname(pathname);
  const onLiveInterviewRoom = barePath.startsWith('/lms/interview-prep/live-room');
  const onLanding = barePath === '/' || barePath === '';
  const onCommunity =
    barePath === '/community' || barePath.startsWith('/community/');
  const onApply =
    barePath === '/apply' || barePath.startsWith('/apply/');
  const onSearchJobs =
    barePath === '/searchjobs' || barePath.startsWith('/searchjobs/');
  const onCourses =
    barePath === '/courses' || barePath.startsWith('/courses/');
  const onPublicMarketing =
    barePath === '/employers' ||
    barePath.startsWith('/employers/') ||
    barePath === '/events' ||
    barePath.startsWith('/events/') ||
    barePath === '/services' ||
    barePath.startsWith('/services/') ||
    barePath === '/ats-check' ||
    barePath === '/explore-jobs' ||
    barePath.startsWith('/explore-jobs/') ||
    barePath === '/aboutus' ||
    barePath === '/contact' ||
    barePath === '/help' ||
    barePath === '/faq' ||
    barePath === '/privacypolicy' ||
    barePath === '/terms' ||
    barePath === '/trust-safety' ||
    barePath === '/candmain' ||
    barePath.startsWith('/candmain/') ||
    barePath === '/sa' ||
    barePath.startsWith('/sa/') ||
    barePath === '/login' ||
    barePath === '/signup' ||
    barePath === '/whatsapp' ||
    barePath.startsWith('/whatsapp/');
  // Hide on landing, public/marketing pages, apply flows, while already reading Chat, or when everything is read
  if (
    onLanding ||
    onLiveInterviewRoom ||
    onSearchJobs ||
    onCourses ||
    onApply ||
    onPublicMarketing ||
    (onCommunity && ogTab === 'chat') ||
    unread <= 0
  ) {
    return null;
  }

  const badge = unread > 99 ? '99+' : String(unread);

  return createPortal(
    <div
      className="pointer-events-none fixed z-[10050]"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className={`pointer-events-auto relative inline-flex touch-none select-none ${
          shake && !dragging ? 'hry-fab-shake' : ''
        } ${dragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="button"
        tabIndex={0}
        aria-label={`HRYantra chat, ${unread} unread`}
        title="Hold & drag to move · Tap to open chat"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openChat();
          }
        }}
      >
        <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HRYANTRA_AVATAR}
            alt="HRYantra"
            className="pointer-events-none h-full w-full object-cover"
            draggable={false}
          />
        </span>
        <span className="pointer-events-none absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-white">
          {badge}
        </span>
      </div>
    </div>,
    document.body,
  );
}
