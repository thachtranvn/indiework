/**
 * RSC data loaders — plain async functions called directly from server
 * components (layouts/pages). Not server actions; they only read.
 */
import {
  workspaceService,
  projectService,
  moduleService,
  milestoneService,
  taskService,
} from '@/server/services';

export async function loadShell() {
  const [workspaces, projects, inbox] = await Promise.all([
    workspaceService.list(),
    projectService.list(),
    taskService.listInbox(),
  ]);
  return {
    workspaces,
    activeWorkspace: workspaces[0] ?? null,
    projects,
    inboxCount: inbox.length,
  };
}
export type ShellData = Awaited<ReturnType<typeof loadShell>>;

/** Everything a project's screens need: project, its modules, milestones, tasks. */
export async function loadProject(projectKey: string) {
  const project = await projectService.getByKey(projectKey);
  const [modules, milestones, tasks] = await Promise.all([
    moduleService.list(project.id),
    milestoneService.list(project.id),
    taskService.list({ projectId: project.id }),
  ]);
  return { project, modules, milestones, tasks };
}
export type ProjectData = Awaited<ReturnType<typeof loadProject>>;
