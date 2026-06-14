import Link from 'next/link';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
}: EmptyStateProps): React.JSX.Element {
  const actionClassName = 'inline-flex items-center justify-center rounded-lg bg-[var(--color-primary-dark)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-darker)]';

  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-12 text-center">
      {icon && <div className="mb-3 flex justify-center text-[var(--color-primary-dark)]">{icon}</div>}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className={`mt-4 ${actionClassName}`}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button type="button" onClick={onAction} className={`mt-4 ${actionClassName}`}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
