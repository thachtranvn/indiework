import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(120),
  emoji: z.string().max(16).nullish(),
  tagline: z.string().max(160).nullish(),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  emoji: z.string().max(16).nullish(),
  tagline: z.string().max(160).nullish(),
});
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
