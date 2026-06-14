import { asc, eq } from 'drizzle-orm';
import { db, schema } from '@/server/db';
import { addCommentSchema } from '@/server/validators/comment';
import type { CommentSource } from '@/lib/domain';
import { notFound } from './errors';

export const commentService = {
  async list(taskId: string) {
    return db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.taskId, taskId))
      .orderBy(asc(schema.comments.createdAt));
  },

  /** Append a comment to a task's timeline. `source` records where it came from. */
  async add(input: unknown, defaultSource: CommentSource = 'web') {
    const data = addCommentSchema.parse(input);

    const [task] = await db
      .select({ id: schema.tasks.id })
      .from(schema.tasks)
      .where(eq(schema.tasks.id, data.taskId))
      .limit(1);
    if (!task) throw notFound('task');

    const [row] = await db
      .insert(schema.comments)
      .values({ taskId: data.taskId, body: data.body, source: data.source ?? defaultSource })
      .returning();
    return row;
  },
};
