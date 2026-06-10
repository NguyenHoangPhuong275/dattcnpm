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
  PlaceTag,
  UserPreference,
  TripBudget,
  ItineraryTransport,
  TripAccommodation,
  TripChecklist,
  UserFollow,
} from './schema';

import { seedData } from './mock-data';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'registered-users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedUsers(): User[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

function savePersistedUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

class Collection<T extends { _id: MongoId }> {
  private data = new Map<MongoId, T>();

  constructor(initial: T[] = []) {
    initial.forEach((item) => this.data.set(item._id, item));
  }

  findById(id: MongoId): T | undefined {
    return this.data.get(id);
  }

  find(filter: Partial<T> = {}): T[] {
    const results: T[] = [];
    for (const item of this.data.values()) {
      let match = true;
      for (const [key, value] of Object.entries(filter)) {
        if ((item as unknown as Record<string, unknown>)[key] !== value) {
          match = false;
          break;
        }
      }
      if (match) results.push(item);
    }
    return results;
  }

  findOne(filter: Partial<T> = {}): T | undefined {
    return this.find(filter)[0];
  }

  insertOne(doc: Omit<T, '_id'> & { _id?: MongoId }): T {
    const newDoc = {
      ...doc,
      _id: doc._id || `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    } as T;

    this.data.set(newDoc._id, newDoc);
    return newDoc;
  }

  updateOne(id: MongoId, update: Partial<T>): T | null {
    const existing = this.data.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...update, updatedAt: new Date() } as T;
    this.data.set(id, updated);
    return updated;
  }

  deleteOne(id: MongoId): boolean {
    return this.data.delete(id);
  }

  count(): number {
    return this.data.size;
  }

  reset(initial: T[] = []) {
    this.data.clear();
    initial.forEach((item) => this.data.set(item._id, item));
  }
}

export class MockDatabase {
  users: Collection<User>;
  trips: Collection<Trip>;
  places: Collection<Place>;
  itineraryItems: Collection<ItineraryItem>;
  favorites: Collection<FavoritePlace>;
  searchHistories: Collection<SearchHistory>;
  auditLogs: Collection<AuditLog>;
  reviews: Collection<Review>;
  tripShares: Collection<TripShare>;
  notifications: Collection<Notification>;
  tags: Collection<Tag>;
  placeTags: Collection<PlaceTag>;
  userPreferences: Collection<UserPreference>;
  tripBudgets: Collection<TripBudget>;
  itineraryTransports: Collection<ItineraryTransport>;
  tripAccommodations: Collection<TripAccommodation>;
  tripChecklists: Collection<TripChecklist>;
  userFollows: Collection<UserFollow>;

  constructor(seed = true) {

    const persistedUsers = loadPersistedUsers();
    const initialUsers = seed ? [...seedData.users, ...persistedUsers] : persistedUsers;

    this.users = new Collection(initialUsers);
    this._wrapUserPersistence();

    this.trips = new Collection(seed ? seedData.trips : []);
    this.places = new Collection(seed ? seedData.places : []);
    this.itineraryItems = new Collection(seed ? seedData.itineraryItems : []);
    this.favorites = new Collection(seed ? seedData.favorites : []);
    this.searchHistories = new Collection(seed ? seedData.searchHistories : []);
    this.auditLogs = new Collection(seed ? seedData.auditLogs : []);
    this.reviews = new Collection(seed ? seedData.reviews : []);
    this.tripShares = new Collection(seed ? seedData.shares : []);
    this.notifications = new Collection(seed ? seedData.notifications : []);
    this.tags = new Collection(seed ? seedData.tags : []);
    this.placeTags = new Collection([]);
    this.userPreferences = new Collection(seed ? seedData.userPreferences : []);
    this.tripBudgets = new Collection(seed ? seedData.budgets : []);
    this.itineraryTransports = new Collection([]);
    this.tripAccommodations = new Collection(seed ? seedData.accommodations : []);
    this.tripChecklists = new Collection(seed ? seedData.checklists : []);
    this.userFollows = new Collection(seed ? seedData.follows : []);
  }

  resetAll() {

    const persistedUsers = loadPersistedUsers();
    this.users.reset([...seedData.users, ...persistedUsers]);
    this._wrapUserPersistence();

    this.trips.reset(seedData.trips);
    this.places.reset(seedData.places);
    this.itineraryItems.reset(seedData.itineraryItems);
    this.favorites.reset(seedData.favorites);
    this.searchHistories.reset(seedData.searchHistories);
    this.auditLogs.reset(seedData.auditLogs);
    this.reviews.reset(seedData.reviews);
    this.tripShares.reset(seedData.shares);
    this.notifications.reset(seedData.notifications);
    this.tags.reset(seedData.tags);
    this.userPreferences.reset(seedData.userPreferences);
    this.tripBudgets.reset(seedData.budgets);
    this.tripAccommodations.reset(seedData.accommodations);
    this.tripChecklists.reset(seedData.checklists);
    this.userFollows.reset(seedData.follows);
  }

  log(action: string, userId: MongoId | null, targetType: string, targetId?: MongoId, metadata?: Record<string, unknown>) {
    this.auditLogs.insertOne({
      userId: userId || undefined,
      action,
      targetType,
      targetId,
      metadata,
      createdAt: new Date(),
    } as any);
  }

  private _wrapUserPersistence() {
    const originalInsert = this.users.insertOne.bind(this.users);
    (this.users as unknown as { insertOne: (doc: any) => User }).insertOne = (doc: any) => {
      const created = originalInsert(doc);
      try {
        const dataMap = (this.users as unknown as { data: Map<string, User> }).data;
        const allUsers = Array.from(dataMap.values());
        savePersistedUsers(allUsers);
      } catch {
      }
      return created;
    };
  }
}

let mockDbInstance: MockDatabase | null = null;

export function getMockDatabase(seed = true): MockDatabase {
  if (!mockDbInstance) {
    mockDbInstance = new MockDatabase(seed);
  }
  return mockDbInstance;
}

export function resetMockDatabase() {
  if (mockDbInstance) {
    mockDbInstance.resetAll();
  } else {
    mockDbInstance = new MockDatabase(true);
  }
  return mockDbInstance;
}
