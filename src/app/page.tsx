'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import HeroSlider from '@/components/home/HeroSlider';
import TripPlannerForm from '@/components/home/TripPlannerForm';
import PlaceDetailPanel from '@/components/home/PlaceDetailPanel';
import FeaturedDestinations from '@/components/home/FeaturedDestinations';
import RecommendedPlaces from '@/components/home/RecommendedPlaces';
import TravelNewsSection from '@/components/home/TravelNewsSection';
import AuthModal from '@/components/auth/AuthModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { usePlaceDetails } from '@/hooks/usePlaceDetails';
import { useAuthModal } from '@/hooks/useAuthModal';
import { useToast } from '@/hooks/useToast';
import { useHomepageTripActions } from '@/hooks/useHomepageTripActions';
import AddToTripModal from '@/components/trips/AddToTripModal';
import type { SearchResult } from '@/hooks/usePlaceSearch';
import type { BasicUser } from '@/types/profile';

export default function HomePage(): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const userHook = useCurrentUser({ redirectIfNone: false });
  const user = userHook.data;
  const userLoading = userHook.status === 'loading';
  const { setUser } = userHook.actions;
  const search = usePlaceSearch();
  const details = usePlaceDetails(search.selectedPlace);

  const { authMode, isClosing, openAuth, closeAuth } = useAuthModal();
  const toast = useToast();
  const { showToast } = toast.actions;

  const handleAuthenticated = useCallback((authUser: BasicUser) => {
    setUser(authUser);
  }, [setUser]);

  const destinationInputRef = useRef<HTMLInputElement>(null);

  const handleMissingPlace = useCallback(
    () => destinationInputRef.current?.focus(),
    [],
  );

  const tripActions = useHomepageTripActions({
    userId: user?.id ?? null,
    selectedPlace: search.selectedPlace,
    onMissingPlace: handleMissingPlace,
  });
  const { createTripFromPlace, createTripFromSelectedPlace } = tripActions;

  useEffect(() => {
    if (tripActions.tripActionStatus === 'error' && tripActions.tripActionMessage) {
      showToast(tripActions.tripActionMessage, 'error');
    }
  }, [showToast, tripActions.tripActionMessage, tripActions.tripActionStatus]);

  const [activeSection, setActiveSection] = useState<'destinations' | 'news' | 'local' | undefined>(undefined);
  const { searchFor } = search;

  const [addToTripOpen, setAddToTripOpen] = useState(false);
  const [addToTripPlace, setAddToTripPlace] = useState<SearchResult | null>(null);

  const handleOpenAddToTripModal = (place?: SearchResult): void => {
    const p = place || search.selectedPlace;
    if (p) {
      setAddToTripPlace(p);
      setAddToTripOpen(true);
    }
  };

  const handleAddToTripFromSearch = (place: SearchResult): void => {
    if (!user) {
      openAuth('login');
      return;
    }
    handleOpenAddToTripModal(place);
  };

  const handleCreateTripFromPlanner = useCallback((): void => {
    if (!user) {
      openAuth('login');
      return;
    }
    void createTripFromSelectedPlace();
  }, [createTripFromSelectedPlace, openAuth, user]);

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

  const plannerQuery = searchParams.get('q');
  const shouldAutoSelectPlannerQuery = searchParams.get('select') === '1';

  useEffect(() => {
    if (!plannerQuery) return;

    searchFor(plannerQuery, { autoSelect: shouldAutoSelectPlannerQuery });
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [plannerQuery, searchFor, shouldAutoSelectPlannerQuery]);

  const submitHeaderSearch = (query: string): void => {
    searchFor(query);
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleQuickSelect = (title: string): void => {
    searchFor(title, { autoSelect: true });
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)]">
      <AppHeader
        active={activeSection}
        onAuthClick={openAuth}
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
        onCreateTrip={handleCreateTripFromPlanner}
        isCreating={tripActions.isTripActionLoading}
        isUserLoading={userLoading}
        destinationInputRef={destinationInputRef}
        onAddToTrip={handleAddToTripFromSearch}
      />

      {search.selectedPlace && (
        <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <PlaceDetailPanel
            selectedPlace={search.selectedPlace}
            details={details}
            myTrips={tripActions.myTrips}
            isLoggedIn={!!user}
            isTripsLoading={tripActions.isLoadingTrips}
            isTripActionLoading={tripActions.isTripActionLoading}
            onCreateTripFromPlace={createTripFromPlace}
            onLogin={() => openAuth('login')}
            onOpenAddToTripModal={handleOpenAddToTripModal}
          />
        </section>
      )}

      {addToTripOpen && addToTripPlace && (
        <AddToTripModal
          isOpen={addToTripOpen}
          placeName={addToTripPlace.name}
          placeId={addToTripPlace._id}
          onClose={() => {
            setAddToTripOpen(false);
            setAddToTripPlace(null);
          }}
        />
      )}

      <FeaturedDestinations onSelect={handleQuickSelect} />
      <RecommendedPlaces />
      <TravelNewsSection />
      <AuthModal
        authMode={authMode}
        isClosing={isClosing}
        onClose={closeAuth}
        onModeChange={openAuth}
        onAuthenticated={handleAuthenticated}
        onToast={showToast}
      />
    </div>
  );
}
