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
import { apiRequest, ensureApiSuccess, type ApiEnvelope } from '@/lib/api-client';
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

  useEffect(() => {
    if (tripActions.tripActionStatus === 'error' && tripActions.tripActionMessage) {
      showToast(tripActions.tripActionMessage, 'error');
    }
  }, [showToast, tripActions.tripActionMessage, tripActions.tripActionStatus]);

  const [activeSection, setActiveSection] = useState<'destinations' | 'news' | 'local' | undefined>(undefined);
  const { handleSearch, searchFor, setSearchQuery } = search;

  const [addToTripOpen, setAddToTripOpen] = useState(false);
  const [addToTripPlace, setAddToTripPlace] = useState<SearchResult | null>(null);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

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

  const handleSaveFavorite = useCallback(async (place: SearchResult): Promise<void> => {
    if (!user) {
      openAuth('login');
      return;
    }
    if (favoriteSaving) return;

    setFavoriteSaving(true);
    try {
      const { response, data } = await apiRequest<ApiEnvelope>('/api/favorites', {
        method: 'POST',
        userId: user.id,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place._id,
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          address: place.address || undefined,
        }),
      });

      ensureApiSuccess(response, data, 'Không thể lưu địa điểm yêu thích');

      showToast('Đã lưu địa điểm yêu thích', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể lưu địa điểm yêu thích';
      showToast(message, 'error');
    } finally {
      setFavoriteSaving(false);
    }
  }, [favoriteSaving, openAuth, showToast, user]);

  const handleCreateReview = useCallback(async (payload: { placeId: string; rating: number; comment?: string }): Promise<void> => {
    if (!user) {
      openAuth('login');
      return;
    }
    if (reviewSaving) return;

    setReviewSaving(true);
    try {
      const { response, data } = await apiRequest<ApiEnvelope>('/api/reviews', {
        method: 'POST',
        userId: user.id,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      ensureApiSuccess(response, data, 'Không thể gửi đánh giá');

      showToast('Đã gửi đánh giá', 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể gửi đánh giá';
      showToast(message, 'error');
      throw error;
    } finally {
      setReviewSaving(false);
    }
  }, [openAuth, reviewSaving, showToast, user]);

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

  const submitHeaderSearch = (): void => {
    handleSearch();
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleQuickSelect = (title: string): void => {
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
            tripActionMessage={tripActions.tripActionMessage}
            onAddToTrip={tripActions.addSelectedPlaceToTrip}
            onCreateTripFromPlace={tripActions.createTripFromSelectedPlace}
            onLogin={() => openAuth('login')}
            onOpenAddToTripModal={handleOpenAddToTripModal}
            onSaveFavorite={handleSaveFavorite}
            favoriteSaving={favoriteSaving}
            onCreateReview={handleCreateReview}
            reviewSaving={reviewSaving}
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
