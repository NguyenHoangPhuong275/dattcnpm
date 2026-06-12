import React from 'react';

export default function TripsLoading(): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-white font-sans text-slate-800">
      <div className="h-[72px] border-b border-slate-200 bg-white" />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-96 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-11 w-36 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="h-48 animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-6 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
