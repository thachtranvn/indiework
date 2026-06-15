import type { TaskDto } from '@/server/services';

/**
 * Optimistic update helpers for task lists/boards.
 *
 * The server actions in `_actions/tasks.ts` already `revalidatePath('/app','layout')`,
 * so the authoritative `tasks` prop re-flows after each mutation. These reducers only
 * bridge the gap *until* that fresh data lands, so a drag/checkbox/bulk edit paints
 * instantly instead of waiting on the round-trip. See ADR 0002.
 *
 * `done` is a derived field (`status === 'done'`) — every status change here keeps it
 * in sync the same way the service does.
 */

/** The subset of fields an optimistic patch may touch (board drag, bulk edit). */
export type TaskPatchFields = Partial<Pick<TaskDto, 'status' | 'priority' | 'moduleId' | 'milestoneId' | 'title'>>;

export type OptimisticTaskAction =
  | { kind: 'patch'; ids: readonly string[]; patch: TaskPatchFields }
  | { kind: 'toggleDone'; id: string }
  | { kind: 'remove'; ids: readonly string[] };

/**
 * The `{ status, done }` pair after flipping the done circle the way
 * `taskService.toggleDone` does (done ⇄ todo). Returns only the changed fields so
 * callers can spread it onto any task-shaped record without widening its type.
 */
export function toggledDone(status: TaskDto['status']): Pick<TaskDto, 'status' | 'done'> {
  const next: TaskDto['status'] = status === 'done' ? 'todo' : 'done';
  return { status: next, done: next === 'done' };
}

/** Pure reducer for `useOptimistic` over a list of tasks. */
export function applyTaskOptimistic(tasks: readonly TaskDto[], action: OptimisticTaskAction): TaskDto[] {
  switch (action.kind) {
    case 'remove': {
      const drop = new Set(action.ids);
      return tasks.filter((t) => !drop.has(t.id));
    }
    case 'toggleDone':
      return tasks.map((t) => (t.id === action.id ? { ...t, ...toggledDone(t.status) } : t));
    case 'patch': {
      const ids = new Set(action.ids);
      return tasks.map((t) => {
        if (!ids.has(t.id)) return t;
        const next = { ...t, ...action.patch };
        // status drives the derived `done` flag — recompute when it changes.
        return action.patch.status !== undefined ? { ...next, done: action.patch.status === 'done' } : next;
      });
    }
  }
}
