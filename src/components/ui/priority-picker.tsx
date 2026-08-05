'use client';

import { TASK_PRIORITY, TASK_PRIORITY_LABEL, type TaskPriority } from '@/lib/domain';
import { Popover, OptionList } from './popover';
import { PriorityBars } from './bits';

/** Shared priority select — same options in the detail panel and on task rows. */
export function PriorityPicker({
  priority,
  onChange,
  showLabel = false,
  triggerClassName = 'pri-trigger',
  align = 'left',
}: {
  priority: TaskPriority;
  onChange: (p: TaskPriority) => void;
  showLabel?: boolean;
  triggerClassName?: string;
  align?: 'left' | 'right';
}) {
  return (
    <Popover
      width={180}
      align={align}
      trigger={
        <button
          className={triggerClassName}
          type="button"
          aria-label={`Priority: ${TASK_PRIORITY_LABEL[priority]}`}
          data-tip={`Priority: ${TASK_PRIORITY_LABEL[priority]}`}
          data-empty={priority === 'none' ? '' : undefined}
        >
          <PriorityBars priority={priority} showLabel={showLabel} />
        </button>
      }
    >
      {(close) => (
        <OptionList
          options={TASK_PRIORITY.map((p) => ({ id: p, label: TASK_PRIORITY_LABEL[p] }))}
          value={priority}
          onPick={(id) => {
            onChange(id as TaskPriority);
            close();
          }}
          renderOpt={(o) => <PriorityBars priority={o.id as TaskPriority} showLabel />}
        />
      )}
    </Popover>
  );
}
