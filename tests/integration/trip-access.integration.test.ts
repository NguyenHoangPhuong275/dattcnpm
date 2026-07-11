import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as tripGET } from '@/app/api/trips/[id]/route';
import { GET as tripsGET } from '@/app/api/trips/route';
import {
  GET as accommodationGET,
  POST as accommodationPOST,
} from '@/app/api/trips/[id]/accommodation/route';
import { GET as budgetGET, POST as budgetPOST } from '@/app/api/trips/[id]/budget/route';
import { GET as checklistGET, POST as checklistPOST } from '@/app/api/trips/[id]/checklist/route';
import { GET as itineraryGET } from '@/app/api/trips/[id]/itinerary/route';
import { disconnectMongo, getDb } from '@/lib/db';

const OWNER = '507f1f77bcf86cd799439701';
const STRANGER = '507f1f77bcf86cd799439702';
const PENDING = '507f1f77bcf86cd799439703';
const READER = '507f1f77bcf86cd799439704';
const EDITOR = '507f1f77bcf86cd799439705';
const USER_IDS = [OWNER, STRANGER, PENDING, READER, EDITOR];
const PLACE_NAME = 'Trip access isolation place';

vi.mock('@/lib/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db')>();
  return {
    ...actual,
    getUserById: vi.fn().mockImplementation(async (userId: string) => {
      if (!USER_IDS.includes(userId)) return actual.getUserById(userId);
      return {
        _id: userId,
        id: userId,
        email: `${userId}@example.com`,
        fullName: 'Trip access user',
        role: 'USER',
        isLocked: false,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never;
    }),
  };
});

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function request(userId: string, resource: string, method: string = 'GET', body?: unknown) {
  return new Request(`http://localhost/api/trips/test/${resource}`, {
    method,
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function listedTrips(userId: string): Promise<Array<{ _id: string; access: string }>> {
  const response = await tripsGET(
    new Request('http://localhost/api/trips?page=1&limit=100', {
      headers: { 'x-user-id': userId },
    }) as never,
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  return body.data.data;
}

async function cleanup(): Promise<void> {
  const db = await getDb();
  const trips = await db.trips.find({ userId: OWNER });
  for (const trip of trips) {
    const tripId = String(trip._id);
    await db.itineraryItems.deleteMany({ tripId });
    await db.tripBudgets.deleteMany({ tripId });
    await db.tripChecklists.deleteMany({ tripId });
    await db.tripAccommodations.deleteMany({ tripId });
    await db.tripShares.deleteMany({ tripId });
  }
  await db.trips.deleteMany({ userId: OWNER });
  await db.places.deleteMany({ name: PLACE_NAME });
  await db.auditLogs.deleteMany({ userId: { $in: USER_IDS } });
}

async function seedTrip(): Promise<string> {
  const db = await getDb();
  const acceptedAt = new Date('2026-07-01T00:00:00.000Z');
  const invitedAt = new Date('2026-06-30T00:00:00.000Z');
  const trip = await db.trips.insertOne({
    userId: OWNER,
    title: 'Public isolation trip',
    destination: 'Da Nang',
    startDate: new Date('2026-10-01T00:00:00.000Z'),
    endDate: new Date('2026-10-05T00:00:00.000Z'),
    isPublic: true,
    collaborators: [
      { userId: PENDING, permission: 'EDIT', invitedAt, acceptedAt: null },
      { userId: READER, permission: 'READ', invitedAt, acceptedAt },
      { userId: EDITOR, permission: 'EDIT', invitedAt, acceptedAt },
    ],
  });
  const tripId = String(trip._id);
  const place = await db.places.insertOne({
    name: PLACE_NAME,
    type: 'attraction',
    lat: 16.0544,
    lng: 108.2022,
    ratingAvg: 0,
    ratingCount: 0,
  });

  await db.itineraryItems.insertOne({
    tripId,
    placeId: String(place._id),
    day: 1,
    orderIndex: 0,
    note: 'Public itinerary item',
  });
  await db.tripBudgets.insertOne({
    tripId,
    userId: OWNER,
    category: 'accommodation',
    amount: 2_000_000,
    currency: 'VND',
    note: 'Private budget',
    type: 'planned',
  });
  await db.tripChecklists.insertOne({
    tripId,
    label: 'Private checklist',
    isDone: false,
  });
  await db.tripAccommodations.insertOne({
    tripId,
    name: 'Private hotel',
    address: 'Private address',
    checkIn: new Date('2026-10-02T14:00:00.000Z'),
    checkOut: new Date('2026-10-04T12:00:00.000Z'),
    bookingRef: 'PRIVATE-BOOKING',
    note: 'Private accommodation note',
    currency: 'VND',
  });

  return tripId;
}

describe('Trip access isolation', () => {
  let tripId: string;

  beforeEach(async () => {
    await cleanup();
    tripId = await seedTrip();
  });

  afterEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await disconnectMongo().catch(() => {});
  });

  it('keeps public detail and itinerary readable without exposing private trip data', async () => {
    const detailResponse = await tripGET(request(STRANGER, '') as never, ctx(tripId) as never);
    expect(detailResponse.status).toBe(200);
    const detail = await detailResponse.json();
    expect(detail.data.title).toBe('Public isolation trip');
    expect(detail.data.userId).toBeUndefined();
    expect(detail.data.access).toBe('PUBLIC');

    const itineraryResponse = await itineraryGET(
      request(STRANGER, 'itinerary') as never,
      ctx(tripId) as never,
    );
    expect(itineraryResponse.status).toBe(200);
    const itinerary = await itineraryResponse.json();
    expect(itinerary.data).toHaveLength(1);
    expect(itinerary.data[0].place.name).toBe(PLACE_NAME);

    const sensitiveResponses = [
      await budgetGET(request(STRANGER, 'budget') as never, ctx(tripId) as never),
      await checklistGET(request(STRANGER, 'checklist') as never, ctx(tripId) as never),
      await accommodationGET(request(STRANGER, 'accommodation') as never, ctx(tripId) as never),
    ];
    expect(sensitiveResponses.map((response) => response.status)).toEqual([404, 404, 404]);
  });

  it('lists trips only for the owner and accepted collaborators', async () => {
    const db = await getDb();
    const acceptedMatches = await db.trips.find({
      collaborators: { $elemMatch: { userId: READER, acceptedAt: { $type: 'date' } } },
    });
    const pendingMatches = await db.trips.find({
      collaborators: { $elemMatch: { userId: PENDING, acceptedAt: { $type: 'date' } } },
    });
    expect(acceptedMatches.map((trip) => String(trip._id))).toContain(tripId);
    expect(pendingMatches.map((trip) => String(trip._id))).not.toContain(tripId);

    const ownerTrips = await listedTrips(OWNER);
    const readerTrips = await listedTrips(READER);
    const editorTrips = await listedTrips(EDITOR);
    const pendingTrips = await listedTrips(PENDING);
    const strangerTrips = await listedTrips(STRANGER);

    expect(ownerTrips.find((trip) => trip._id === tripId)?.access).toBe('OWNER');
    expect(readerTrips.find((trip) => trip._id === tripId)?.access).toBe('READ');
    expect(editorTrips.find((trip) => trip._id === tripId)?.access).toBe('EDIT');
    expect(pendingTrips.map((trip) => trip._id)).not.toContain(tripId);
    expect(strangerTrips.map((trip) => trip._id)).not.toContain(tripId);
  });

  it('does not grant private access to a pending collaborator', async () => {
    const readResponses = [
      await budgetGET(request(PENDING, 'budget') as never, ctx(tripId) as never),
      await checklistGET(request(PENDING, 'checklist') as never, ctx(tripId) as never),
      await accommodationGET(request(PENDING, 'accommodation') as never, ctx(tripId) as never),
    ];
    expect(readResponses.map((response) => response.status)).toEqual([404, 404, 404]);

    const writeResponse = await budgetPOST(
      request(PENDING, 'budget', 'POST', {
        category: 'food',
        amount: 100_000,
        currency: 'VND',
        type: 'planned',
      }) as never,
      ctx(tripId) as never,
    );
    expect(writeResponse.status).toBe(403);
  });

  it('allows an accepted READ collaborator to read private resources but not write', async () => {
    const budgetResponse = await budgetGET(request(READER, 'budget') as never, ctx(tripId) as never);
    const checklistResponse = await checklistGET(
      request(READER, 'checklist') as never,
      ctx(tripId) as never,
    );
    const accommodationResponse = await accommodationGET(
      request(READER, 'accommodation') as never,
      ctx(tripId) as never,
    );

    expect(budgetResponse.status).toBe(200);
    expect(checklistResponse.status).toBe(200);
    expect(accommodationResponse.status).toBe(200);
    expect((await budgetResponse.json()).data.items[0].note).toBe('Private budget');
    expect((await checklistResponse.json()).data[0].title).toBe('Private checklist');
    expect((await accommodationResponse.json()).data[0].bookingCode).toBe('PRIVATE-BOOKING');

    const writeResponses = [
      await budgetPOST(
        request(READER, 'budget', 'POST', {
          category: 'food',
          amount: 100_000,
          currency: 'VND',
          type: 'planned',
        }) as never,
        ctx(tripId) as never,
      ),
      await checklistPOST(
        request(READER, 'checklist', 'POST', { title: 'Reader write' }) as never,
        ctx(tripId) as never,
      ),
      await accommodationPOST(
        request(READER, 'accommodation', 'POST', {
          name: 'Reader hotel',
          checkIn: '2026-10-02T14:00:00.000Z',
          checkOut: '2026-10-03T12:00:00.000Z',
          currency: 'VND',
        }) as never,
        ctx(tripId) as never,
      ),
    ];
    expect(writeResponses.map((response) => response.status)).toEqual([403, 403, 403]);
  });

  it('allows an accepted EDIT collaborator to write private resources', async () => {
    const writeResponses = [
      await budgetPOST(
        request(EDITOR, 'budget', 'POST', {
          category: 'food',
          amount: 100_000,
          currency: 'VND',
          type: 'actual',
        }) as never,
        ctx(tripId) as never,
      ),
      await checklistPOST(
        request(EDITOR, 'checklist', 'POST', { title: 'Editor checklist' }) as never,
        ctx(tripId) as never,
      ),
      await accommodationPOST(
        request(EDITOR, 'accommodation', 'POST', {
          name: 'Editor hotel',
          checkIn: '2026-10-03T14:00:00.000Z',
          checkOut: '2026-10-04T12:00:00.000Z',
          currency: 'VND',
        }) as never,
        ctx(tripId) as never,
      ),
    ];
    expect(writeResponses.map((response) => response.status)).toEqual([201, 201, 201]);

    const db = await getDb();
    expect(await db.tripBudgets.find({ tripId })).toHaveLength(2);
    expect(await db.tripChecklists.find({ tripId })).toHaveLength(2);
    expect(await db.tripAccommodations.find({ tripId })).toHaveLength(2);
  });
});
