import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Load .env into process.env so integration tests reach the local Postgres.
try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional (e.g. CI provides env directly).
}

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['tests/**/*.test.ts'],
    env: { ...process.env } as Record<string, string>,
    // Integration tests share one Postgres; run files serially to avoid races.
    fileParallelism: false,
    hookTimeout: 20000,
  },
});
