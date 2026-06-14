/**
 * Apply pending migrations. Run via `pnpm db:migrate` (Node --env-file=.env).
 * Standalone (only needs DATABASE_URL) so it runs in the Docker entrypoint
 * before the app boots.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required to run migrations');

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.info('✓ migrations applied');
}

main().catch((err) => {
  console.error('✗ migration failed:', err);
  process.exit(1);
});
