import { z } from 'zod';
import { PROJECT_STATUS, PROJECT_KEY_REGEX } from '@/lib/domain';

const keySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(PROJECT_KEY_REGEX, 'key must be 2–10 chars, A–Z then A–Z/0–9 (e.g. "DISK")');

export const createProjectSchema = z.object({
  key: keySchema,
  name: z.string().trim().min(1, 'name is required').max(120),
  workspaceId: z.uuid().nullish(),
  emoji: z.string().max(16).nullish(),
  color: z.string().max(32).nullish(),
  status: z.enum(PROJECT_STATUS).optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  shortDesc: z.string().max(280).nullish(),
  statusNote: z.string().max(2000).nullish(),
  description: z.string().nullish(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  workspaceId: z.uuid().nullish(),
  emoji: z.string().max(16).nullish(),
  color: z.string().max(32).nullish(),
  status: z.enum(PROJECT_STATUS).optional(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  shortDesc: z.string().max(280).nullish(),
  statusNote: z.string().max(2000).nullish(),
  description: z.string().nullish(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const setProjectStatusNoteSchema = z.object({ note: z.string().max(2000) });
