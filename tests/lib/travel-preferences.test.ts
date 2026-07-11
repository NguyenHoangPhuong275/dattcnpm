import { describe, expect, it } from 'vitest';

import {
  normalizeBudgetLevel,
  normalizeTravelInterests,
  normalizeTravelStyles,
} from '@/lib/travel-preferences';
import { updatePreferencesSchema } from '@/lib/validations/preferences';
import { updateProfileSchema } from '@/lib/validations/profile';

describe('travel preferences', () => {
  it('chuẩn hóa các mức chi tiêu cũ về mã ổn định', () => {
    expect(normalizeBudgetLevel('Tiết kiệm')).toBe('budget');
    expect(normalizeBudgetLevel('Thấp')).toBe('budget');
    expect(normalizeBudgetLevel('Trung bình')).toBe('mid');
    expect(normalizeBudgetLevel('Thoải mái')).toBe('comfortable');
    expect(normalizeBudgetLevel('Cao')).toBe('luxury');
    expect(normalizeBudgetLevel('Sang trọng')).toBe('luxury');
    expect(normalizeBudgetLevel('low')).toBe('budget');
    expect(normalizeBudgetLevel('high')).toBe('luxury');
  });

  it('chuẩn hóa nhãn tiếng Việt và giá trị cũ của giao diện', () => {
    expect(normalizeTravelInterests(['Biển', 'Thiên nhiên', 'Spa & Nghỉ dưỡng'])).toEqual([
      'beach',
      'nature',
      'wellness',
    ]);
    expect(normalizeTravelStyles(['Solo', 'Family', 'Adventure', 'Relax'])).toEqual([
      'solo',
      'family',
      'adventure',
      'relax',
    ]);
  });

  it('profile và preferences dùng chung một hợp đồng dữ liệu', () => {
    const profile = updateProfileSchema.parse({
      interests: ['Biển', 'beach'],
      travelStyles: ['Một mình'],
      budgetLevel: 'Trung bình',
      preferredDestinations: ['Đà Lạt'],
    });
    const preferences = updatePreferencesSchema.parse({
      interests: ['Biển', 'beach'],
      travelStyles: ['Một mình'],
      budgetLevel: 'Trung bình',
      preferredDestinations: ['Đà Lạt'],
    });

    const expected = {
      interests: ['beach'],
      travelStyles: ['solo'],
      budgetLevel: 'mid',
      preferredDestinations: ['Đà Lạt'],
    };
    expect(profile).toMatchObject(expected);
    expect(preferences).toEqual(expected);
  });

  it('từ chối giá trị không thuộc hợp đồng', () => {
    expect(updatePreferencesSchema.safeParse({ budgetLevel: 'không xác định' }).success).toBe(false);
    expect(updatePreferencesSchema.safeParse({ interests: ['không xác định'] }).success).toBe(false);
    expect(updatePreferencesSchema.safeParse({ travelStyles: ['không xác định'] }).success).toBe(false);
  });
});
