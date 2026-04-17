'use client';

import {
  ScanSearch,
  FilePenLine,
  Crosshair,
  UserRoundCheck,
  ClipboardCheck,
  MessageSquareMore,
  GraduationCap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  'scan-search': ScanSearch,
  'file-pen-line': FilePenLine,
  'crosshair': Crosshair,
  'user-round-check': UserRoundCheck,
  'clipboard-check': ClipboardCheck,
  'message-square-more': MessageSquareMore,
  'graduation-cap': GraduationCap,
};

interface ServiceIconProps {
  iconKey: string;
  className?: string;
  strokeWidth?: number;
}

export default function ServiceIcon({ iconKey, className = 'h-5 w-5', strokeWidth = 2 }: ServiceIconProps) {
  const Icon = ICON_MAP[iconKey];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}
