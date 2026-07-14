import { describe, expect, it } from 'vitest';

import { buildDestinationEditorialContent } from '@/lib/destination-content';
import { getTourismDestinationById, getTourismDestinationsByRegion } from '@/lib/vietnam-tourism';

describe('destination editorial content', () => {
  it('tạo nội dung thiên nhiên đầy đủ mà không hiển thị lại keyword thô', () => {
    const destination = getTourismDestinationById('kon-tum-inh-ngoc-linh');
    expect(destination).not.toBeNull();
    if (!destination) return;

    const related = getTourismDestinationsByRegion(destination.province)
      .filter((item) => item.id !== destination.id)
      .slice(0, 3);
    const content = buildDestinationEditorialContent(destination, related);
    const serialized = JSON.stringify(content);

    expect(content.overviewParagraphs).toHaveLength(2);
    expect(content.experienceItems).toHaveLength(3);
    expect(content.preparationItems).toHaveLength(3);
    expect(content.relatedParagraph).toContain(related[0].name);
    expect(serialized).not.toContain('chụp ảnh');
  });

  it('tạo fallback an toàn khi địa điểm không có keyword hoặc điểm liên quan', () => {
    const destination = {
      id: 'test-destination',
      name: 'Điểm đến thử nghiệm',
      province: 'Việt Nam',
      description: 'Thông tin giới thiệu.',
      rating: '',
      image: '',
      keywords: [],
    };
    const content = buildDestinationEditorialContent(destination, []);

    expect(content.experienceItems.every((item) => item.title && item.description)).toBe(true);
    expect(content.preparationItems.every((item) => item.title && item.description)).toBe(true);
    expect(content.relatedParagraph).toContain('Việt Nam');
  });
});
