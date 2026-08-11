'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const LIGHT = {
  page: '#F8FAFC',
  white: '#FFFFFF',
  softBlue: '#EEF2FF',
  softViolet: '#F5F3FF',
  softCyan: '#ECFEFF',
  softOrange: '#FFF7ED',
  softPink: '#FDF4FF',
  softMint: '#F0FDFA',
  softLavender: '#F5F3FF',
  text: '#0F172A',
  muted: '#64748B',
  border: 'rgba(15,23,42,0.08)',
  blue: '#2563EB',
  indigo: '#4F46E5',
  purple: '#7C3AED',
  cyan: '#06B6D4',
  pink: '#EC4899',
  orange: '#F97316',
  green: '#10B981',
};

export function LivePulse({ label = 'LIVE' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}

export function DemoOrLive({ mode }: { mode: string }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
      {mode === 'live' ? 'Live aggregates' : 'Product demonstration'}
    </span>
  );
}

export function AmbientGrid({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-40 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse at center, black 15%, transparent 72%)',
      }}
    />
  );
}

export function SoftGlow({
  className = '',
  color = 'rgba(37,99,235,0.28)',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ background: color }}
    />
  );
}

export function LightBlobs() {
  return (
    <>
      <SoftGlow className="-left-20 top-10 h-80 w-80" color="rgba(37,99,235,0.22)" />
      <SoftGlow className="right-0 top-24 h-96 w-96" color="rgba(124,58,237,0.18)" />
      <SoftGlow className="bottom-10 left-1/3 h-72 w-72" color="rgba(6,182,212,0.18)" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-pink-400/10 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
}

export function GlassPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/70 bg-white/65 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function CountUp({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(reduce ? value : 0);

  React.useEffect(() => {
    if (reduce) {
      setN(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);

  return <span className={className}>{n.toLocaleString()}</span>;
}

export function SectionEyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-600 ${className}`}>
      {children}
    </p>
  );
}
