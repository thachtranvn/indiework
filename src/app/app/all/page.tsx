import { projectService } from '@/server/services';
import { AllProjectsScreen } from '@/components/app/all-projects';

export const dynamic = 'force-dynamic';

export default async function AllProjectsPage() {
  const projects = await projectService.list();
  return <AllProjectsScreen projects={projects} />;
}
