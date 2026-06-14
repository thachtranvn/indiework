'use server';

/** Read-only actions callable from client components (detail panel, palette). */
import {
  taskService,
  commentService,
  moduleService,
  milestoneService,
  projectService,
} from '@/server/services';

export async function getTaskDetail(id: string) {
  const task = await taskService.getById(id);
  const [comments, modules, milestones] = await Promise.all([
    commentService.list(id),
    task.projectId ? moduleService.list(task.projectId) : Promise.resolve([]),
    task.projectId ? milestoneService.list(task.projectId) : Promise.resolve([]),
  ]);
  return { task, comments, modules, milestones };
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
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      ref: t.ref,
      projectId: t.projectId,
      done: t.done,
    })),
  };
}
export type SearchIndex = Awaited<ReturnType<typeof loadSearchIndex>>;
