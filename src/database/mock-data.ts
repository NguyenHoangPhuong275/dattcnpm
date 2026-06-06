import type {
  MongoId,
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

const now = new Date();

export const mockUsers: User[] = [
  {
    _id: 'u_admin_001',
    email: 'admin@smarttravel.dev',
    passwordHash: '$2a$10$mockhashforadmin',
    fullName: 'Admin User',
    avatarUrl: null,
    role: 'ADMIN',
    isLocked: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  },
  {
    _id: 'u_user_001',
    email: 'user1@example.com',
    passwordHash: '$2a$10$mockhashforuser1',
    fullName: 'Nguyễn Văn A',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    role: 'USER',
    isLocked: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  },
  {
    _id: 'u_user_002',
    email: 'user2@example.com',
    passwordHash: '$2a$10$mockhashforuser2',
    fullName: 'Trần Thị B',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    role: 'USER',
    isLocked: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  },
];

export const mockPlaces: Place[] = [
  {
    _id: 'p_hanoi_hoan_kiem',
    osmId: 'node/123456',
    name: 'Hồ Hoàn Kiếm',
    type: 'attraction',
    lat: 21.0285,
    lng: 105.852,
    address: 'Hoàn Kiếm, Hà Nội',
    openingHours: '24/7',
    images: ['https://picsum.photos/id/1015/800/600'],
    osmTags: { tourism: 'attraction', name: 'Hồ Hoàn Kiếm' },
    tags: ['lake', 'historic', 'hanoi'],
    ratingAvg: 4.7,
    ratingCount: 1240,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'p_hanoi_bun_cha',
    osmId: 'node/789012',
    name: 'Bún Chả Hương Liên',
    type: 'restaurant',
    lat: 21.025,
    lng: 105.85,
    address: '24 Lê Văn Hưu, Hà Nội',
    openingHours: '10:00-21:00',
    images: ['https://picsum.photos/id/292/800/600'],
    osmTags: { amenity: 'restaurant', cuisine: 'vietnamese' },
    tags: ['food', 'local', 'bun-cha'],
    ratingAvg: 4.5,
    ratingCount: 890,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'p_hanoi_hotel',
    osmId: 'node/345678',
    name: 'Hanoi La Quinta Hotel',
    type: 'hotel',
    lat: 21.03,
    lng: 105.84,
    address: '50 Đinh Tiên Hoàng, Hà Nội',
    openingHours: null,
    images: ['https://picsum.photos/id/160/800/600'],
    osmTags: { tourism: 'hotel' },
    tags: ['accommodation', 'center'],
    ratingAvg: 4.2,
    ratingCount: 320,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockTrips: Trip[] = [
  {
    _id: 't_trip_001',
    userId: 'u_user_001',
    title: 'Hà Nội 3 ngày cuối tuần',
    description: 'Khám phá phố cổ và ẩm thực Hà Nội',
    destination: 'Hà Nội',
    startDate: new Date('2025-05-10'),
    endDate: new Date('2025-05-12'),
    isPublic: true,
    coverImage: 'https://picsum.photos/id/1015/1200/630',
    metadata: { totalBudget: 4500000 },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  },
];

export const mockItineraryItems: ItineraryItem[] = [
  {
    _id: 'it_001',
    tripId: 't_trip_001',
    placeId: 'p_hanoi_hoan_kiem',
    day: 1,
    orderIndex: 1,
    note: 'Đi dạo quanh hồ sáng sớm',
    startTime: new Date('2025-05-10T07:00:00'),
    endTime: new Date('2025-05-10T09:00:00'),
    cost: 0,
    currency: 'VND',
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'it_002',
    tripId: 't_trip_001',
    placeId: 'p_hanoi_bun_cha',
    day: 1,
    orderIndex: 2,
    note: 'Ăn trưa bún chả Obama',
    startTime: new Date('2025-05-10T11:30:00'),
    endTime: new Date('2025-05-10T13:00:00'),
    cost: 85000,
    currency: 'VND',
    metadata: {},
    createdAt: now,
    updatedAt: now,
  },
];

export const mockFavorites: FavoritePlace[] = [
  {
    _id: 'fav_001',
    userId: 'u_user_001',
    placeId: 'p_hanoi_hoan_kiem',
    createdAt: now,
  },
];

export const mockSearchHistories: SearchHistory[] = [
  {
    _id: 'sh_001',
    userId: 'u_user_001',
    query: 'Hồ Hoàn Kiếm',
    lat: 21.0285,
    lng: 105.852,
    resultCount: 12,
    metadata: {},
    createdAt: now,
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    _id: 'al_001',
    userId: 'u_user_001',
    action: 'CREATE_TRIP',
    targetType: 'Trip',
    targetId: 't_trip_001',
    metadata: { title: 'Hà Nội 3 ngày cuối tuần' },
    createdAt: now,
  },
];

export const mockReviews: Review[] = [
  {
    _id: 'rev_001',
    userId: 'u_user_002',
    placeId: 'p_hanoi_hoan_kiem',
    parentId: null,
    rating: 5,
    comment: 'Rất đẹp, không khí trong lành!',
    images: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  },
];

export const mockTags: Tag[] = [
  { _id: 'tag_lake', name: 'Hồ', category: 'nature', createdAt: now },
  { _id: 'tag_food', name: 'Ẩm thực', category: 'food', createdAt: now },
];

export const mockUserPreferences: UserPreference[] = [
  { _id: 'pref_001', userId: 'u_user_001', tagId: 'tag_lake', preferenceScore: 85, updatedAt: now },
];

export const mockBudgets: TripBudget[] = [
  {
    _id: 'bud_001',
    tripId: 't_trip_001',
    category: 'FOOD',
    estimatedAmount: 1200000,
    actualAmount: 950000,
    currency: 'VND',
    note: 'Ăn uống',
    createdAt: now,
  },
];

export const mockAccommodations: TripAccommodation[] = [
  {
    _id: 'acc_001',
    tripId: 't_trip_001',
    placeId: 'p_hanoi_hotel',
    name: 'Hanoi La Quinta Hotel',
    checkIn: new Date('2025-05-10'),
    checkOut: new Date('2025-05-12'),
    bookingRef: 'BK123456',
    cost: 1800000,
    currency: 'VND',
    note: 'Phòng đôi view hồ',
    createdAt: now,
  },
];

export const mockChecklists: TripChecklist[] = [
  { _id: 'check_001', tripId: 't_trip_001', label: 'Mang theo máy ảnh', isDone: true, dueDate: null, createdAt: now },
  { _id: 'check_002', tripId: 't_trip_001', label: 'Đặt vé máy bay', isDone: false, dueDate: new Date('2025-04-20'), createdAt: now },
];

export const mockFollows: UserFollow[] = [
  { _id: 'follow_001', followerId: 'u_user_001', followingId: 'u_user_002', createdAt: now },
];

export const mockShares: TripShare[] = [
  {
    _id: 'share_001',
    tripId: 't_trip_001',
    sharedByUserId: 'u_user_001',
    sharedWithUserId: 'u_user_002',
    permission: 'READ',
    shareCode: null,
    expiresAt: null,
    createdAt: now,
  },
];

export const mockNotifications: Notification[] = [
  {
    _id: 'noti_001',
    userId: 'u_user_002',
    title: 'Chuyến đi được chia sẻ',
    content: 'Nguyễn Văn A đã chia sẻ chuyến đi "Hà Nội 3 ngày cuối tuần" với bạn.',
    type: 'TRIP_SHARE',
    isRead: false,
    actionUrl: '/trips/t_trip_001',
    metadata: {},
    createdAt: now,
  },
];

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
