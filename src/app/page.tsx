'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import HeroSlider from '@/components/home/HeroSlider';
import TripPlannerForm from '@/components/home/TripPlannerForm';
import PlaceDetailPanel from '@/components/home/PlaceDetailPanel';
import FeaturedDestinations from '@/components/home/FeaturedDestinations';
import TravelNewsSection from '@/components/home/TravelNewsSection';
import AuthModal from '@/components/auth/AuthModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { usePlaceDetails } from '@/hooks/usePlaceDetails';
import { useAuthModal } from '@/hooks/useAuthModal';
import { useHomepageTripActions } from '@/hooks/useHomepageTripActions';

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useCurrentUser({ redirectIfNone: false });
  const search = usePlaceSearch();
  const details = usePlaceDetails(search.selectedPlace);

  const { authMode, isClosing, openAuth, closeAuth } = useAuthModal();

  const tripActions = useHomepageTripActions({
    userId: user?.id ?? null,
    selectedPlace: search.selectedPlace,
  });

  const [activeSection, setActiveSection] = useState<'destinations' | 'news' | 'local' | undefined>(undefined);
  const { handleSearch, searchFor, setSearchQuery } = search;

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      const plannerEl = document.getElementById('planner');
      const newsEl = document.getElementById('travel-news');

      if (newsEl && scrollPos >= newsEl.offsetTop) {
        setActiveSection('news');
      } else if (plannerEl && scrollPos >= plannerEl.offsetTop) {
        setActiveSection('destinations');
      } else {
        setActiveSection(undefined);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lastProcessedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q !== lastProcessedQueryRef.current) {
      lastProcessedQueryRef.current = q;
      searchFor(q);
      document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams, searchFor]);

  const submitHeaderSearch = () => {
    handleSearch();
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleQuickSelect = (title: string) => {
    searchFor(title);
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)]">
      <AppHeader
        active={activeSection}
        onAuthClick={openAuth}
        searchValue={search.searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={submitHeaderSearch}
      />

      <HeroSlider paused={!!authMode} />

      <TripPlannerForm
        search={search}
        startDate={tripActions.startDate}
        endDate={tripActions.endDate}
        travelerCount={tripActions.travelerCount}
        onStartDateChange={tripActions.setStartDate}
        onEndDateChange={tripActions.setEndDate}
        onTravelerCountChange={tripActions.setTravelerCount}
        onCreateTrip={tripActions.createTripFromSelectedPlace}
        isCreating={tripActions.isTripActionLoading}
        isUserLoading={userLoading}
      />

      {search.selectedPlace && (
        <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <PlaceDetailPanel
            selectedPlace={search.selectedPlace}
            details={details}
            myTrips={tripActions.myTrips}
            isLoggedIn={!!user}
            isTripActionLoading={tripActions.isTripActionLoading}
            tripActionMessage={tripActions.tripActionMessage}
            onAddToTrip={tripActions.addSelectedPlaceToTrip}
            onCreateTripFromPlace={tripActions.createTripFromSelectedPlace}
            onLogin={() => openAuth('login')}
          />
        </section>
      )}

      <FeaturedDestinations onSelect={handleQuickSelect} />
      <TravelNewsSection />
      <AuthModal authMode={authMode} isClosing={isClosing} onClose={closeAuth} onModeChange={openAuth} />
    </div>
  );
}
