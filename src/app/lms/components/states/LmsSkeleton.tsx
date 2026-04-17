type LmsSkeletonProps = {
  lines?: number;
  className?: string;
};

export function LmsSkeleton({ lines = 3, className = '' }: LmsSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 rounded bg-gray-200/80 ${i === 0 ? 'w-2/3' : i === lines - 1 ? 'w-1/2' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

