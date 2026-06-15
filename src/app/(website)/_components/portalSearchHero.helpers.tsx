'use client';

import { AppLocale, localizePath } from '@/lib/i18n';

export const getSuggestionLabel = (suggestion: any) =>
  suggestion?.title ||
  suggestion?.name ||
  suggestion?.label ||
  suggestion?.value ||
  suggestion?.query ||
  '';

export const scoreMatch = (label: string, query: string): number => {
  if (!query || !label) return 0;
  const l = label.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (l.startsWith(q)) return 3;
  if (l.split(/[\s,/\-_]+/).some((w) => w.startsWith(q))) return 2;
  if (l.includes(q)) return 1;
  return 0;
};

export function HighlightMatch({ label, query }: { label: string; query: string }) {
  if (!query.trim()) return <>{label}</>;
  const idx = label.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, idx)}
      <span className="font-black text-sky-600">{label.slice(idx, idx + query.trim().length)}</span>
      {label.slice(idx + query.trim().length)}
    </>
  );
}

export const buildSearchJobsUrl = (locale: AppLocale, title: string, location: string) => {
  const params = new URLSearchParams();
  const normalizedTitle = title.trim();
  const normalizedLocation = location.trim();

  if (normalizedTitle) params.append('q', normalizedTitle);
  if (normalizedLocation) params.append('location', normalizedLocation);

  const basePath = localizePath('/searchjobs', locale);
  return params.toString() ? `${basePath}?${params.toString()}` : basePath;
};

export const portalSearchHeroStyles = `
  @keyframes slideAndStay {
    0% { transform: translateY(100%) rotateX(-90deg); opacity: 0; }
    14% { transform: translateY(0) rotateX(0deg); opacity: 1; }
    86% { transform: translateY(0) rotateX(0deg); opacity: 1; }
    100% { transform: translateY(-100%) rotateX(90deg); opacity: 0; }
  }
  @keyframes circuitFill {
    0% { stroke-dashoffset: 2000; }
    100% { stroke-dashoffset: 0; }
  }
  .animate-circuit-fill {
    animation: circuitFill 10s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  }
  .rolling-text {
    display: inline-block;
    perspective: 1200px;
    height: 1.5em;
    overflow: hidden;
    vertical-align: middle;
    width: 100%;
    text-align: left;
  }
  .rolling-word {
    display: block;
    animation: slideAndStay 3s cubic-bezier(0.19, 1, 0.22, 1) forwards;
    transform-origin: left center -10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }
`;
