'use client';

import type { TaskDto } from '@/server/services';
import type { GroupModule, GroupMilestone, FieldVis } from '@/lib/grouping';
import { CircleCheck } from '@/components/ui/interactive';
import { PriorityBars, ModuleTag, MilestoneTag, DuePill, StatusChip } from '@/components/ui/bits';
import { Ic } from '@/components/ui/icons';

export function TaskRow({
  task,
  module,
  milestone,
  selected,
  checked,
  selMode,
  fields,
  onToggleDone,
  onOpen,
  onToggleSelect,
  showModule = true,
  showMilestone = true,
}: {
  task: TaskDto;
  module?: GroupModule;
  milestone?: GroupMilestone;
  selected: boolean;
  checked: boolean;
  selMode: boolean;
  fields: FieldVis;
  onToggleDone: () => void;
  onOpen: () => void;
  onToggleSelect: (shift: boolean) => void;
  showModule?: boolean;
  showMilestone?: boolean;
}) {
  return (
    <div
      className="task-row"
      data-done={task.done ? '' : undefined}
      data-cancelled={task.status === 'cancelled' ? '' : undefined}
      data-selected={selected ? '' : undefined}
      data-checked={checked ? '' : undefined}
      data-selmode={selMode ? '' : undefined}
      onClick={onOpen}
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

      <CircleCheck done={task.done} status={task.status} onToggle={onToggleDone} />

      <div className="task-main">
        <div className="task-line">
          <span className="task-title">{task.title}</span>
          {fields.taskId && task.ref && <span className="task-ref">{task.ref}</span>}
        </div>
        {task.status === 'pending' && task.statusNote && (
          <div className="task-note-2nd">
            <Ic.bolt size={12} />
            <span>{task.statusNote}</span>
          </div>
        )}
      </div>

      <div className="task-meta task-reveal">
        {fields.status && <StatusChip status={task.status} size="sm" />}
        {fields.priority && <PriorityBars priority={task.priority} />}
        {task.dueDate && <DuePill due={task.dueDate} />}
        {fields.module && showModule && module && <ModuleTag name={module.name} color={module.color} icon={module.icon} />}
        {fields.milestone && showMilestone && milestone && <MilestoneTag name={milestone.name} />}
      </div>
    </div>
  );
}
