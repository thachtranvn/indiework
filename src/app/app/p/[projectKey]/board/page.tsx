import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Board is now a per-view *mode*, not a route (v3). Old /board links land on
 * the unified view route with the board-by-default "Active" view selected.
 */
export default async function ProjectBoardRedirect({
  params,
}: {
  params: Promise<{ projectKey: string }>;
}) {
  const { projectKey } = await params;
  redirect(`/app/p/${projectKey}?view=active`);
}
