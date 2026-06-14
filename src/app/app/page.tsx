import { redirect } from 'next/navigation';
import { projectService } from '@/server/services';

export const dynamic = 'force-dynamic';

export default async function AppHome() {
  const projects = await projectService.list();
  if (projects.length === 0) redirect('/app/inbox');
  const target = projects.find((p) => p.pinned) ?? projects[0];
  redirect(`/app/p/${target.key}`);
}
