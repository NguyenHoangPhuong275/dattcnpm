import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { connectMongo, disconnectMongo, getDb } from '@/lib/mongodb';
import { connectRedis, disconnectRedis } from '@/lib/redis';
import mongoose from 'mongoose';

beforeAll(async () => {
  await disconnectRedis();

  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-travel-guide-test';
  }
  if (!process.env.REDIS_URL) {
    process.env.REDIS_URL = 'redis://127.0.0.1:6379/15';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'integration-test-secret-key-that-is-long-enough';
  }

  await connectMongo();
  await connectRedis();
});

afterAll(async () => {
  const db = await getDb();
  await db.trips.reset();
  await db.itineraryItems.reset();
  await db.places.reset();
  await db.users.reset();

  await disconnectMongo();
  await disconnectRedis();
});

describe('Integration Tests - Trips & Itinerary', () => {
  it('should successfully execute CRUD operations on trips', async () => {
    const db = await getDb();
    await db.trips.reset();

    const userAId = new mongoose.Types.ObjectId().toString();

    const newTrip = await db.trips.insertOne({
      userId: userAId as any,
      title: 'Chuyến đi Đà Nẵng mùa hè',
      destination: 'Đà Nẵng',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-05'),
      isPublic: false,
      description: 'Chuyến đi nghỉ mát gia đình',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(newTrip).toBeDefined();
    expect(newTrip._id).toBeDefined();
    expect(newTrip.title).toBe('Chuyến đi Đà Nẵng mùa hè');
    expect(newTrip.destination).toBe('Đà Nẵng');

    const foundTrips = await db.trips.find({ userId: userAId as any });
    expect(foundTrips).toHaveLength(1);
    expect(foundTrips[0].title).toBe('Chuyến đi Đà Nẵng mùa hè');

    const foundById = await db.trips.findById(newTrip._id);
    expect(foundById).toBeDefined();
    expect(foundById?.title).toBe('Chuyến đi Đà Nẵng mùa hè');

    const updatedTrip = await db.trips.updateOne(newTrip._id, {
      title: 'Chuyến đi Đà Nẵng - Hội An',
      isPublic: true,
    });
    expect(updatedTrip).toBeDefined();
    expect(updatedTrip?.title).toBe('Chuyến đi Đà Nẵng - Hội An');
    expect(updatedTrip?.isPublic).toBe(true);

    const deleted = await db.trips.deleteOne(newTrip._id);
    expect(deleted).toBe(true);

    const foundAfterDelete = await db.trips.findById(newTrip._id);
    expect(foundAfterDelete).toBeUndefined();
  });

  it('should successfully execute CRUD operations on itinerary items', async () => {
    const db = await getDb();
    await db.trips.reset();
    await db.itineraryItems.reset();
    await db.places.reset();

    const userAId = new mongoose.Types.ObjectId().toString();

    const trip = await db.trips.insertOne({
      userId: userAId as any,
      title: 'Chuyến đi Hà Nội',
      destination: 'Hà Nội',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-03'),
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const place = await db.places.insertOne({
      name: 'Hồ Hoàn Kiếm',
      type: 'attraction',
      lat: 21.0285,
      lng: 105.8542,
      address: 'Tràng Tiền, Hoàn Kiếm, Hà Nội',
      ratingAvg: 4.8,
      ratingCount: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const itineraryItem = await db.itineraryItems.insertOne({
      tripId: trip._id as any,
      placeId: place._id as any,
      day: 1,
      orderIndex: 0,
      note: 'Dạo quanh Hồ Gươm ngắm cảnh',
      currency: 'VND',
      cost: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(itineraryItem).toBeDefined();
    expect(itineraryItem._id).toBeDefined();
    expect(itineraryItem.note).toBe('Dạo quanh Hồ Gươm ngắm cảnh');

    const foundItems = await db.itineraryItems.find({ tripId: trip._id as any });
    expect(foundItems).toHaveLength(1);
    expect(foundItems[0].note).toBe('Dạo quanh Hồ Gươm ngắm cảnh');

    const updatedItem = await db.itineraryItems.updateOne(itineraryItem._id, {
      note: 'Ngắm Tháp Rùa và thưởng thức kem Tràng Tiền',
      orderIndex: 1,
    });
    expect(updatedItem).toBeDefined();
    expect(updatedItem?.note).toBe('Ngắm Tháp Rùa và thưởng thức kem Tràng Tiền');
    expect(updatedItem?.orderIndex).toBe(1);

    const deletedItem = await db.itineraryItems.deleteOne(itineraryItem._id);
    expect(deletedItem).toBe(true);

    const foundItemsAfterDelete = await db.itineraryItems.find({ tripId: trip._id as any });
    expect(foundItemsAfterDelete).toHaveLength(0);
  });

  it('should enforce ownership checks for trips', async () => {
    const db = await getDb();
    await db.trips.reset();

    const userAId = new mongoose.Types.ObjectId().toString();
    const userBId = new mongoose.Types.ObjectId().toString();

    const tripA = await db.trips.insertOne({
      userId: userAId as any,
      title: 'Chuyến đi của User A',
      destination: 'Hồ Chí Minh',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-09-03'),
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const foundByOwner = await db.trips.findOne({ _id: tripA._id as any, userId: userAId as any });
    expect(foundByOwner).toBeDefined();
    expect(foundByOwner?.title).toBe('Chuyến đi của User A');

    const foundByNonOwner = await db.trips.findOne({ _id: tripA._id as any, userId: userBId as any });
    expect(foundByNonOwner).toBeUndefined();
  });
});
