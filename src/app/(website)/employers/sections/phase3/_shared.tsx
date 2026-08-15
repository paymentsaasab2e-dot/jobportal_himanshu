'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function Phase3Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const SHELL: Record<
  string,
  { section: string; glow: string; number: string }
> = {
  workforce: {
    section: 'relative overflow-hidden bg-[#F7FAFC]',
    glow: 'bg-[radial-gradient(ellipse_70%_55%_at_0%_0%,rgba(40,168,225,0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_20%,rgba(15,90,122,0.06),transparent_50%)]',
    number: 'from-[#28A8E1] to-[#0F5A7A]',
  },
  operations: {
    section: 'relative overflow-hidden bg-white',
    glow: 'bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,rgba(40,168,225,0.1),transparent_50%),radial-gradient(ellipse_40%_35%_at_0%_80%,rgba(56,189,248,0.08),transparent_45%)]',
    number: 'from-sky-500 to-cyan-700',
  },
  lifecycle: {
    section: 'relative overflow-hidden bg-[#F4F7FB]',
    glow: 'bg-[radial-gradient(ellipse_65%_50%_at_50%_-10%,rgba(40,168,225,0.12),transparent_55%),radial-gradient(ellipse_40%_30%_at_90%_60%,rgba(15,90,122,0.07),transparent_45%)]',
    number: 'from-[#176F96] to-[#0F5A7A]',
  },
  control: {
    section: 'relative overflow-hidden bg-white',
    glow: 'bg-[radial-gradient(ellipse_55%_45%_at_10%_10%,rgba(15,90,122,0.08),transparent_50%),radial-gradient(ellipse_50%_40%_at_90%_0%,rgba(40,168,225,0.1),transparent_50%)]',
    number: 'from-[#0F5A7A] to-[#28A8E1]',
  },
};

export function Phase3Shell({
  id,
  variant,
  children,
}: {
  id: string;
  variant: keyof typeof SHELL;
  children: React.ReactNode;
}) {
  const theme = SHELL[variant];
  return (
    <section id={id} className={`scroll-mt-28 py-20 md:py-28 ${theme.section}`}>
      <div aria-hidden className={`pointer-events-none absolute inset-0 ${theme.glow}`} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black_0%,transparent_85%)]"
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6">{children}</div>
    </section>
  );
}

export function Phase3SectionHeader({
  number,
  label,
  heading,
  description,
  variant = 'workforce',
}: {
  number: string;
  label: string;
  heading: string;
  description: string;
  variant?: keyof typeof SHELL;
}) {
  const theme = SHELL[variant];
  return (
    <Phase3Reveal className="max-w-3xl">
      <div className="mb-5 inline-flex items-center gap-3">
        <span
          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-gradient-to-br ${theme.number} px-2.5 text-[12px] font-bold tabular-nums text-white shadow-[0_8px_20px_-10px_rgba(40,168,225,0.55)]`}
        >
          {number}
        </span>
        <span className="h-px w-8 bg-slate-200" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          {label}
        </p>
      </div>
      <h2 className="text-[2.35rem] font-semibold tracking-[-0.03em] text-slate-900 md:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
        {heading}
      </h2>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-slate-500 md:text-[17px]">
        {description}
      </p>
    </Phase3Reveal>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId = 'phase3-seg',
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  layoutId?: string;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white/70 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`relative shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors sm:px-5 ${
              active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-slate-900 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.45)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className={`relative z-10 ${active ? 'text-white' : ''}`}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MockFrame({
  children,
  title,
  className = '',
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`group/mock relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_30px_60px_-36px_rgba(15,23,42,0.28)] backdrop-blur-sm ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#28A8E1]/10 blur-3xl transition group-hover/mock:bg-[#28A8E1]/16"
      />
      <div className="relative flex items-center gap-2 border-b border-slate-100/90 bg-gradient-to-r from-slate-50/90 to-white/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        {title ? (
          <span className="ml-3 truncate rounded-md bg-slate-100/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
            {title}
          </span>
        ) : null}
      </div>
      <div className="relative p-4 sm:p-6">{children}</div>
    </div>
  );
}

export function SoftChip({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warn' | 'accent' | 'danger';
}) {
  const tones = {
    neutral: 'bg-slate-100/90 text-slate-600 ring-slate-200/70',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100/80',
    warn: 'bg-amber-50 text-amber-700 ring-amber-100/80',
    accent: 'bg-[#E8F6FC] text-[#176F96] ring-[#28A8E1]/25',
    danger: 'bg-rose-50 text-rose-700 ring-rose-100/80',
  };
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function CapabilityList({ items }: { items: string[] }) {
  return (
    <ul className="mt-7 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-slate-200/70 bg-white/60 px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-[0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm transition hover:border-[#28A8E1]/35 hover:text-[#176F96]"
        >
          {item}
        </li>
      ))}
    </ul>
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
      className={`rounded-[1.5rem] border border-white/80 bg-white/55 p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
