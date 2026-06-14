import { notFound } from 'next/navigation';
import { ServiceError } from '@/server/services';
import { loadProject } from '@/server/load';
import { OverviewScreen } from '@/components/app/overview';

export const dynamic = 'force-dynamic';

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectKey: string }>;
}) {
  const { projectKey } = await params;
  try {
    const { project, modules, milestones, tasks } = await loadProject(projectKey);
    return <OverviewScreen project={project} modules={modules} milestones={milestones} tasks={tasks} />;
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'not_found') notFound();
    throw e;
  }
}
