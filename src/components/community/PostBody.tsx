'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CommunityPost } from '@/lib/community-store';

const CAPTION_PREVIEW_CHARS = 140;

/** Caption under media — collapses long text with Read more. */
export function ExpandableCaption({
  text,
  className = '',
}: {
  text?: string | null;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const value = (text || '').trim();
  if (!value) return null;

  const needsToggle = value.length > CAPTION_PREVIEW_CHARS;
  const shown =
    !needsToggle || expanded
      ? value
      : `${value.slice(0, CAPTION_PREVIEW_CHARS).trimEnd()}…`;

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap text-[14px] leading-[1.55] text-slate-700">{shown}</p>
      {needsToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[12px] font-semibold text-[#28A8E1] hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </div>
  );
}

/** Full image/video in frame — centered, not cropped. */
export function ContainedPostMedia({
  post,
  className = '',
  compact = false,
  tight = false,
}: {
  post: CommunityPost;
  className?: string;
  /** Smaller media for Events / side feeds */
  compact?: boolean;
  /** Extra-compact for Events feed (fits more of the card in one viewport) */
  tight?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const urls =
    post.mediaUrls && post.mediaUrls.length > 0
      ? post.mediaUrls
      : post.mediaUrl
        ? [post.mediaUrl]
        : [];
  const mediaMax = tight
    ? 'max-h-[min(28vh,200px)]'
    : compact
      ? 'max-h-[min(42vh,320px)]'
      : 'max-h-[min(70vh,520px)]';

  if (urls.length === 0) return null;

  if (post.type === 'video') {
    return (
      <div
        className={`overflow-hidden rounded-[18px] bg-[#062E5F] ${className}`}
      >
        <video
          src={urls[0]}
          controls
          className={`mx-auto w-full object-contain ${mediaMax}`}
        />
      </div>
    );
  }

  if (post.type === 'voice') {
    return (
      <div
        className={`rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-3 ${className}`}
      >
        <audio src={urls[0]} controls className="w-full" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] bg-[#F1F5F9] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[idx] || urls[0]}
        alt=""
        className={`mx-auto w-full object-contain object-center ${mediaMax}`}
      />
      {urls.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i === 0 ? urls.length - 1 : i - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i + 1) % urls.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === idx ? 'bg-[#28A8E1]' : 'bg-slate-400/60'
                }`}
              />
            ))}
          </div>
          <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
            {idx + 1}/{urls.length}
          </span>
        </>
      ) : null}
    </div>
  );
}
