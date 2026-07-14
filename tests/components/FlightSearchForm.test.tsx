// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import FlightSearchForm from '@/components/flights/FlightSearchForm';

afterEach(cleanup);

describe('FlightSearchForm route initialization', () => {
  it('initializes the route from normalized query values and submits the same route', () => {
    const onSearch = vi.fn();
    render(<FlightSearchForm initialFrom="dad" initialTo="han" onSearch={onSearch} />);

    expect((screen.getByLabelText('Điểm đi') as HTMLSelectElement).value).toBe('DAD');
    expect((screen.getByLabelText('Điểm đến') as HTMLSelectElement).value).toBe('HAN');

    fireEvent.click(screen.getByRole('button', { name: 'Tìm chuyến bay' }));

    expect(onSearch).toHaveBeenCalledWith(expect.objectContaining({ from: 'DAD', to: 'HAN' }));
  });

  it('falls back to a valid domestic route when query values are invalid or identical', () => {
    const { rerender } = render(
      <FlightSearchForm key="invalid" initialFrom="unknown" initialTo="han" onSearch={vi.fn()} />,
    );

    expect((screen.getByLabelText('Điểm đi') as HTMLSelectElement).value).toBe('SGN');
    expect((screen.getByLabelText('Điểm đến') as HTMLSelectElement).value).toBe('HAN');

    rerender(<FlightSearchForm key="same" initialFrom="han" initialTo="han" onSearch={vi.fn()} />);

    expect((screen.getByLabelText('Điểm đi') as HTMLSelectElement).value).toBe('HAN');
    expect((screen.getByLabelText('Điểm đến') as HTMLSelectElement).value).toBe('SGN');
  });
});
