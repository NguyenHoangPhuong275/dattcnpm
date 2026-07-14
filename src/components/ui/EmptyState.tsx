'use client';

import React from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
  idPrefix?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  idPrefix,
}: EmptyStateProps): React.JSX.Element {
  const generatedId = React.useId().replace(/:/g, '');
  const actionId = `${idPrefix ?? `empty-state-${generatedId}`}-action`;
  const actionClassName = 'inline-flex items-center justify-center rounded-lg bg-[var(--color-primary-dark)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[var(--color-primary-darker)]';

  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border-strong)] px-4 py-12 text-center">
      {icon && <div className="mb-3 flex justify-center text-[var(--color-primary-dark)]">{icon}</div>}
      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>}
      {actionLabel && actionHref && (
        <Link id={actionId} href={actionHref} className={`mt-4 ${actionClassName}`}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button id={actionId} type="button" onClick={onAction} className={`mt-4 ${actionClassName}`}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
