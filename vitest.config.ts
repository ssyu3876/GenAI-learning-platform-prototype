import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // scripts/: pure helpers of the seed, such as scripts/seed/match-rows.ts
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
