import CardSkeleton from './CardSkeleton';

interface PageSkeletonProps {
  count?: number;
  variant?: 'horizontal' | 'vertical';
}

export default function PageSkeleton({ count = 6, variant = 'vertical' }: PageSkeletonProps): React.JSX.Element {
  const items = Array.from({ length: count }, (_, index) => index);
  const gridClassName = variant === 'horizontal'
    ? 'grid grid-cols-1 gap-4 xl:grid-cols-2'
    : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className={gridClassName} role="status" aria-label="Dang tai du lieu">
      {items.map((item) => (
        <CardSkeleton key={item} variant={variant} />
      ))}
    </div>
  );
}
