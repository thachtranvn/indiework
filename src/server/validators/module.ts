import { z } from 'zod';

export const createModuleSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(1, 'name is required').max(120),
  color: z.string().max(32).nullish(),
  position: z.number().int().optional(),
});
export type CreateModuleInput = z.infer<typeof createModuleSchema>;

export const updateModuleSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  color: z.string().max(32).nullish(),
  position: z.number().int().optional(),
});
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
