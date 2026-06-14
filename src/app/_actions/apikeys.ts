'use server';

import { revalidatePath } from 'next/cache';
import { apiKeyService } from '@/server/services';
import type { ApiKeyScope } from '@/lib/domain';

export async function createApiKey(name: string, scope: ApiKeyScope) {
  const result = await apiKeyService.create({ name, scope });
  revalidatePath('/app/settings');
  return result; // { key, secret } — secret shown once
}

export async function revokeApiKey(id: string) {
  await apiKeyService.revoke(id);
  revalidatePath('/app/settings');
}
