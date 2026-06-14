'use server';

import { revalidatePath } from 'next/cache';
import { moduleService, milestoneService } from '@/server/services';
import type { CreateModuleInput, UpdateModuleInput } from '@/server/validators/module';
import type { CreateMilestoneInput, UpdateMilestoneInput } from '@/server/validators/milestone';
import type { MilestoneStatus } from '@/lib/domain';

function refresh() {
  revalidatePath('/app', 'layout');
}

// ---- modules ----
export async function createModule(input: CreateModuleInput) {
  const m = await moduleService.create(input);
  refresh();
  return m;
}
export async function updateModule(id: string, patch: UpdateModuleInput) {
  const m = await moduleService.update(id, patch);
  refresh();
  return m;
}
export async function archiveModule(id: string) {
  await moduleService.archive(id);
  refresh();
}
export async function reorderModules(ids: string[]) {
  await moduleService.reorder({ ids });
  refresh();
}

// ---- milestones ----
export async function createMilestone(input: CreateMilestoneInput) {
  const m = await milestoneService.create(input);
  refresh();
  return m;
}
export async function updateMilestone(id: string, patch: UpdateMilestoneInput) {
  const m = await milestoneService.update(id, patch);
  refresh();
  return m;
}
export async function setMilestoneStatus(id: string, status: MilestoneStatus) {
  const m = await milestoneService.setStatus(id, status);
  refresh();
  return m;
}
export async function deleteMilestone(id: string) {
  await milestoneService.remove(id);
  refresh();
}
export async function reorderMilestones(ids: string[]) {
  await milestoneService.reorder({ ids });
  refresh();
}
