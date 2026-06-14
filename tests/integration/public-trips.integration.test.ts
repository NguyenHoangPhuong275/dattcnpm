import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { connectMongo, disconnectMongo, getDb } from '@/lib/mongodb';
import { connectRedis, disconnectRedis } from '@/lib/redis';
import { GET as publicTripsGET } from '@/app/api/trips/public/route';
import mongoose from 'mongoose';

beforeAll(async () => {
  await disconnectRedis();
  await connectMongo();
  await connectRedis();
});

afterAll(async () => {
  const db = await getDb();
  await db.trips.reset();
  await disconnectMongo();
  await disconnectRedis();
});

describe('Integration Tests - Public Trips Discovery API', () => {
  it('should only return public trips without userId, and support destination filtering and pagination', async () => {
    const db = await getDb();
    await db.trips.reset();

    const userAId = new mongoose.Types.ObjectId();
    const userBId = new mongoose.Types.ObjectId();

    
    await db.trips.insertMany([
      {
        userId: userAId as any,
        title: 'Chuyến đi Hà Nội Mùa Thu',
        destination: 'Ha Noi',
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-05'),
        isPublic: true,
        description: 'Hà Nội mùa hoa sữa',
      },
      {
        userId: userBId as any,
        title: 'Chuyến đi bí mật',
        destination: 'Đà Nẵng',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-05'),
        isPublic: false,
        description: 'Hành trình riêng tư',
      },
      {
        userId: userAId as any,
        title: 'Sài Gòn ẩm thực',
        destination: 'Hồ Chí Minh',
        startDate: new Date('2026-12-01'),
        endDate: new Date('2026-12-05'),
        isPublic: true,
        description: 'Ẩm thực đường phố',
      },
    ]);

    
    const request = new Request('http://localhost/api/trips/public?page=1&limit=2');
    const response = await publicTripsGET(request as any);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.data).toHaveLength(2);

    
    for (const trip of body.data.data) {
      expect(trip.userId).toBeUndefined();
      expect(trip.isPublic).toBe(true);
    }

    
    const requestFilter = new Request('http://localhost/api/trips/public?destination=ha%20noi');
    const responseFilter = await publicTripsGET(requestFilter as any);
    expect(responseFilter.status).toBe(200);

    const bodyFilter = await responseFilter.json();
    expect(bodyFilter.data.data).toHaveLength(1);
    expect(bodyFilter.data.data[0].destination).toBe('Ha Noi');
    expect(bodyFilter.data.data[0].title).toBe('Chuyến đi Hà Nội Mùa Thu');
  });
});
