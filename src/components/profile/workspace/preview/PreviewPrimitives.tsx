'use client';

import { useState, type ReactNode } from 'react';

export function PreviewMetaItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-0.5 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

export function PreviewMetaGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 2 | 3;
}) {
  const grid =
    cols === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2';
  return (
    <div className={`grid gap-3 sm:gap-4 ${grid}`}>{children}</div>
  );
}

export function PreviewChip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'purple' | 'orange';
}) {
  const tones = {
    neutral: 'border-gray-200 bg-gray-50 text-gray-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    green: 'border-green-200 bg-green-50 text-green-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    purple: 'border-purple-200 bg-purple-50 text-purple-800',
    orange: 'border-orange-200 bg-orange-50 text-orange-900',
  };
  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PreviewChipRow({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function textSnippet(text: string | undefined | null, max = 200): string {
  const t = (text || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

// Helper to parse markdown bold (**text**) and render as JSX
function parseMarkdownBold(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const match = remaining.match(/\*\*(.+?)\*\*/);
    if (!match) {
      parts.push(remaining);
      break;
    }

    const before = remaining.slice(0, match.index);
    const boldText = match[1];
    const after = remaining.slice((match.index ?? 0) + match[0].length);

    if (before) {
      parts.push(before);
    }
    parts.push(<strong key={key++} className="font-semibold text-gray-900">{boldText}</strong>);
    remaining = after;
  }

  return parts;
}

export function PreviewExpandableText({
  text,
  lineClamp = 5,
  className = '',
}: {
  text: string;
  lineClamp?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return <p className="text-sm text-gray-400">—</p>;
  }
  const lines = trimmed.split('\n').length;
  const long = trimmed.length > 320 || lines > lineClamp;

  // Split by newlines and parse each line for markdown bold
  const renderedLines = trimmed.split('\n').map((line, i) => (
    <span key={i}>
      {parseMarkdownBold(line)}
      {i < trimmed.split('\n').length - 1 && <br />}
    </span>
  ));

  return (
    <div className={className}>
      <p
        className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap"
        style={
          !open && long
            ? {
                display: '-webkit-box',
                WebkitLineClamp: lineClamp,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }
            : undefined
        }
      >
        {renderedLines}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-2 text-xs font-semibold text-orange-700 hover:text-orange-800"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}

export function PreviewDocCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
      <svg
        className="h-3.5 w-3.5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      {count} {count === 1 ? 'document' : 'documents'}
    </span>
  );
}

export function PreviewEntryShell({
  children,
  accent = 'blue',
}: {
  children: ReactNode;
  accent?: 'blue' | 'green' | 'purple' | 'orange' | 'amber';
}) {
  const bar = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-1 ${bar[accent]}`} />
      <div className="pl-4 pr-4 py-3 sm:pl-5 sm:pr-4 sm:py-3.5">{children}</div>
    </div>
  );
}
