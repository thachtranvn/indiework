import { z } from 'zod';
import { MILESTONE_STATUS } from '@/lib/domain';

export const createMilestoneSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(1, 'name is required').max(160),
  description: z.string().nullish(),
  status: z.enum(MILESTONE_STATUS).optional(),
  targetDate: z.coerce.date().nullish(),
  position: z.number().int().optional(),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().nullish(),
  status: z.enum(MILESTONE_STATUS).optional(),
  targetDate: z.coerce.date().nullish(),
  position: z.number().int().optional(),
});
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

export const reorderSchema = z.object({
  ids: z.array(z.uuid()).min(1),
});
export type ReorderInput = z.infer<typeof reorderSchema>;
