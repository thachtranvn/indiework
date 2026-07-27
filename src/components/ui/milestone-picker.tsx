'use client';

import type { GroupMilestone } from '@/lib/grouping';
import { MilestoneTag, PhaseIcon, NoneMark } from './bits';
import { Popover, OptionList } from './popover';

/** Row-level milestone/phase picker shown from the phase chip. */
export function MilestonePicker({
  milestoneId,
  milestone,
  milestones,
  onChange,
}: {
  milestoneId: string | null | undefined;
  milestone: GroupMilestone;
  milestones: GroupMilestone[];
  onChange: (milestoneId: string | null) => void;
}) {
  return (
    <Popover
      width={220}
      align="right"
      trigger={
        <button
          className="task-meta-btn"
          type="button"
          aria-label={`Milestone: ${milestone.name}`}
          data-tip={`Milestone: ${milestone.name}`}
        >
          <MilestoneTag name={milestone.name} />
        </button>
      }
    >
      {(close) => (
        <OptionList
          options={[{ id: '', label: 'No milestone' }, ...milestones.map((m) => ({ id: m.id, label: m.name }))]}
          value={milestoneId ?? ''}
          onPick={(id) => {
            onChange(id || null);
            close();
          }}
          renderOpt={(o) =>
            o.id === '' ? (
              <>
                <NoneMark /> {o.label}
              </>
            ) : (
              <>
                <PhaseIcon size={16} /> {o.label}
              </>
            )
          }
        />
      )}
    </Popover>
  );
}
