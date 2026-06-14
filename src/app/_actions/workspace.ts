'use server';

import { revalidatePath } from 'next/cache';
import { workspaceService } from '@/server/services';
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from '@/server/validators/workspace';

function refresh() {
  revalidatePath('/app', 'layout');
}

export async function createWorkspace(input: CreateWorkspaceInput) {
  const ws = await workspaceService.create(input);
  refresh();
  return ws;
}

export async function updateWorkspace(id: string, patch: UpdateWorkspaceInput) {
  const ws = await workspaceService.update(id, patch);
  refresh();
  return ws;
}
