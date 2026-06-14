export type CardSkeletonVariant = 'card' | 'horizontal' | 'compact' | 'vertical';

interface CardSkeletonProps {
  variant?: CardSkeletonVariant;
}

export default function CardSkeleton({ variant = 'card' }: CardSkeletonProps): React.JSX.Element {
  if (variant === 'horizontal') {
    return (
      <div className="grid min-h-[96px] grid-cols-[80px_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-hidden="true">
        <div className="animate-pulse bg-slate-100" />
        <div className="space-y-3 p-4">
          <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-hidden="true">
        <div className="space-y-3">
          <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-hidden="true">
      <div className="h-48 animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
