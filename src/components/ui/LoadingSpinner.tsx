interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeClassName: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-4',
};

export default function LoadingSpinner({
  size = 'md',
  label = 'Đang tải',
  className = '',
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClassName[size]} ${className}`}
      role="status"
      aria-label={label}
    />
  );
}
