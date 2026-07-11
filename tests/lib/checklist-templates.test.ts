import { describe, expect, it } from 'vitest';
import {
  CHECKLIST_TEMPLATES,
  CHECKLIST_TEMPLATE_IDS,
  getChecklistTemplate,
} from '@/data/checklist-templates';

describe('Bản mẫu checklist chuyến đi', () => {
  it('có đủ các loại hình tối thiểu', () => {
    for (const id of ['mountain', 'beach', 'abroad', 'business', 'resort']) {
      expect(CHECKLIST_TEMPLATE_IDS).toContain(id);
    }
  });

  it('id là duy nhất', () => {
    const ids = CHECKLIST_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('mỗi template có item không rỗng, không trùng, không khoảng trắng thừa', () => {
    for (const template of CHECKLIST_TEMPLATES) {
      expect(template.items.length).toBeGreaterThan(0);
      expect(template.name.trim()).toBeTruthy();
      const trimmed = template.items.map((i) => i.trim());
      expect(trimmed.every((i) => i.length > 0)).toBe(true);
      expect(new Set(trimmed).size).toBe(trimmed.length);
    }
  });

  it('getChecklistTemplate trả về đúng template / undefined', () => {
    expect(getChecklistTemplate('beach')?.id).toBe('beach');
    expect(getChecklistTemplate('khong-ton-tai')).toBeUndefined();
  });
});
