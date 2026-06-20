'use server';

/** Read-only actions callable from client components (detail panel, palette). */
import { taskService, projectService, ServiceError } from '@/server/services';
import { requireSession } from '@/server/auth/require-session';
import { assembleTaskDetail } from '@/server/task-detail';

// Local type alias (not a re-export of an imported binding — a `'use server'`
// module turns `export { X }` into a runtime action lookup, which crashes for an
// erased type). The non-null detail shape; the resolvers below add `| null`.
export type TaskDetail = Awaited<ReturnType<typeof assembleTaskDetail>>;

/**
 * Resolve a task detail, mapping a genuine "no such task" to `null`. Every other
 * failure (auth, DB, or a Server Action version-skew 404 from a tab left open
 * across a deploy) is rethrown — so the UI can tell a deleted task apart from a
 * transient load error instead of mislabeling both as "no longer exists".
 */
async function resolveDetail(load: () => Promise<TaskDetail>): Promise<TaskDetail | null> {
  try {
    return await load();
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'not_found') return null;
    throw e;
  }
}

export async function getTaskDetail(id: string): Promise<TaskDetail | null> {
  await requireSession();
  return resolveDetail(async () => assembleTaskDetail(await taskService.getById(id)));
}

/** Resolve a detail panel from a public ref ("IW-11") — the path-URL scheme. */
export async function getTaskDetailByRef(ref: string): Promise<TaskDetail | null> {
  await requireSession();
  return resolveDetail(async () => assembleTaskDetail(await taskService.getByRef(ref)));
}

export async function loadSearchIndex() {
  await requireSession();
  const [projects, tasks] = await Promise.all([
    projectService.list(),
    taskService.list({}),
  ]);
  return {
    projects: projects.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      emoji: p.emoji,
      shortDesc: p.shortDesc,
    })),
    tasks: tasks
      .filter((t) => !t.parentId) // search operates on root tasks only
      .map((t) => ({
        id: t.id,
        title: t.title,
        ref: t.ref,
        projectId: t.projectId,
        done: t.done,
      })),
  };
}
export type SearchIndex = Awaited<ReturnType<typeof loadSearchIndex>>;
