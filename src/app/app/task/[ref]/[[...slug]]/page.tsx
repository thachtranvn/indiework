import { notFound } from 'next/navigation';
import { ServiceError } from '@/server/services';
import { parseRef } from '@/lib/domain';
import { loadTaskDetail } from '@/server/load';
import { TaskPageView } from '@/components/app/task-page-view';

export const dynamic = 'force-dynamic';

/**
 * Standalone task page `/app/task/IW-11/<slug>`. Unlike `/app/issue/...` (the
 * peek overlay), this renders the task as a full 2-column page in the main
 * column. The ref encodes the project; the `slug` is decorative and ignored —
 * the task resolves by ref. SSR-seed the detail so a deep link paints content
 * on the first frame instead of flashing a skeleton.
 */
export default async function TaskPage({
  params,
}: {
  params: Promise<{ ref: string; slug?: string[] }>;
}) {
  const { ref } = await params;
  if (!parseRef(ref)) notFound();
  try {
    const detail = await loadTaskDetail(ref);
    return <TaskPageView taskRef={ref} initialDetail={detail} />;
  } catch (e) {
    if (e instanceof ServiceError && e.code === 'not_found') notFound();
    throw e;
  }
}
