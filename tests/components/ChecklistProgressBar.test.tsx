// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ChecklistProgressBar from '@/components/trips/ChecklistProgressBar';

afterEach(cleanup);

describe('ChecklistProgressBar', () => {
  it('hiển thị trạng thái an toàn khi không có mục nào (total = 0), không NaN%', () => {
    const { container } = render(<ChecklistProgressBar items={[]} />);
    expect(screen.getByText('Chưa có mục nào')).toBeTruthy();
    expect(container.textContent ?? '').not.toContain('NaN');
    expect(container.textContent ?? '').not.toContain('%');
  });

  it('tính đúng phần trăm khi có một phần hoàn thành', () => {
    const items = [
      { completed: true },
      { completed: false },
      { completed: true },
      { completed: false },
    ];
    render(<ChecklistProgressBar items={items} />);
    expect(screen.getByText('2/4 hoàn thành')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('hiển thị "Hoàn thành!" khi tất cả mục đã xong', () => {
    const items = [{ completed: true }, { completed: true }];
    render(<ChecklistProgressBar items={items} />);
    expect(screen.getByText('Hoàn thành!')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('coi giá trị completed null/undefined là chưa hoàn thành', () => {
    const items = [{ completed: null }, { completed: undefined }, { completed: true }];
    render(<ChecklistProgressBar items={items} />);
    expect(screen.getByText('1/3 hoàn thành')).toBeTruthy();
    expect(screen.getByText('33%')).toBeTruthy();
  });
});
