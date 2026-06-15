'use server';

/** Read-only actions callable from client components (detail panel, palette). */
import {
  taskService,
  commentService,
  moduleService,
  milestoneService,
  projectService,
  attachmentService,
} from '@/server/services';

export async function getTaskDetail(id: string) {
  const task = await taskService.getById(id);
  const [comments, modules, milestones, rawChildren, parent, attachments] = await Promise.all([
    commentService.list(id),
    task.projectId ? moduleService.list(task.projectId) : Promise.resolve([]),
    task.projectId ? milestoneService.list(task.projectId) : Promise.resolve([]),
    taskService.listChildren(id),
    task.parentId ? taskService.getById(task.parentId) : Promise.resolve(null),
    attachmentService.list(id),
  ]);

  // dot-ref for this task when it's a sub-task ("PARENT.N" by sibling order)
  let displayRef = task.ref;
  if (parent) {
    const sibs = await taskService.listChildren(parent.id);
    const idx = sibs.findIndex((s) => s.id === id);
    displayRef = parent.ref && idx >= 0 ? `${parent.ref}.${idx + 1}` : null;
  }
  // dot-refs for this task's own children
  const children = rawChildren.map((c, i) => ({ ...c, displayRef: task.ref ? `${task.ref}.${i + 1}` : null }));

  return { task, displayRef, parent, children, comments, modules, milestones, attachments };
}
export type TaskDetail = Awaited<ReturnType<typeof getTaskDetail>>;

export async function loadSearchIndex() {
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
