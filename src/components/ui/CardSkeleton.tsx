interface CardSkeletonProps {
  variant?: 'horizontal' | 'vertical';
}

export default function CardSkeleton({ variant = 'vertical' }: CardSkeletonProps): React.JSX.Element {
  if (variant === 'horizontal') {
    return (
      <div className="grid min-h-[176px] grid-cols-[132px_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-[168px_minmax(0,1fr)]" aria-hidden="true">
        <div className="animate-pulse bg-slate-100" />
        <div className="space-y-3 p-4">
          <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
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
