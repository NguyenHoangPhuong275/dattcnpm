'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import HotelSuggestions from '@/components/hotels/HotelSuggestions';

export default function HotelsPage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <HotelsPageContent />
    </Suspense>
  );
}

function HotelsPageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get('q') ?? '').trim();
  const [input, setInput] = useState<string>(initialQuery);
  const [destination, setDestination] = useState<string>(initialQuery);

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    setDestination(input.trim());
  };

  const clear = (): void => {
    setInput('');
    setDestination('');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="hotels" showSearch={false} />

      <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary-lightest)] via-white to-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)] sm:text-3xl">Khách sạn</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--color-text-muted)]">
            Khám phá những khách sạn được yêu thích trên khắp Việt Nam, hoặc tìm chỗ nghỉ cho điểm đến sắp tới của bạn.
          </p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tìm theo điểm đến: Đà Nẵng, Hạ Long, Hội An..."
              aria-label="Điểm đến tìm khách sạn"
              className="w-full flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm shadow-sm outline-none transition-colors focus:border-[var(--color-primary-dark)]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary-darker)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Tìm khách sạn
            </button>
            {destination && (
              <button
                type="button"
                onClick={clear}
                className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-primary-lightest)] hover:text-[var(--color-primary-darker)]"
              >
                Xóa
              </button>
            )}
          </form>

          {destination && (
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">
              Đang tìm tại <span className="font-semibold text-[var(--color-text)]">“{destination}”</span> · bấm{' '}
              <span className="font-semibold">Xóa</span> để xem khách sạn nổi bật trên cả nước.
            </p>
          )}
        </section>

        <HotelSuggestions destination={destination} limit={24} featuredWhenEmpty />
      </main>
    </div>
  );
}
