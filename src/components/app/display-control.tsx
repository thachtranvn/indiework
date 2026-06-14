'use client';

import { Popover } from '@/components/ui/popover';
import { PriorityBars } from '@/components/ui/bits';
import { Ic } from '@/components/ui/icons';
import {
  TASK_STATUS,
  TASK_STATUS_LABEL,
  TASK_PRIORITY,
  TASK_PRIORITY_LABEL,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/domain';
import type { GroupDim, Filters } from '@/lib/grouping';

const DIM_LABEL: Record<GroupDim, string> = {
  module: 'Module',
  milestone: 'Milestone',
  status: 'Status',
  priority: 'Priority',
  none: 'None',
};

export function DisplayControl({
  groupBy,
  setGroupBy,
  subGroupBy,
  setSubGroupBy,
  availDims,
  filters,
  setFilters,
}: {
  groupBy: GroupDim;
  setGroupBy: (d: GroupDim) => void;
  subGroupBy: GroupDim;
  setSubGroupBy: (d: GroupDim) => void;
  availDims: GroupDim[];
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const activeCount =
    (groupBy !== (availDims[0] ?? 'status') ? 1 : 0) +
    (subGroupBy !== 'none' ? 1 : 0) +
    filters.status.length +
    filters.priority.length +
    (filters.hideDone ? 1 : 0);

  const toggleStatus = (s: TaskStatus) =>
    setFilters({
      ...filters,
      status: filters.status.includes(s) ? filters.status.filter((x) => x !== s) : [...filters.status, s],
    });
  const togglePriority = (p: TaskPriority) =>
    setFilters({
      ...filters,
      priority: filters.priority.includes(p) ? filters.priority.filter((x) => x !== p) : [...filters.priority, p],
    });

  const subOptions: GroupDim[] = ['none', ...availDims.filter((d) => d !== groupBy)];

  return (
    <Popover
      align="right"
      width={300}
      trigger={
        <button className="tool-btn" data-on={activeCount > 0 ? '' : undefined} type="button">
          <Ic.sliders size={15} /> Display{activeCount > 0 ? ` · ${activeCount}` : ''}
        </button>
      }
    >
      <div className="display-pop">
        <div className="dp-block">
          <div className="dp-label">Group by</div>
          <div className="seg-wrap">
            {[...availDims, 'none' as GroupDim].map((d) => (
              <button
                key={d}
                className="seg-btn"
                data-active={groupBy === d ? '' : undefined}
                onClick={() => setGroupBy(d)}
                type="button"
              >
                {DIM_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-block">
          <div className="dp-label">Sub-group</div>
          <div className="seg-wrap">
            {subOptions.map((d) => (
              <button
                key={d}
                className="seg-btn"
                data-active={subGroupBy === d ? '' : undefined}
                onClick={() => setSubGroupBy(d)}
                type="button"
              >
                {DIM_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-divider" />

        <div className="dp-block">
          <div className="dp-label">Status</div>
          <div className="chip-pick">
            {TASK_STATUS.filter((s) => s !== 'inbox').map((s) => (
              <button
                key={s}
                className="fchip"
                data-on={filters.status.includes(s) ? '' : undefined}
                onClick={() => toggleStatus(s)}
                type="button"
              >
                <span className="dot" style={{ background: `var(--st-${s})` }} />
                {TASK_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-block">
          <div className="dp-label">Priority</div>
          <div className="chip-pick">
            {TASK_PRIORITY.map((p) => (
              <button
                key={p}
                className="fchip"
                data-on={filters.priority.includes(p) ? '' : undefined}
                onClick={() => togglePriority(p)}
                type="button"
              >
                <PriorityBars priority={p} />
                {TASK_PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="dp-divider" />

        <button
          className="dp-toggle"
          type="button"
          onClick={() => setFilters({ ...filters, hideDone: !filters.hideDone })}
        >
          <Ic.eyeOff size={15} /> Hide done & cancelled
          <span className="dp-switch" data-on={filters.hideDone ? '' : undefined} />
        </button>

        {activeCount > 0 && (
          <button
            className="dp-reset"
            type="button"
            onClick={() => {
              setGroupBy(availDims[0] ?? 'status');
              setSubGroupBy('none');
              setFilters({ status: [], priority: [], hideDone: false });
            }}
          >
            Reset to defaults
          </button>
        )}
      </div>
    </Popover>
  );
}
