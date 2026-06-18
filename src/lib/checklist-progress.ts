export interface ChecklistProgress {
  total: number;
  completed: number;
  percent: number;
  isComplete: boolean;
}

export function calcChecklistProgress(
  items: ReadonlyArray<{ completed?: boolean | null }>
): ChecklistProgress {
  const total = items.length;
  const completed = items.filter((item) => item.completed === true).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent, isComplete: total > 0 && completed === total };
}
