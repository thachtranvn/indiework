import type { TaskStatus } from '@/lib/domain';

/** Figma Status icons — backlog/inbox share the dashed empty circle. */
const STATUS_SVG: Partial<Record<TaskStatus, string>> = {
  in_progress: '/icons/status/in-progress.svg',
  in_review: '/icons/status/review.svg',
  pending: '/icons/status/pending.svg',
  done: '/icons/status/done.svg',
  cancelled: '/icons/status/cancelled.svg',
};

/** Visual mark for a task status (16×16 by default). */
export function StatusIcon({ status, size = 16 }: { status: TaskStatus; size?: number }) {
  const src = STATUS_SVG[status];
  if (src) {
    return (
      <img
        className="status-icon"
        src={src}
        alt=""
        width={size}
        height={size}
        data-st={status}
        draggable={false}
      />
    );
  }
  // inbox shares backlog's dashed ring; todo = solid empty ring (Figma "Planned")
  const kind = status === 'todo' ? 'todo' : 'backlog';
  return <span className="status-icon" data-st={kind} style={{ width: size, height: size }} />;
}
