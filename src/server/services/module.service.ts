import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { createModuleSchema, updateModuleSchema } from '@/server/validators/module';
import { reorderSchema } from '@/server/validators/milestone';
import { notFound } from './errors';
import { definedKeys } from './util';

export const moduleService = {
  async list(projectId: string) {
    return db
      .select()
      .from(schema.modules)
      .where(
        and(eq(schema.modules.projectId, projectId), isNull(schema.modules.archivedAt)),
      )
      .orderBy(asc(schema.modules.position), asc(schema.modules.createdAt));
  },

  async create(input: unknown) {
    const data = createModuleSchema.parse(input);
    const [{ next }] = await db
      .select({ next: sql<number>`coalesce(max(${schema.modules.position}), -1) + 1` })
      .from(schema.modules)
      .where(eq(schema.modules.projectId, data.projectId));
    const [row] = await db
      .insert(schema.modules)
      .values({ ...data, position: data.position ?? next })
      .returning();
    return row;
  },

  async update(id: string, input: unknown) {
    const data = updateModuleSchema.parse(input);
    const [row] = await db
      .update(schema.modules)
      .set({ ...definedKeys(data), updatedAt: new Date() })
      .where(eq(schema.modules.id, id))
      .returning();
    if (!row) throw notFound('module');
    return row;
  },

  async archive(id: string) {
    const [row] = await db
      .update(schema.modules)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.modules.id, id))
      .returning();
    if (!row) throw notFound('module');
    return row;
  },

  /** Persist a new order: positions become the index in `ids`. */
  async reorder(input: unknown) {
    const { ids } = reorderSchema.parse(input);
    await db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(schema.modules)
          .set({ position: i, updatedAt: new Date() })
          .where(eq(schema.modules.id, ids[i]));
      }
    });
    return { ok: true };
  },
};
