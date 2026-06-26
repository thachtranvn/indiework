import { sql, type Column, type SQL } from 'drizzle-orm';

/** Keep only keys whose value is not `undefined` (a `null` is kept → clears the field). */
export function definedKeys<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

/**
 * Build a single `CASE … END` value mapping each id to its index in `ids`, so a
 * reorder collapses into ONE `UPDATE … SET position = CASE … END WHERE id IN
 * (ids)` statement instead of N sequential per-row updates (PP-B3). Pass the
 * table's own id column and use with `.where(inArray(idColumn, ids))`. Standard
 * SQL — works on both the pg and libsql drivers.
 *
 * The index is inlined as an integer *literal* (`sql.raw`), not a bound param:
 * Postgres can't infer the type of an untyped `$n` inside `CASE … THEN`, so it
 * rejects assigning the result to the integer `position` column (error 42804).
 * `i` is a loop index (non-negative integer), so inlining it is injection-safe.
 */
export function positionByOrder(idColumn: Column, ids: readonly string[]): SQL {
  return sql`case ${sql.join(
    ids.map((id, i) => sql`when ${idColumn} = ${id} then ${sql.raw(String(i))}`),
    sql` `,
  )} end`;
}
