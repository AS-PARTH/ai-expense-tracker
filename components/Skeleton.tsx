import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-md bg-linear-to-r from-zinc-200/70 via-zinc-100 to-zinc-200/70 bg-size-[200%_100%]',
        className
      )}
      style={{ animation: 'shimmer 1.4s ease-in-out infinite' }}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx('h-3', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  );
}
