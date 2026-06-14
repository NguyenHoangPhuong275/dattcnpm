import { describe, expect, it } from 'vitest';

import { createTripSchema, updateTripSchema } from './trip';

const baseTrip = {
  title: 'Lịch trình Đà Nẵng',
  destination: 'Đà Nẵng',
};

describe('trip validation', () => {
  it('accepts only http/https coverImage URLs when creating or updating trips', () => {
    expect(createTripSchema.parse({
      ...baseTrip,
      coverImage: 'https://example.com/cover.jpg',
    }).coverImage).toBe('https://example.com/cover.jpg');

    expect(updateTripSchema.parse({
      coverImage: 'http://example.com/cover.jpg',
    }).coverImage).toBe('http://example.com/cover.jpg');

    expect(() => createTripSchema.parse({
      ...baseTrip,
      coverImage: 'javascript:alert(1)',
    })).toThrow();

    expect(() => updateTripSchema.parse({
      coverImage: 'data:image/svg+xml;base64,PHN2Zy8+',
    })).toThrow();
  });
});
