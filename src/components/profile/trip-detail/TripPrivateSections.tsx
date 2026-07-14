import TripAccommodationSection from '@/components/trips/TripAccommodationSection';
import TripBudgetSummary from '@/components/trips/TripBudgetSummary';
import TripChecklistSection from '@/components/trips/TripChecklistSection';
import TripCollaboratorsSection from '@/components/trips/TripCollaboratorsSection';
import type { TripSummary } from '@/types/profile';

import type { HotelAnchor } from './types';

interface TripPrivateSectionsProps {
  trip: TripSummary;
  userId: string | null;
  canEdit: boolean;
  isOwner: boolean;
  hotelAnchor: HotelAnchor | null;
}

export function TripPrivateSections({
  trip,
  userId,
  canEdit,
  isOwner,
  hotelAnchor,
}: TripPrivateSectionsProps): React.JSX.Element {
  return (
    <>
      <TripBudgetSummary tripId={trip._id} userId={userId} canEdit={canEdit} />

      <TripChecklistSection tripId={trip._id} userId={userId} canEdit={canEdit} />

      {isOwner && <TripCollaboratorsSection tripId={trip._id} userId={userId} />}

      <div className="border-t border-[var(--color-border)] pt-4 mt-6">
        <div className="font-semibold text-sm text-[var(--color-text)] mb-3">Khách sạn</div>
        <TripAccommodationSection
          tripId={trip._id}
          userId={userId}
          canEdit={canEdit}
          destination={trip.destination}
          lat={hotelAnchor?.lat}
          lng={hotelAnchor?.lng}
          placeName={hotelAnchor?.name}
          startDate={trip.startDate}
          endDate={trip.endDate}
        />
      </div>
    </>
  );
}
