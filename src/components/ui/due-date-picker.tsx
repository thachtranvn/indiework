'use client';

import { DuePill } from './bits';
import { Popover } from './popover';
import { dueTooltip, toDateInputValue } from '@/lib/dates';

/** Row-level due-date picker shown from the existing due-date label. */
export function DueDatePicker({
  due,
  muted,
  onChange,
}: {
  due: Date | string;
  muted?: boolean;
  onChange: (due: Date | null) => void;
}) {
  const tip = dueTooltip(due);
  return (
    <Popover
      width={210}
      align="right"
      trigger={
        <button className="task-due-btn" type="button" aria-label={tip} data-tip={tip}>
          <DuePill due={due} muted={muted} />
        </button>
      }
    >
      {(close) => (
        <div className="due-date-menu">
          <input
            type="date"
            className="ov-date"
            defaultValue={toDateInputValue(due)}
            onChange={(event) => {
              onChange(event.target.value ? new Date(`${event.target.value}T00:00:00`) : null);
              close();
            }}
          />
          <button
            className="dp-reset"
            type="button"
            onClick={() => {
              onChange(null);
              close();
            }}
          >
            Clear
          </button>
        </div>
      )}
    </Popover>
  );
}
