'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { PartyPopper, Sparkles, X } from 'lucide-react';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { TOKEN_EARN_EVENT, type TokenEarnDetail } from '@/lib/token-earn-events';

const DISPLAY_MS = 5600;
const COIN_COLORS = ['#F59E0B', '#FBBF24', '#FCD34D', '#28A8E1', '#34D399', '#FB7185'];

function fireCheerBurst() {
  confetti({
    particleCount: 90,
    spread: 78,
    startVelocity: 42,
    origin: { x: 0.5, y: 0.42 },
    colors: COIN_COLORS,
    ticks: 240,
    gravity: 1.05,
    decay: 0.92,
    scalar: 1.05,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      startVelocity: 32,
      origin: { x: 0.35, y: 0.55 },
      colors: COIN_COLORS,
      ticks: 200,
    });
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      startVelocity: 32,
      origin: { x: 0.65, y: 0.55 },
      colors: COIN_COLORS,
      ticks: 200,
    });
  }, 140);
}

function FlyingCoins() {
  const coins = [
    { x: -56, y: -8, delay: 0, size: 'h-5 w-5', rot: -20 },
    { x: 58, y: -18, delay: 0.1, size: 'h-6 w-6', rot: 25 },
    { x: -20, y: -48, delay: 0.18, size: 'h-4 w-4', rot: -8 },
    { x: 72, y: 28, delay: 0.06, size: 'h-3.5 w-3.5', rot: 40 },
    { x: -68, y: 36, delay: 0.26, size: 'h-4 w-4', rot: -35 },
    { x: 24, y: -62, delay: 0.32, size: 'h-5 w-5', rot: 12 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
      {coins.map((c, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-16 -ml-2 drop-shadow-md"
          initial={{ opacity: 0, x: 0, y: 12, scale: 0.4, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, c.x * 0.45, c.x],
            y: [12, c.y - 8, c.y - 40],
            scale: [0.4, 1.08, 0.85],
            rotate: [0, c.rot, c.rot * 1.4],
          }}
          transition={{
            duration: 1.65,
            delay: c.delay,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: 0.85,
          }}
        >
          <TokenCoinIcon className={c.size} />
        </motion.span>
      ))}
    </div>
  );
}

/**
 * Center-screen earn celebration with confetti + animated coins.
 * Listens for saasa:token-earn on any page.
 */
export function EarnCelebrateHost() {
  const [payload, setPayload] = useState<TokenEarnDetail | null>(null);
  const [mounted, setMounted] = useState(false);
  const queueRef = useRef<TokenEarnDetail[]>([]);
  const busyRef = useRef(false);

  const showNext = () => {
    const next = queueRef.current.shift();
    if (!next) {
      busyRef.current = false;
      setPayload(null);
      return;
    }
    busyRef.current = true;
    setPayload(next);
    window.requestAnimationFrame(() => fireCheerBurst());
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onEarn = (event: Event) => {
      const detail = (event as CustomEvent<TokenEarnDetail>).detail;
      if (!detail?.amount || detail.amount <= 0) return;
      queueRef.current.push(detail);
      if (!busyRef.current) showNext();
    };
    window.addEventListener(TOKEN_EARN_EVENT, onEarn);
    return () => window.removeEventListener(TOKEN_EARN_EVENT, onEarn);
  }, []);

  useEffect(() => {
    if (!payload) return;
    const t = window.setTimeout(() => {
      setPayload(null);
      window.setTimeout(showNext, 280);
    }, DISPLAY_MS);
    return () => window.clearTimeout(t);
  }, [payload]);

  const dismiss = () => {
    setPayload(null);
    window.setTimeout(showNext, 220);
  };

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {payload ? (
        <motion.div
          key="earn-celebrate-root"
          className="fixed inset-0 z-[10060] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Dismiss celebration"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[3px]"
            onClick={dismiss}
          />

          <motion.div
            key={`${payload.title}-${payload.amount}-${payload.subtitle || ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Tokens earned"
            initial={{ opacity: 0, y: 28, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 16, stiffness: 340 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.35)]"
          >
            <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-amber-300/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-8 h-36 w-36 rounded-full bg-emerald-300/40 blur-3xl" />

            <FlyingCoins />

            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-amber-800/55 transition hover:bg-amber-100 hover:text-amber-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>

            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-amber-200/70"
                animate={{ scale: [0.88, 1.18, 0.88], opacity: [0.55, 0.18, 0.55] }}
                transition={{ duration: 1.35, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-xl shadow-amber-500/40 ring-4 ring-white"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut' }}
              >
                <TokenCoinIcon className="h-10 w-10" />
              </motion.span>
              <motion.span
                className="absolute -right-1 -top-1"
                animate={{ rotate: [-12, 12, -12], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.85, repeat: Infinity }}
              >
                <PartyPopper className="h-7 w-7 text-rose-500" />
              </motion.span>
              <Sparkles className="absolute -bottom-0.5 -left-1 h-5 w-5 text-amber-500" />
            </div>

            <p className="relative mt-5 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Tokens earned
            </p>
            <motion.p
              className="relative mt-1 flex items-center justify-center gap-2 text-4xl font-black tracking-tight text-slate-900"
              initial={{ opacity: 0, scale: 0.65 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 14, delay: 0.06 }}
            >
              <span className="text-emerald-600">+</span>
              <TokenCoinIcon className="h-8 w-8" />
              <span>{payload.amount}</span>
            </motion.p>
            <p className="relative mt-2 text-lg font-bold text-slate-900">
              {payload.title || 'Nice work — credit added'}
            </p>
            {payload.subtitle ? (
              <p className="relative mt-1 text-sm text-slate-600">{payload.subtitle}</p>
            ) : null}

            {payload.items && payload.items.length > 1 ? (
              <ul className="relative mt-4 max-h-28 space-y-1.5 overflow-y-auto text-left">
                {payload.items.map((item, i) => (
                  <li
                    key={`${item.label}-${i}`}
                    className="flex items-center justify-between rounded-xl bg-white/85 px-3 py-2 text-xs text-slate-600 ring-1 ring-amber-100"
                  >
                    <span className="truncate font-medium">{item.label || 'Reward'}</span>
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600">
                      +<TokenCoinIcon className="h-3.5 w-3.5" />
                      {item.amount || 0}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              onClick={dismiss}
              className="relative mt-5 w-full rounded-full bg-(--brand-primary) px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:opacity-95"
            >
              Awesome
            </button>

            <motion.div className="relative mt-4 h-1 overflow-hidden rounded-full bg-amber-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: DISPLAY_MS / 1000, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
