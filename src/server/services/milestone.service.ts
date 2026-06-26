import { asc, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  reorderSchema,
} from '@/server/validators/milestone';
import type { MilestoneStatus } from '@/lib/domain';
import { notFound } from './errors';
import { definedKeys, positionByOrder } from './util';

export const milestoneService = {
  async list(projectId: string) {
    return db
      .select()
      .from(schema.milestones)
      .where(eq(schema.milestones.projectId, projectId))
      .orderBy(asc(schema.milestones.position), asc(schema.milestones.createdAt));
  },

  async create(input: unknown) {
    const data = createMilestoneSchema.parse(input);
    const [{ next }] = await db
      .select({ next: sql<number>`coalesce(max(${schema.milestones.position}), -1) + 1` })
      .from(schema.milestones)
      .where(eq(schema.milestones.projectId, data.projectId));
    const [row] = await db
      .insert(schema.milestones)
      .values({ ...data, position: data.position ?? next })
      .returning();
    return row;
  },

  async update(id: string, input: unknown) {
    const data = updateMilestoneSchema.parse(input);
    const [row] = await db
      .update(schema.milestones)
      .set({ ...definedKeys(data), updatedAt: new Date() })
      .where(eq(schema.milestones.id, id))
      .returning();
    if (!row) throw notFound('milestone');
    return row;
  },

  async setStatus(id: string, status: MilestoneStatus) {
    const [row] = await db
      .update(schema.milestones)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.milestones.id, id))
      .returning();
    if (!row) throw notFound('milestone');
    return row;
  },

  async remove(id: string) {
    const [row] = await db
      .delete(schema.milestones)
      .where(eq(schema.milestones.id, id))
      .returning();
    if (!row) throw notFound('milestone');
    return { ok: true };
  },

  async reorder(input: unknown) {
    const { ids } = reorderSchema.parse(input);
    // PP-B3: one bulk CASE update, not N sequential per-row updates.
    if (ids.length > 0) {
      await db
        .update(schema.milestones)
        .set({ position: positionByOrder(schema.milestones.id, ids), updatedAt: new Date() })
        .where(inArray(schema.milestones.id, ids));
    }
    return { ok: true };
  },
};
