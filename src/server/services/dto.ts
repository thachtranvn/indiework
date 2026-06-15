/** Shared DTO shapes returned by services (enriched with derived fields). */
import type { tasks } from '@/server/db/schema';
import { buildRef } from '@/lib/domain';

export type TaskRow = typeof tasks.$inferSelect;

/** A task as returned to callers: adds the public `ref` and derived `done`. */
export type TaskDto = TaskRow & {
  ref: string | null; // "DISK-3" for project tasks; null while in Inbox
  done: boolean; // derived: status === 'done'
  attachmentCount: number; // 0 unless populated by list()
};

export function toTaskDto(row: TaskRow, projectKey: string | null, attachmentCount = 0): TaskDto {
  return {
    ...row,
    done: row.status === 'done',
    ref: projectKey && row.seq != null ? buildRef(projectKey, row.seq) : null,
    attachmentCount,
  };
}
