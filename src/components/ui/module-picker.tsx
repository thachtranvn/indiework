'use client';

import type { GroupModule } from '@/lib/grouping';
import { ModuleTag, ModuleIcon, NoneMark } from './bits';
import { Popover, OptionList } from './popover';

/** Row-level module picker shown from the module chip. */
export function ModulePicker({
  moduleId,
  module,
  modules,
  onChange,
}: {
  moduleId: string | null | undefined;
  module: GroupModule;
  modules: GroupModule[];
  onChange: (moduleId: string | null) => void;
}) {
  return (
    <Popover
      width={210}
      align="right"
      trigger={
        <button className="task-meta-btn" type="button" aria-label={`Module: ${module.name}`} data-tip={`Module: ${module.name}`}>
          <ModuleTag name={module.name} color={module.color} icon={module.icon} />
        </button>
      }
    >
      {(close) => (
        <OptionList
          options={[
            { id: '', label: 'No module', icon: null as string | null, color: null as string | null },
            ...modules.map((m) => ({ id: m.id, label: m.name, icon: m.icon ?? null, color: m.color })),
          ]}
          value={moduleId ?? ''}
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
                <ModuleIcon icon={o.icon} color={o.color} size={16} /> {o.label}
              </>
            )
          }
        />
      )}
    </Popover>
  );
}
