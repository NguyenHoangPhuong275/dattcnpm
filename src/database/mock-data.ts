import type {
  User,
  Trip,
  Place,
  ItineraryItem,
  FavoritePlace,
  SearchHistory,
  AuditLog,
  Review,
  TripShare,
  Notification,
  Tag,
  UserPreference,
  TripBudget,
  TripAccommodation,
  TripChecklist,
  UserFollow,
} from './schema';

export const mockUsers: User[] = [];
export const mockPlaces: Place[] = [];
export const mockTrips: Trip[] = [];
export const mockItineraryItems: ItineraryItem[] = [];
export const mockFavorites: FavoritePlace[] = [];
export const mockSearchHistories: SearchHistory[] = [];
export const mockAuditLogs: AuditLog[] = [];
export const mockReviews: Review[] = [];
export const mockTags: Tag[] = [];
export const mockUserPreferences: UserPreference[] = [];
export const mockBudgets: TripBudget[] = [];
export const mockAccommodations: TripAccommodation[] = [];
export const mockChecklists: TripChecklist[] = [];
export const mockFollows: UserFollow[] = [];
export const mockShares: TripShare[] = [];
export const mockNotifications: Notification[] = [];

export const seedData = {
  users: mockUsers,
  places: mockPlaces,
  trips: mockTrips,
  itineraryItems: mockItineraryItems,
  favorites: mockFavorites,
  searchHistories: mockSearchHistories,
  auditLogs: mockAuditLogs,
  reviews: mockReviews,
  tags: mockTags,
  userPreferences: mockUserPreferences,
  budgets: mockBudgets,
  accommodations: mockAccommodations,
  checklists: mockChecklists,
  follows: mockFollows,
  shares: mockShares,
  notifications: mockNotifications,
};
