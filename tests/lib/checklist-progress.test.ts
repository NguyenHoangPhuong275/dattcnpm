import { describe, it, expect } from 'vitest';
import { calcChecklistProgress } from '@/lib/checklist-progress';

describe('calcChecklistProgress', () => {
  it('checklist rỗng → 0%, không NaN, không chia 0', () => {
    const result = calcChecklistProgress([]);
    expect(result).toEqual({ total: 0, completed: 0, percent: 0, isComplete: false });
    expect(Number.isNaN(result.percent)).toBe(false);
  });

  it('3/5 hoàn thành → 60%', () => {
    const items = [
      { completed: true },
      { completed: true },
      { completed: true },
      { completed: false },
      { completed: false },
    ];
    const result = calcChecklistProgress(items);
    expect(result.completed).toBe(3);
    expect(result.total).toBe(5);
    expect(result.percent).toBe(60);
    expect(result.isComplete).toBe(false);
  });

  it('5/5 hoàn thành → 100% và isComplete', () => {
    const items = Array.from({ length: 5 }, () => ({ completed: true }));
    const result = calcChecklistProgress(items);
    expect(result.percent).toBe(100);
    expect(result.isComplete).toBe(true);
  });

  it('0/5 hoàn thành → 0%', () => {
    const items = Array.from({ length: 5 }, () => ({ completed: false }));
    const result = calcChecklistProgress(items);
    expect(result.percent).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  it('coi null/undefined như chưa hoàn thành', () => {
    const result = calcChecklistProgress([{ completed: null }, { completed: undefined }, { completed: true }]);
    expect(result.completed).toBe(1);
    expect(result.percent).toBe(33);
  });
});
