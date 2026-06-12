import React from 'react';

export default function ItineraryLoading(): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-slate-50 font-sans text-slate-900">
      <div className="h-[72px] border-b border-slate-200 bg-white" />
      <main className="grid min-h-[calc(100dvh-72px)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0 border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="space-y-4">
              <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-3">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-5 h-10 w-full animate-pulse rounded-lg bg-slate-200" />
          </div>
          <div className="space-y-6 px-4 py-6 lg:px-8">
            {[1, 2].map((day) => (
              <div key={day} className="space-y-3">
                <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="h-28 w-full animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <aside className="bg-slate-50 p-4 lg:p-6">
          <div className="h-96 w-full animate-pulse rounded-lg bg-slate-200" />
        </aside>
      </main>
    </div>
  );
}
