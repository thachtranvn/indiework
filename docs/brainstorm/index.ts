/**
 * DB entry point. Picks the driver from env (DB_DRIVER=sqlite|postgres)
 * and exports a single `db` + `schema` the service layer imports.
 *
 * The service layer NEVER imports a dialect schema directly — only this
 * file — so swapping drivers is one env var.
 *
 * Default = sqlite (open-source / easy self-host).
 */

import * as sqliteSchema from './schema.sqlite';
import * as pgSchema from './schema.postgres';

const driver = (process.env.DB_DRIVER ?? 'sqlite') as 'sqlite' | 'postgres';

// NOTE: the two schemas are structurally identical, so the exported
// `schema` shape is the same regardless of driver. Service code uses
// `schema.tasks`, `schema.projects`, … without caring which dialect.

function createDb() {
  if (driver === 'postgres') {
    // lazy require so sqlite-only deploys don't need pg installed
    const { drizzle } = require('drizzle-orm/node-postgres');
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return {
      db: drizzle(pool, { schema: pgSchema }),
      schema: pgSchema,
    };
  }

  // sqlite (default)
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const Database = require('better-sqlite3');
  const sqlite = new Database(process.env.SQLITE_PATH ?? './data/pm.db');
  // single-user but 3 frontends (web/api/mcp) can write → WAL + busy_timeout
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('foreign_keys = ON');
  return {
    db: drizzle(sqlite, { schema: sqliteSchema }),
    schema: sqliteSchema,
  };
}

export const { db, schema } = createDb();
export const DB_DRIVER = driver;

/**
 * Example: portable per-project seq allocation (§4.9).
 * Works on BOTH dialects — UPDATE ... RETURNING is supported by
 * sqlite (>=3.35) and postgres. Single-writer (sqlite) or row-level
 * (postgres) both make this atomic. One user → never contended.
 *
 * Call inside the same transaction that inserts/assigns the task.
 */
export async function allocateSeq(tx: any, projectId: number): Promise<number> {
  // upsert counter row then bump it atomically
  await tx
    .insert(schema.projectCounters)
    .values({ projectId, nextSeq: 1 })
    .onConflictDoNothing();

  const rows = await tx
    .update(schema.projectCounters)
    .set({ nextSeq: sqlIncrement() })
    .where(eqProject(tx, projectId))
    .returning({ next: schema.projectCounters.nextSeq });

  // nextSeq now points at the *next* value; the allocated seq is next-1
  return rows[0].next - 1;
}

// helpers kept tiny + dialect-agnostic via drizzle expressions
import { sql, eq } from 'drizzle-orm';
function sqlIncrement() {
  return sql`${schema.projectCounters.nextSeq} + 1`;
}
function eqProject(_tx: any, projectId: number) {
  return eq(schema.projectCounters.projectId, projectId);
}
