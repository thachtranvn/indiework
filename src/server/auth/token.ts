/**
 * Bearer-token auth for the REST API and MCP server.
 * Static `.ENV` API_TOKEN for now; managed `api_keys` arrive in Phase 4.
 */
import { env } from '@/server/env';
import type { CommentSource } from '@/lib/domain';

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Extract and verify the Bearer token from an Authorization header. */
export function bearerOk(authHeader: string | null | undefined): boolean {
  if (!authHeader) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return false;
  return constantTimeEqual(match[1], env.API_TOKEN);
}

/** Guard a Request; returns true when the caller presented the valid token. */
export function requireBearer(req: Request): boolean {
  return bearerOk(req.headers.get('authorization'));
}

export const API_COMMENT_SOURCE: CommentSource = 'api';
export const MCP_COMMENT_SOURCE: CommentSource = 'agent';
