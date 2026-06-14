import { workspaceService, apiKeyService } from '@/server/services';
import { SettingsScreen } from '@/components/app/settings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const [workspace, apiKeys] = await Promise.all([workspaceService.getDefault(), apiKeyService.list()]);
  return (
    <SettingsScreen
      workspace={workspace}
      apiKeys={apiKeys}
      initialSection={section === 'general' ? 'general' : 'api'}
    />
  );
}
