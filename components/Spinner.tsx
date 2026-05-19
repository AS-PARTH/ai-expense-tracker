import { clsx } from 'clsx';

interface Props {
  size?: number;
  className?: string;
  label?: string;
}

export function Spinner({ size = 16, className, label }: Props) {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
        role="status"
        aria-label={label ?? 'Loading'}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          className="opacity-25"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span>{label}</span>}
    </span>
  );
}
