'use server';

import { revalidatePath } from 'next/cache';
import { taskService, commentService } from '@/server/services';
import type { CreateTaskInput, UpdateTaskInput } from '@/server/validators/task';

function refresh() {
  revalidatePath('/app', 'layout');
}

export async function createTask(input: CreateTaskInput) {
  const task = await taskService.create(input);
  refresh();
  return task;
}

export async function updateTask(id: string, patch: UpdateTaskInput) {
  const task = await taskService.update(id, patch);
  refresh();
  return task;
}

export async function toggleTaskDone(id: string) {
  const task = await taskService.toggleDone(id);
  refresh();
  return task;
}

export async function setTaskStatusNote(id: string, note: string) {
  const task = await taskService.setStatusNote(id, { note });
  refresh();
  return task;
}

export async function assignTaskToProject(id: string, projectId: string) {
  const task = await taskService.assignToProject(id, projectId);
  refresh();
  return task;
}

export async function deleteTask(id: string) {
  await taskService.delete(id);
  refresh();
}

export async function reorderTasks(ids: string[]) {
  await taskService.reorder(ids);
  refresh();
}

export async function bulkUpdateTasks(ids: string[], patch: UpdateTaskInput) {
  await Promise.all(ids.map((id) => taskService.update(id, patch)));
  refresh();
}

export async function bulkDeleteTasks(ids: string[]) {
  await Promise.all(ids.map((id) => taskService.delete(id)));
  refresh();
}

export async function addTaskComment(taskId: string, body: string) {
  const comment = await commentService.add({ taskId, body }, 'web');
  refresh();
  return comment;
}
