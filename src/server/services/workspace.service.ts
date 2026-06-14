import { eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from '@/server/validators/workspace';
import { notFound } from './errors';
import { definedKeys } from './util';

export const workspaceService = {
  async list() {
    return db.select().from(schema.workspaces).orderBy(schema.workspaces.createdAt);
  },

  async get(id: string) {
    const [row] = await db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, id))
      .limit(1);
    if (!row) throw notFound('workspace');
    return row;
  },

  /** The default workspace (first by creation) — the single-user home. */
  async getDefault() {
    const [row] = await db
      .select()
      .from(schema.workspaces)
      .orderBy(schema.workspaces.createdAt)
      .limit(1);
    return row ?? null;
  },

  async create(input: unknown) {
    const data = createWorkspaceSchema.parse(input);
    const [row] = await db.insert(schema.workspaces).values(data).returning();
    return row;
  },

  async update(id: string, input: unknown) {
    const data = updateWorkspaceSchema.parse(input);
    const patch = definedKeys(data);
    const [row] = await db
      .update(schema.workspaces)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(schema.workspaces.id, id))
      .returning();
    if (!row) throw notFound('workspace');
    return row;
  },
};
