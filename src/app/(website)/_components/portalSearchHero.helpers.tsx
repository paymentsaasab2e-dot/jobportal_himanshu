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

export function computeShineRingMetrics(
  width: number,
  height: number,
  isPill: boolean,
) {
  const stroke = 2;
  const x = stroke / 2;
  const y = stroke / 2;
  const rw = width - stroke;
  const rh = height - stroke;
  const radius = isPill
    ? Math.max(16, rh / 2)
    : Math.max(16, Math.min(32, rh / 2));
  const r = Math.min(radius, rw / 2, rh / 2);
  const perimeter =
    2 * (rw - 2 * r) + 2 * (rh - 2 * r) + 2 * Math.PI * r;
  const beam = Math.min(210, Math.max(140, perimeter * 0.16));
  const gap = Math.max(0, perimeter - beam);
  return { width, height, x, y, rw, rh, r, perimeter, beam, gap };
}

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

  /* iPhone-style glassmorphic category panel */
  .category-glass-scene {
    position: relative;
    isolation: isolate;
    border-radius: 36px;
    padding: 1.5rem;
    background: linear-gradient(
      145deg,
      rgba(186, 230, 253, 0.35) 0%,
      rgba(233, 213, 255, 0.28) 45%,
      rgba(254, 205, 211, 0.22) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.65);
    box-shadow:
      0 24px 64px rgba(40, 168, 225, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .category-glass-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(48px);
    pointer-events: none;
    z-index: 0;
  }

  .category-glass-orb-1 {
    width: 180px;
    height: 180px;
    top: -40px;
    left: 8%;
    background: rgba(56, 189, 248, 0.55);
  }

  .category-glass-orb-2 {
    width: 160px;
    height: 160px;
    top: 20%;
    right: 5%;
    background: rgba(192, 132, 252, 0.45);
  }

  .category-glass-orb-3 {
    width: 200px;
    height: 200px;
    bottom: -60px;
    left: 35%;
    background: rgba(244, 114, 182, 0.38);
  }

  .category-glass-grid {
    position: relative;
    z-index: 1;
  }

  .category-glass-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    text-align: left;
    padding: 1rem 1.25rem;
    border-radius: 22px;
    cursor: pointer;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.72);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.62) 0%,
      rgba(255, 255, 255, 0.28) 100%
    );
    backdrop-filter: blur(22px) saturate(180%);
    -webkit-backdrop-filter: blur(22px) saturate(180%);
    box-shadow:
      0 10px 28px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.95),
      inset 0 -1px 0 rgba(255, 255, 255, 0.25);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 0.35s ease,
      border-color 0.35s ease,
      background 0.35s ease;
  }

  .category-glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      var(--glass-tint, rgba(56, 189, 248, 0.12)) 0%,
      transparent 55%
    );
    opacity: 0.85;
    pointer-events: none;
  }

  .category-glass-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 12%;
    right: 12%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.95),
      transparent
    );
    pointer-events: none;
  }

  .category-glass-card:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: rgba(255, 255, 255, 0.95);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.78) 0%,
      rgba(255, 255, 255, 0.38) 100%
    );
    box-shadow:
      0 20px 40px rgba(40, 168, 225, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 1);
  }

  .category-glass-card:active {
    transform: translateY(-1px) scale(0.99);
  }

  .category-glass-icon {
    position: relative;
    z-index: 1;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.75);
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition: transform 0.35s ease;
  }

  .category-glass-card:hover .category-glass-icon {
    transform: scale(1.06);
  }

  .category-glass-label {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    color: rgba(15, 23, 42, 0.88);
    letter-spacing: -0.01em;
    line-height: 1.25;
  }

  .category-glass-chevron {
    position: relative;
    z-index: 1;
    flex-shrink: 0;
    color: rgba(100, 116, 139, 0.55);
    transition: transform 0.3s ease, color 0.3s ease;
  }

  .category-glass-card:hover .category-glass-chevron {
    transform: translateX(3px);
    color: rgba(14, 165, 233, 0.85);
  }

  /* Pill shine border — SVG dash travels along the exact border path */
  .hero-search-shine-wrapper {
    position: relative;
    width: 100%;
    margin-bottom: 3.5rem;
    padding: 2px;
    border-radius: 32px;
    overflow: visible;
    isolation: isolate;
    border: 1.5px solid rgba(186, 230, 253, 0.35);
  }

  @media (min-width: 640px) {
    .hero-search-shine-wrapper {
      border-radius: 9999px;
    }
  }

  .hero-search-shine-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
    z-index: 2;
  }

  .hero-search-shine-track {
    fill: none;
    stroke-linecap: round;
  }

  .hero-search-shine-glow-track {
    stroke-width: 4;
    opacity: 0.5;
    filter: blur(2px);
  }

  .hero-search-shine-beam-track {
    stroke-width: 2;
  }

  .hero-search-shine-inner {
    position: relative;
    z-index: 1;
    border-radius: inherit;
  }

  .hero-search-shine-wrapper--ai {
    border-color: rgba(56, 189, 248, 0.3);
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-search-shine-svg animate {
      display: none;
    }
  }
`;
