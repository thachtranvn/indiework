import { randomBytes, createHash } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/server/db';
import { API_KEY_SCOPE } from '@/lib/domain';
import { notFound } from './errors';

const PREFIX = 'iw_live_';

const createApiKeySchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(80),
  scope: z.enum(API_KEY_SCOPE).optional(),
});

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

/** Public shape: never exposes the hash. */
function toPublic(row: typeof schema.apiKeys.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    scope: row.scope,
    prefix: row.prefix,
    tail: row.tail,
    masked: `${row.prefix}${'•'.repeat(12)}${row.tail}`,
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
  };
}
export type ApiKeyPublic = ReturnType<typeof toPublic>;

export const apiKeyService = {
  async list(): Promise<ApiKeyPublic[]> {
    const rows = await db.select().from(schema.apiKeys).orderBy(desc(schema.apiKeys.createdAt));
    return rows.map(toPublic);
  },

  /** Create a key; returns the public row PLUS the one-time full secret. */
  async create(input: unknown): Promise<{ key: ApiKeyPublic; secret: string }> {
    const data = createApiKeySchema.parse(input);
    const secret = randomBytes(24).toString('base64url');
    const full = `${PREFIX}${secret}`;
    const tail = secret.slice(-4);
    const [row] = await db
      .insert(schema.apiKeys)
      .values({
        name: data.name,
        prefix: PREFIX,
        hash: sha256(full),
        tail,
        scope: data.scope ?? 'read-write',
      })
      .returning();
    return { key: toPublic(row), secret: full };
  },

  async revoke(id: string): Promise<{ ok: true }> {
    const [row] = await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id)).returning();
    if (!row) throw notFound('api key');
    return { ok: true };
  },

  /** Verify a presented secret against stored hashes (for future Bearer use). */
  async verify(fullToken: string): Promise<boolean> {
    const hash = sha256(fullToken);
    const [row] = await db
      .select({ id: schema.apiKeys.id })
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.hash, hash))
      .limit(1);
    if (!row) return false;
    await db
      .update(schema.apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.apiKeys.id, row.id));
    return true;
  },
};
