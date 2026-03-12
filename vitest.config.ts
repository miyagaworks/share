import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
    exclude: ['node_modules', '.next', 'backup_financial_features'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'middleware.ts', 'app/api/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.test.ts'],
    },
  },
});
