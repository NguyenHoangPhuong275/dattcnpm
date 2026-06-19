import { describe, expect, it } from 'vitest';
import { Trip } from '@/lib/db/models/trip.model';
import { User } from '@/lib/db/models/user.model';
import { Review } from '@/lib/db/models/review.model';

function hasIndex(schemaIndexes: Array<[Record<string, unknown>, unknown]>, expected: Record<string, number>): boolean {
  const expectedKeys = Object.keys(expected);
  return schemaIndexes.some(([fields]) => {
    const keys = Object.keys(fields);
    if (keys.length !== expectedKeys.length) return false;
    return expectedKeys.every((k) => fields[k] === expected[k]);
  });
}

describe('soft-delete compound indexes (Task 1.5)', () => {
  it('Trip declares { userId, deletedAt }', () => {
    expect(hasIndex(Trip.schema.indexes() as never, { userId: 1, deletedAt: 1 })).toBe(true);
  });

  it('Trip declares { deletedAt, startDate } for the weather cron scan', () => {
    expect(hasIndex(Trip.schema.indexes() as never, { deletedAt: 1, startDate: 1 })).toBe(true);
  });

  it('User declares { email, deletedAt }', () => {
    expect(hasIndex(User.schema.indexes() as never, { email: 1, deletedAt: 1 })).toBe(true);
  });

  it('Review declares { userId, deletedAt }', () => {
    expect(hasIndex(Review.schema.indexes() as never, { userId: 1, deletedAt: 1 })).toBe(true);
  });
});
