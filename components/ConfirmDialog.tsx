'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from './Spinner';

interface Props {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: 'danger' | 'default';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busy = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmCls =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-zinc-900 hover:bg-zinc-800';
  const iconBg =
    tone === 'danger' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="fade-in w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl outline-none"
      >
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <AlertTriangle size={18} />
          </span>
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-zinc-900">
              {title}
            </h2>
            {description && (
              <div className="mt-1 text-sm text-zinc-600">{description}</div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmCls}`}
          >
            {busy && <Spinner size={14} />}
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
