import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--color-primary-dark)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.025em] text-[var(--color-text)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
