import { describe, expect, it } from 'vitest';

import {
  assertRunDatabaseUri,
  createRunDatabaseUri,
  getDatabaseName,
} from '../database-safety';

describe('database safety', () => {
  it('tạo tên database test riêng không vượt giới hạn Atlas', () => {
    const uri = createRunDatabaseUri(
      'mongodb://localhost:27017/smart_travel_guide_test',
      'test',
    );
    const databaseName = assertRunDatabaseUri(uri, 'test');

    expect(Buffer.byteLength(databaseName, 'utf8')).toBeLessThanOrEqual(38);
    expect(databaseName).toMatch(/^smart_travel_guide_test_run_[a-z0-9]{10}$/);
  });

  it('từ chối database có tên môi trường không an toàn', () => {
    expect(() => createRunDatabaseUri(
      'mongodb://localhost:27017/smart_travel_prod_test',
      'test',
    )).toThrow('unsafe');
  });

  it('chỉ chấp nhận database đúng run hiện tại', () => {
    expect(() => assertRunDatabaseUri(
      'mongodb://localhost:27017/smart_travel_guide_test',
      'test',
    )).toThrow('current test run');
    expect(getDatabaseName('mongodb://localhost:27017/smart_travel_guide_e2e')).toBe(
      'smart_travel_guide_e2e',
    );
  });
});
