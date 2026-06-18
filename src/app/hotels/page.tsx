'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import HotelSuggestions from '@/components/hotels/HotelSuggestions';

const QUICK_AREAS = ['Đà Nẵng', 'Hạ Long', 'Hội An', 'Sa Pa', 'Nha Trang'] as const;

export default function HotelsPage(): React.JSX.Element {
  const [input, setInput] = useState('');
  const [destination, setDestination] = useState('');

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    setDestination(input.trim());
  };

  const selectArea = (area: string): void => {
    setInput(area);
    setDestination(area);
  };

  const clear = (): void => {
    setInput('');
    setDestination('');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="hotels" showSearch={false} />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Khách sạn</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Tìm khách sạn theo điểm đến. Dữ liệu khách sạn lấy từ OpenStreetMap.
          </p>
        </div>

        <form onSubmit={submit} className="mb-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Nhập Đà Nẵng, Hạ Long, Hội An..."
            aria-label="Điểm đến tìm khách sạn"
            className="w-full flex-1 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary-darker)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]"
          >
            Tìm khách sạn
          </button>
          {(input || destination) && (
            <button
              type="button"
              onClick={clear}
              className="rounded-lg border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
            >
              Xóa
            </button>
          )}
        </form>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Gợi ý nhanh:</span>
          {QUICK_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => selectArea(area)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                destination === area
                  ? 'border-[var(--color-primary-darker)] bg-[var(--color-primary-lightest)] text-[var(--color-primary-darker)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <HotelSuggestions destination={destination} limit={24} />
      </main>
    </div>
  );
}
