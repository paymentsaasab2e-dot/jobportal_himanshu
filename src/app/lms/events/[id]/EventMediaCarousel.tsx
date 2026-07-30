'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

export type EventMediaItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  name?: string;
};

type EventMediaCarouselProps = {
  media: EventMediaItem[];
  title: string;
};

export function EventMediaCarousel({ media, title }: EventMediaCarouselProps) {
  const items = useMemo(() => media.filter((item) => item?.url), [media]);
  const [index, setIndex] = useState(0);

  if (!items.length) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-[1.75rem] border border-[#e8dfd3] bg-gradient-to-br from-[#faf7f2] via-white to-[#eef4fb] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.25)]">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
            <ImageIcon className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Event gallery coming soon</p>
        </div>
      </div>
    );
  }

  const active = items[index] ?? items[0];
  const hasMultiple = items.length > 1;

  function goPrev() {
    setIndex((current) => (current - 1 + items.length) % items.length);
  }

  function goNext() {
    setIndex((current) => (current + 1) % items.length);
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e8dfd3] bg-[#0f172a] shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)]">
      <div className="relative aspect-[16/10] w-full bg-slate-900">
        {active.type === 'video' ? (
          <video
            key={active.id}
            src={active.url}
            className="h-full w-full object-cover"
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active.url} alt={active.name || title} className="h-full w-full object-cover" />
        )}

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
              aria-label="Previous media"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg transition hover:bg-white"
              aria-label="Next media"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {items.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(dotIndex)}
                className={`h-2.5 rounded-full transition ${
                  dotIndex === index ? 'w-7 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Show media ${dotIndex + 1}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 border-t border-white/10 bg-[#111827]/95 p-3 sm:grid-cols-6">
            {items.map((item, thumbIndex) => (
              <button
                key={`${item.id}-thumb`}
                type="button"
                onClick={() => setIndex(thumbIndex)}
                className={`relative overflow-hidden rounded-xl border-2 transition ${
                  thumbIndex === index ? 'border-white' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <video src={item.url} className="aspect-[4/3] w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" className="aspect-[4/3] w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
