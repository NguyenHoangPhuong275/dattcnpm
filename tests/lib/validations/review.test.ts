import { describe, expect, it } from 'vitest';

import { createReviewSchema, updateReviewSchema } from '@/lib/validations/review';

const placeId = '507f1f77bcf86cd799439011';

describe('review validation', () => {
  it('accepts a bounded list of http(s) image URLs', () => {
    const parsed = createReviewSchema.parse({
      placeId,
      rating: 5,
      images: ['https://example.com/a.jpg', 'http://example.com/b.png'],
    });
    expect(parsed.images).toEqual(['https://example.com/a.jpg', 'http://example.com/b.png']);
  });

  it('rejects more than 10 images', () => {
    const images = Array.from({ length: 11 }, (_, i) => `https://example.com/${i}.jpg`);
    expect(() => createReviewSchema.parse({ placeId, rating: 4, images })).toThrow();
    expect(() => updateReviewSchema.parse({ images })).toThrow();
  });

  it('rejects an image URL longer than 2048 characters', () => {
    const huge = `https://example.com/${'a'.repeat(3000)}.jpg`;
    expect(() => createReviewSchema.parse({ placeId, rating: 4, images: [huge] })).toThrow();
  });

  it('rejects non-http(s) image values', () => {
    expect(() =>
      createReviewSchema.parse({ placeId, rating: 4, images: ['data:image/png;base64,AAAA'] }),
    ).toThrow();
  });
});
