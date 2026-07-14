'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import AppHeader from '@/components/AppHeader';
import AirlineDirectory from '@/components/flights/AirlineDirectory';
import FlightSearchForm from '@/components/flights/FlightSearchForm';
import FlightSearchResults from '@/components/flights/FlightSearchResults';
import { resolveFlightSearchRoute, type FlightSearchCriteria } from '@/lib/flight-search';

export default function FlightsPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)]" />}>
      <FlightsPageContent />
    </Suspense>
  );
}

function FlightsPageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const initialRoute = resolveFlightSearchRoute(searchParams.get('from'), searchParams.get('to'));
  const [criteria, setCriteria] = useState<FlightSearchCriteria | null>(null);
  const [selectedOutboundId, setSelectedOutboundId] = useState<string | null>(null);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const handleSearch = (nextCriteria: FlightSearchCriteria | null): void => {
    setCriteria(nextCriteria);
    if (nextCriteria) {
      setSelectedOutboundId(null);
      setSelectedReturnId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader active="flights" showSearch={false} />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <FlightSearchForm
          key={`${initialRoute.from}-${initialRoute.to}`}
          initialFrom={initialRoute.from}
          initialTo={initialRoute.to}
          onSearch={handleSearch}
        />

        {criteria && (
          <FlightSearchResults
            criteria={criteria}
            selectedOutboundId={selectedOutboundId}
            selectedReturnId={selectedReturnId}
            onSelectOutbound={setSelectedOutboundId}
            onSelectReturn={setSelectedReturnId}
          />
        )}

        <AirlineDirectory />
      </main>
    </div>
  );
}
