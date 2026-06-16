'use client';

import type { ConfirmOptions } from '@/hooks/useConfirm';

interface AppConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AppConfirmDialog({
  open,
  options,
  onConfirm,
  onCancel,
}: AppConfirmDialogProps): React.JSX.Element | null {
  if (!open || !options) return null;

  const tone = options.tone ?? 'default';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-confirm-title"
      aria-describedby="app-confirm-description"
    >
      <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-xl">
        <h2 id="app-confirm-title" className="font-display text-lg font-bold text-slate-950">
          {options.title}
        </h2>
        <p id="app-confirm-description" className="mt-2 text-sm leading-6 text-slate-600">
          {options.description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            id="app-confirm-cancel-button"
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {options.cancelLabel ?? 'Hủy'}
          </button>
          <button
            id="app-confirm-submit-button"
            type="button"
            onClick={onConfirm}
            className={
              tone === 'danger'
                ? 'rounded-lg bg-[var(--color-danger)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90'
                : 'rounded-lg bg-[var(--color-primary-dark)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-darker)]'
            }
          >
            {options.confirmLabel ?? 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}
