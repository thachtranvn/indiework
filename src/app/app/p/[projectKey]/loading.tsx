import { ProjectViewSkeleton } from '@/components/app/skeletons';

// Instant placeholder while a project's tasks load — most-common navigation
// (switching projects). PP-R2: no blank screen, no frozen previous view.
export default function Loading() {
  return <ProjectViewSkeleton />;
}
