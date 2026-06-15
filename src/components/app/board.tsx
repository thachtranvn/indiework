'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { TaskDto } from '@/server/services';
import type { GroupModule, GroupMilestone } from '@/lib/grouping';
import { BOARD_COLUMNS, TASK_STATUS_LABEL, TASK_PRIORITY_RANK, type TaskStatus } from '@/lib/domain';
import { createTask, updateTask } from '@/app/_actions/tasks';
import { PriorityBars, ModuleTag, MilestoneTag } from '@/components/ui/bits';
import { Ic } from '@/components/ui/icons';

interface Project {
  id: string;
  key: string;
  name: string;
  emoji: string | null;
}

/** Board body only (no header) — rendered inside ProjectView when a view's mode is board. */
export function BoardView({
  project,
  modules,
  milestones,
  tasks,
}: {
  project: Project;
  modules: GroupModule[];
  milestones: GroupMilestone[];
  tasks: TaskDto[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  const moduleMap = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);
  const milestoneMap = useMemo(() => new Map(milestones.map((m) => [m.id, m])), [milestones]);

  const byColumn = useMemo(() => {
    const map = new Map<TaskStatus, TaskDto[]>(BOARD_COLUMNS.map((c) => [c, []]));
    for (const t of tasks) {
      const col = map.get(t.status as TaskStatus);
      if (col) col.push(t);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          TASK_PRIORITY_RANK[b.priority] - TASK_PRIORITY_RANK[a.priority] ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    return map;
  }, [tasks]);

  const openTask = (id: string) => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set('task', id);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const drop = async (e: React.DragEvent, status: TaskStatus) => {
    // The dragged id travels on the dataTransfer, so the drop never depends on
    // a React re-render landing between dragstart and drop.
    const id = e.dataTransfer.getData('text/plain') || dragId;
    setDragId(null);
    setOverCol(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    await updateTask(id, { status });
    router.refresh();
  };

  const addToColumn = async (status: TaskStatus, title: string) => {
    await createTask({ projectId: project.id, title, status });
    router.refresh();
  };

  return (
    <div className="board">
      {BOARD_COLUMNS.map((status) => {
          const list = byColumn.get(status) ?? [];
          return (
            <div
              key={status}
              className="board-col"
              data-over={overCol === status ? '' : undefined}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(status);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setOverCol(null);
              }}
              onDrop={(e) => drop(e, status)}
            >
              <div className="board-col-head">
                <span className="dot" style={{ background: `var(--st-${status})` }} />
                <span className="board-col-name">{TASK_STATUS_LABEL[status]}</span>
                <span className="board-col-count">{list.length}</span>
              </div>
              <div className="board-list">
                {list.map((t) => (
                  <div
                    key={t.id}
                    className="board-card"
                    draggable
                    data-dragging={dragId === t.id ? '' : undefined}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', t.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDragId(t.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => openTask(t.id)}
                  >
                    <div className="board-card-title">{t.title}</div>
                    <div className="board-card-meta">
                      <PriorityBars priority={t.priority} />
                      {t.moduleId && moduleMap.get(t.moduleId) && (
                        <ModuleTag
                          name={moduleMap.get(t.moduleId)!.name}
                          color={moduleMap.get(t.moduleId)!.color}
                          icon={moduleMap.get(t.moduleId)!.icon}
                        />
                      )}
                      {!t.moduleId && t.milestoneId && milestoneMap.get(t.milestoneId) && (
                        <MilestoneTag name={milestoneMap.get(t.milestoneId)!.name} />
                      )}
                      {t.ref && <span className="task-ref">{t.ref}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <BoardAdd onAdd={(title) => addToColumn(status, title)} />
            </div>
          );
        })}
    </div>
  );
}

function BoardAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState('');
  if (!editing) {
    return (
      <button className="board-add" type="button" onClick={() => setEditing(true)}>
        <Ic.plus size={15} /> Add
      </button>
    );
  }
  const submit = () => {
    const t = v.trim();
    if (t) onAdd(t);
    setV('');
  };
  return (
    <div className="board-add">
      <Ic.plus size={15} />
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Card title…"
        style={{ border: 'none', background: 'none', outline: 'none', flex: 1, fontSize: 13, color: 'var(--text-strong)' }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setEditing(false);
        }}
        onBlur={() => !v.trim() && setEditing(false)}
      />
    </div>
  );
}
