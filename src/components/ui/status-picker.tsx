'use client';

import { TASK_STATUS, TASK_STATUS_LABEL, type TaskStatus } from '@/lib/domain';
import { Popover, OptionList } from './popover';
import { StatusIcon } from './status-icon';

/** Shared status select — same options in the detail panel and on task rows. */
export function StatusPicker({
  status,
  done,
  onChange,
  showLabel = false,
  triggerClassName = 'status-trigger',
  align = 'left',
  size = 16,
}: {
  status: TaskStatus;
  done?: boolean;
  onChange: (s: TaskStatus) => void;
  showLabel?: boolean;
  triggerClassName?: string;
  align?: 'left' | 'right';
  size?: number;
}) {
  const effective: TaskStatus = done ? 'done' : status;
  return (
    <Popover
      width={190}
      align={align}
      trigger={
        <button
          className={triggerClassName}
          type="button"
          aria-label={`Status: ${TASK_STATUS_LABEL[status]}`}
          data-tip={`Status: ${TASK_STATUS_LABEL[status]}`}
        >
          {showLabel ? (
            <span className="status-opt">
              <StatusIcon status={effective} size={size} />
              {TASK_STATUS_LABEL[status]}
            </span>
          ) : (
            <StatusIcon status={effective} size={size} />
          )}
        </button>
      }
    >
      {(close) => (
        <OptionList
          options={TASK_STATUS.map((s) => ({ id: s, label: TASK_STATUS_LABEL[s] }))}
          value={status}
          onPick={(id) => {
            onChange(id as TaskStatus);
            close();
          }}
          renderOpt={(o) => (
            <span className="status-opt">
              <StatusIcon status={o.id as TaskStatus} />
              {o.label}
            </span>
          )}
        />
      )}
    </Popover>
  );
}
