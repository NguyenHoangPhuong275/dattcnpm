import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getDb } from '@/lib/db';
import type { Trip } from '@/lib/db';
import {
  getTripAccess,
  getTripForEdit,
  getTripForMemberView,
  getTripForView,
} from '@/lib/trip-permission';

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}));

const getDbMock = vi.mocked(getDb);
const acceptedAt = new Date('2026-07-10T00:00:00.000Z');

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    _id: 'trip-1',
    userId: 'owner-1',
    title: 'Hành trình',
    destination: 'Đà Nẵng',
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: new Date('2026-08-03T00:00:00.000Z'),
    isPublic: false,
    collaborators: [],
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  };
}

function mockTripLookup(trip: Trip | null): void {
  getDbMock.mockResolvedValue({
    trips: {
      findById: vi.fn().mockResolvedValue(trip),
    },
  } as never);
}

describe('getTripAccess', () => {
  it('ưu tiên quyền chủ sở hữu', () => {
    expect(getTripAccess('owner-1', makeTrip({ isPublic: true }))).toBe('OWNER');
  });

  it('phân biệt cộng tác viên đã chấp nhận theo quyền', () => {
    const trip = makeTrip({
      collaborators: [
        { userId: 'reader-1', permission: 'READ', invitedAt: acceptedAt, acceptedAt },
        { userId: 'editor-1', permission: 'EDIT', invitedAt: acceptedAt, acceptedAt },
      ],
    });

    expect(getTripAccess('reader-1', trip)).toBe('READ');
    expect(getTripAccess('editor-1', trip)).toBe('EDIT');
  });

  it('không cấp quyền thành viên cho lời mời đang chờ', () => {
    const privateTrip = makeTrip({
      collaborators: [
        { userId: 'pending-1', permission: 'EDIT', invitedAt: acceptedAt, acceptedAt: null },
        { userId: 'pending-2', permission: 'READ', invitedAt: acceptedAt },
      ],
    });
    const publicTrip = makeTrip({ ...privateTrip, isPublic: true });

    expect(getTripAccess('pending-1', privateTrip)).toBe('NONE');
    expect(getTripAccess('pending-2', privateTrip)).toBe('NONE');
    expect(getTripAccess('pending-1', publicTrip)).toBe('PUBLIC');
  });

  it('chỉ cấp quyền công khai cho người không phải thành viên', () => {
    expect(getTripAccess('other-1', makeTrip({ isPublic: true }))).toBe('PUBLIC');
    expect(getTripAccess('', makeTrip({ isPublic: true }))).toBe('PUBLIC');
    expect(getTripAccess('other-1', makeTrip())).toBe('NONE');
  });
});

describe('trip permission lookups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cho phép xem chuyến công khai qua getTripForView', async () => {
    const trip = makeTrip({ isPublic: true });
    mockTripLookup(trip);

    await expect(getTripForView('trip-1', 'other-1')).resolves.toBe(trip);
  });

  it('chỉ cho thành viên đã chấp nhận xem dữ liệu nhạy cảm', async () => {
    const trip = makeTrip({
      isPublic: true,
      collaborators: [
        { userId: 'reader-1', permission: 'READ', invitedAt: acceptedAt, acceptedAt },
      ],
    });
    mockTripLookup(trip);

    await expect(getTripForMemberView('trip-1', 'reader-1')).resolves.toBe(trip);
    await expect(getTripForMemberView('trip-1', 'other-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('không cho lời mời đang chờ xem dữ liệu nhạy cảm', async () => {
    const trip = makeTrip({
      isPublic: true,
      collaborators: [
        { userId: 'pending-1', permission: 'EDIT', invitedAt: acceptedAt, acceptedAt: null },
      ],
    });
    mockTripLookup(trip);

    await expect(getTripForMemberView('trip-1', 'pending-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('chỉ cho chủ sở hữu và cộng tác viên EDIT đã chấp nhận chỉnh sửa', async () => {
    const trip = makeTrip({
      isPublic: true,
      collaborators: [
        { userId: 'reader-1', permission: 'READ', invitedAt: acceptedAt, acceptedAt },
        { userId: 'editor-1', permission: 'EDIT', invitedAt: acceptedAt, acceptedAt },
        { userId: 'pending-1', permission: 'EDIT', invitedAt: acceptedAt, acceptedAt: null },
      ],
    });

    mockTripLookup(trip);
    await expect(getTripForEdit('trip-1', 'owner-1')).resolves.toBe(trip);

    mockTripLookup(trip);
    await expect(getTripForEdit('trip-1', 'editor-1')).resolves.toBe(trip);

    mockTripLookup(trip);
    await expect(getTripForEdit('trip-1', 'reader-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });

    mockTripLookup(trip);
    await expect(getTripForEdit('trip-1', 'pending-1')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });

  it('ẩn chuyến riêng tư và chuyến đã xóa', async () => {
    mockTripLookup(makeTrip());
    await expect(getTripForView('trip-1', 'other-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });

    mockTripLookup(makeTrip({ deletedAt: new Date('2026-07-10T00:00:00.000Z') }));
    await expect(getTripForView('trip-1', 'owner-1')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});
