'use client';

import { useState } from 'react';
import Image from 'next/image';

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'CO';
}

export default function CompanyIdentityBadge({
  name,
  logoUrl,
  className = '',
  size = 'md',
}: {
  name: string;
  logoUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(logoUrl?.trim()) && !broken;
  const avatarSize = size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-2xl';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';

  if (showImage) {
    return (
      <div className={`relative shrink-0 overflow-hidden border border-slate-200 bg-white shadow-sm ${avatarSize} ${className}`}>
        <Image
          src={logoUrl as string}
          alt={`${name} logo`}
          fill
          className="object-cover"
          onError={() => setBroken(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-500 font-bold uppercase tracking-wider text-white shadow-sm ${avatarSize} ${className} ${textSize}`}
    >
      {getInitials(name)}
    </div>
  );
}
