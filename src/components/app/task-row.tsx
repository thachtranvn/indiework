'use client';

import { useState } from 'react';
import type { TaskDto } from '@/server/services';
import type { GroupModule, GroupMilestone, FieldVis } from '@/lib/grouping';
import { taskKey } from '@/lib/task-nav';
import { StatusChip, MetaPill } from '@/components/ui/bits';
import { DueDatePicker } from '@/components/ui/due-date-picker';
import { ModulePicker } from '@/components/ui/module-picker';
import { MilestonePicker } from '@/components/ui/milestone-picker';
import { PriorityPicker } from '@/components/ui/priority-picker';
import { StatusPicker } from '@/components/ui/status-picker';
import { Ic } from '@/components/ui/icons';
import type { TaskPriority, TaskStatus } from '@/lib/domain';

export function TaskRow({
  task,
  module,
  milestone,
  modules,
  milestones,
  selected,
  checked,
  selMode,
  fields,
  childTasks,
  showSubtasks,
  openKey,
  onToggleDone,
  onOpen,
  onRename,
  onSetPriority,
  onSetStatus,
  onSetDueDate,
  onSetModule,
  onSetMilestone,
  onToggleSelect,
  showModule = true,
  showMilestone = true,
  dueSlotWidth,
  flashing,
}: {
  task: TaskDto;
  module?: GroupModule;
  milestone?: GroupMilestone;
  modules: GroupModule[];
  milestones: GroupMilestone[];
  selected: boolean;
  checked: boolean;
  selMode: boolean;
  fields: FieldVis;
  childTasks?: TaskDto[];
  showSubtasks?: boolean;
  openKey?: string | null;
  onToggleDone: (id: string) => void;
  onOpen: (task: TaskDto) => void;
  onRename: (id: string, title: string) => void;
  onSetPriority: (id: string, priority: TaskPriority) => void;
  onSetStatus: (id: string, status: TaskStatus) => void;
  onSetDueDate: (id: string, dueDate: Date | null) => void;
  onSetModule: (id: string, moduleId: string | null) => void;
  onSetMilestone: (id: string, milestoneId: string | null) => void;
  onToggleSelect: (shift: boolean) => void;
  showModule?: boolean;
  showMilestone?: boolean;
  /** Width of the shared due column (longest label on the page); omit when no dues. */
  dueSlotWidth?: number;
  flashing?: boolean;
}) {
  const children = childTasks ?? [];
  const subDone = children.filter((c) => c.done).length;
  const hasChildren = children.length > 0;
  const allDone = hasChildren && subDone === children.length;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(task.title);
    setEditing(true);
  };
  const commitEdit = () => {
    const t = draft.trim();
    setEditing(false);
    if (t && t !== task.title) onRename(task.id, t);
  };

  return (
    <>
      <div
        className="task-row"
        data-task-id={task.id}
        data-done={task.done ? '' : undefined}
        data-cancelled={task.status === 'cancelled' ? '' : undefined}
        data-selected={selected ? '' : undefined}
        data-checked={checked ? '' : undefined}
        data-selmode={selMode ? '' : undefined}
        data-editing={editing ? '' : undefined}
        data-flash={flashing ? '' : undefined}
        onClick={() => !editing && onOpen(task)}
      >
        <button
          className="task-select"
          type="button"
          aria-label="Select task"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(e.shiftKey);
          }}
        >
          {checked && <Ic.check size={11} strokeWidth={2.6} />}
        </button>

        {/* Leading priority + ref columns — always visible, kept in flow so the
            status circle and titles line up across every row (matches design). */}
        {fields.priority && (
          <span className="task-lead-pri" onClick={(e) => e.stopPropagation()}>
            <PriorityPicker
              priority={task.priority}
              triggerClassName="task-pri-btn"
              onChange={(priority) => onSetPriority(task.id, priority)}
            />
          </span>
        )}
        {fields.taskId && task.ref && <span className="task-ref task-ref-lead">{task.ref}</span>}

        <span className="task-lead-status" onClick={(e) => e.stopPropagation()}>
          <StatusPicker
            status={task.status}
            done={task.done}
            size={16}
            triggerClassName="task-status-btn"
            onChange={(status) => onSetStatus(task.id, status)}
          />
        </span>

        <div className="task-main">
          <div className="task-line">
            {editing ? (
              <input
                className="task-title-input"
                autoFocus
                value={draft}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    commitEdit();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setEditing(false);
                  }
                }}
                onBlur={commitEdit}
              />
            ) : (
              <>
                <span className="task-title">{task.title}</span>
                <button
                  className="task-title-edit task-reveal"
                  type="button"
                  aria-label="Rename task"
                  data-tip="Rename"
                  onClick={startEdit}
                >
                  <Ic.edit size={13} />
                </button>
              </>
            )}
          </div>
          {task.status === 'pending' && task.statusNote && (
            <div className="task-note-2nd">
              <Ic.bolt size={12} />
              <span>{task.statusNote}</span>
            </div>
          )}
        </div>

        {/* Right meta stays visible (subtask · attachments · tags · due);
            only the status chip is hover-revealed via status-reveal. */}
        <div className="task-meta">
          {task.attachmentCount > 0 && (
            <MetaPill
              icon={<Ic.paperclip size={14} />}
              label={String(task.attachmentCount)}
              title={`${task.attachmentCount} attachment${task.attachmentCount === 1 ? '' : 's'}`}
              className="meta-pill-ghost"
            />
          )}
          {hasChildren && (
            <MetaPill
              icon={<Ic.listTree size={14} />}
              label={`${subDone}/${children.length}`}
              title={`${subDone} of ${children.length} sub-tasks done`}
              className={allDone ? 'meta-pill-complete' : undefined}
            />
          )}
          {fields.module && showModule && module && (
            <ModulePicker
              moduleId={task.moduleId}
              module={module}
              modules={modules}
              onChange={(moduleId) => onSetModule(task.id, moduleId)}
            />
          )}
          {fields.milestone && showMilestone && milestone && (
            <MilestonePicker
              milestoneId={task.milestoneId}
              milestone={milestone}
              milestones={milestones}
              onChange={(milestoneId) => onSetMilestone(task.id, milestoneId)}
            />
          )}
          {dueSlotWidth != null ? (
            <span className="task-due-slot" style={{ width: dueSlotWidth }}>
              {task.dueDate && (
                <DueDatePicker
                  due={task.dueDate}
                  muted={task.done || task.status === 'cancelled'}
                  onChange={(dueDate) => onSetDueDate(task.id, dueDate)}
                />
              )}
            </span>
          ) : (
            task.dueDate && (
              <DueDatePicker
                due={task.dueDate}
                muted={task.done || task.status === 'cancelled'}
                onChange={(dueDate) => onSetDueDate(task.id, dueDate)}
              />
            )
          )}
          {fields.status && (
            <span className="task-reveal status-reveal">
              <StatusChip status={task.status} size="sm" />
            </span>
          )}
        </div>
      </div>

      {showSubtasks && hasChildren && (
        <div className="subtask-list">
          {children.map((c) => (
            <div
              key={c.id}
              className="subtask-row"
              data-done={c.done ? '' : undefined}
              data-selected={openKey === taskKey(c) ? '' : undefined}
              onClick={() => onOpen(c)}
            >
              <button
                className="subtask-check"
                type="button"
                data-done={c.done ? '' : undefined}
                aria-label={c.done ? 'Mark not done' : 'Mark done'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDone(c.id);
                }}
              >
                {c.done && <Ic.check size={9} strokeWidth={3} />}
              </button>
              <span className="subtask-title">{c.title}</span>
              {c.ref && <span className="subtask-ref">{c.ref}</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
