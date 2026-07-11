import path from 'node:path';
import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setupEnv.ts'],
    globalSetup: ['./tests/globalSetup.ts'],
    hookTimeout: 30000,
    // Task 3: chạy các file test tuần tự (serial) để loại race giữa các file dùng chung Mongo/Redis.
    // Kết hợp với DB-per-worker (setupEnv) + cleanup scoped trong afterEach của từng suite integration.
    fileParallelism: false,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
