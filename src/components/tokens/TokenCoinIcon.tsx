'use client';

import Image from 'next/image';

type TokenCoinIconProps = {
  className?: string;
  /** Accepted so this can drop in for LucideIcon usages */
  strokeWidth?: number;
  alt?: string;
};

/** Brand coin asset used for token balance / spend UI. */
export function TokenCoinIcon({
  className = 'h-4 w-4',
  alt = '',
}: TokenCoinIconProps) {
  // Parse common Tailwind size classes for next/image width/height fallbacks
  const sizeMatch = className.match(/h-\[(\d+(?:\.\d+)?)px\]/) || className.match(/h-(\d+(?:\.\d+)?)/);
  const sizeMap: Record<string, number> = {
    '3.5': 14,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 28,
    'full': 16,
  };
  let px = 16;
  if (sizeMatch) {
    if (sizeMatch[0].includes('px')) {
      px = Math.round(Number(sizeMatch[1])) || 16;
    } else {
      px = sizeMap[sizeMatch[1]] ?? 16;
    }
  }

  return (
    <Image
      src="/icons/coin.png"
      alt={alt}
      width={px}
      height={px}
      className={`inline-block object-contain ${className}`}
      aria-hidden={alt ? undefined : true}
    />
  );
}
