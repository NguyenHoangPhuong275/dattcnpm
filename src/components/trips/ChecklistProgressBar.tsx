'use client';

import { calcChecklistProgress } from '@/lib/checklist-progress';

interface ChecklistItemLike {
  completed?: boolean | null;
}

interface ChecklistProgressBarProps {
  items: ReadonlyArray<ChecklistItemLike>;
}

export default function ChecklistProgressBar({ items }: ChecklistProgressBarProps): React.JSX.Element {
  const { total, completed, percent, isComplete } = calcChecklistProgress(items);

  if (total === 0) {
    return (
      <div className="text-sm font-medium text-[var(--color-text-muted)]">Chưa có mục nào</div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className={isComplete ? 'text-[var(--color-success)]' : 'text-[var(--color-text-secondary)]'}>
          {isComplete ? 'Hoàn thành!' : `${completed}/${total} hoàn thành`}
        </span>
        <span className="text-[var(--color-text-muted)]">{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary-darker)]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
