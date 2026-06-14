import { taskService, projectService } from '@/server/services';
import { InboxScreen } from '@/components/app/inbox';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const [tasks, projects] = await Promise.all([taskService.listInbox(), projectService.list()]);
  return <InboxScreen tasks={tasks} projects={projects} />;
}
