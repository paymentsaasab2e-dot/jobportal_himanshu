'use client';

import { useMemo } from 'react';

type LmsVideoPlayerProps = {
  url?: string | null;
  title?: string;
  className?: string;
};

export function getYoutubeEmbedUrl(raw?: string | null): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com${parsed.pathname}`;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function LmsVideoPlayer({ url, title = 'Course video', className = '' }: LmsVideoPlayerProps) {
  const youtubeEmbed = useMemo(() => getYoutubeEmbedUrl(url), [url]);
  const src = String(url || '').trim();
  if (!src) return null;

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-slate-950 ${className}`}>
      <div className="aspect-video w-full">
        {youtubeEmbed ? (
          <iframe
            src={youtubeEmbed}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video src={src} className="h-full w-full object-contain" controls playsInline preload="metadata" />
        )}
      </div>
    </div>
  );
}
