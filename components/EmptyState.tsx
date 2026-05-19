import { clsx } from 'clsx';

interface Props {
  text: string;
  hint?: string;
  className?: string;
}

export function EmptyState({ text, hint, className }: Props) {
  return (
    <div
      className={clsx(
        'flex h-[260px] flex-col items-center justify-center rounded-md border border-dashed border-zinc-200 text-center',
        className
      )}
    >
      <p className="text-sm text-zinc-500">{text}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
