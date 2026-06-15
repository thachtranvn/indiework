import { z } from 'zod';
import { ATTACHMENT_TYPE } from '@/lib/domain';

export const createAttachmentSchema = z.object({
  taskId: z.uuid(),
  name: z.string().trim().min(1, 'name is required').max(255),
  type: z.enum(ATTACHMENT_TYPE).default('file'),
  size: z.string().max(32).nullish(), // human-readable, e.g. "4.2 KB"
  ext: z.string().max(16).nullish(),
});
export type CreateAttachmentInput = z.infer<typeof createAttachmentSchema>;
