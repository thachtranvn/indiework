/**
 * Idempotent seed: ensure one default workspace exists so the app shell always
 * has a workspace to render. Run via `pnpm db:seed`.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required to seed');

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  const existing = await db.select({ id: schema.workspaces.id }).from(schema.workspaces).limit(1);
  if (existing.length === 0) {
    await db.insert(schema.workspaces).values({
      name: 'My Workspace',
      emoji: '◈',
      tagline: 'personal projects',
    });
    console.info('✓ seeded default workspace');
  } else {
    console.info('• workspace already present, nothing to seed');
  }

  await pool.end();
}

main().catch((err) => {
  console.error('✗ seed failed:', err);
  process.exit(1);
});
