/**
 * DB entry point — a single `db` (node-postgres pool) + `schema` that the
 * service layer imports. The service layer never imports `schema.ts` directly,
 * only this module.
 */
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, eq } from 'drizzle-orm';
import { Pool } from 'pg';
import { env } from '@/server/env';
import * as schema from './schema';

// Reuse the pool across hot-reloads in dev (avoid exhausting connections).
const globalForDb = globalThis as unknown as { __iwPool?: Pool };

const pool =
  globalForDb.__iwPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    // Keep TCP alive so idle connections aren't silently dropped (common
    // behind Docker/NAT on macOS), which otherwise surfaces as a one-off
    // "Connection terminated unexpectedly".
    keepAlive: true,
    idleTimeoutMillis: 30_000,
  });

// Swallow background pool errors so a dropped idle client is evicted and
// recycled instead of crashing the process.
pool.on('error', (err) => console.error('[db] idle client error:', err.message));

if (env.NODE_ENV !== 'production') globalForDb.__iwPool = pool;

export const db = drizzle(pool, { schema });
export { schema, pool };

export type DbClient = typeof db;
/** A transaction handle, as passed to the `db.transaction(async (tx) => …)` callback. */
export type DbTx = Parameters<Parameters<DbClient['transaction']>[0]>[0];

/**
 * Allocate the next per-project sequence number (docs/scope.md §2, spec §4.9).
 * Call inside the transaction that inserts/assigns the task. Single-user, so
 * never contended; the UPDATE … RETURNING is atomic regardless.
 */
export async function allocateSeq(tx: DbTx, projectId: string): Promise<number> {
  await tx
    .insert(schema.projectCounters)
    .values({ projectId, nextSeq: 1 })
    .onConflictDoNothing();

  const rows = await tx
    .update(schema.projectCounters)
    .set({ nextSeq: sql`${schema.projectCounters.nextSeq} + 1` })
    .where(eq(schema.projectCounters.projectId, projectId))
    .returning({ next: schema.projectCounters.nextSeq });

  // nextSeq now points at the *next* value; the allocated seq is next − 1.
  return rows[0].next - 1;
}
