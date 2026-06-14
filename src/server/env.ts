/**
 * Validated environment — fail fast at startup with a clear message.
 * Only ever imported by server code + node scripts (migrate/seed); never by
 * client components, so secrets stay out of the client bundle.
 */
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgres connection string'),
  APP_PASSWORD: z.string().min(1, 'APP_PASSWORD is required (the web login password)'),
  COOKIE_SECRET: z
    .string()
    .min(32, 'COOKIE_SECRET must be at least 32 chars (used to sign the session cookie)'),
  API_TOKEN: z.string().min(1, 'API_TOKEN is required (Bearer token for REST + MCP)'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
