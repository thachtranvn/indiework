'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TaskDto } from '@/server/services';
import type { GroupModule, GroupMilestone } from '@/lib/grouping';
import {
  PROJECT_STATUS,
  PROJECT_STATUS_LABEL,
  MILESTONE_STATUS,
  MILESTONE_STATUS_LABEL,
  type ProjectStatus,
  type MilestoneStatus,
} from '@/lib/domain';
import { toDateInputValue } from '@/lib/dates';
import { mdToHtml } from '@/lib/markdown';
import { PROJECT_COLORS } from '@/lib/colors';
import { updateProject } from '@/app/_actions/projects';
import {
  createMilestone,
  updateMilestone,
  setMilestoneStatus,
  deleteMilestone,
  createModule,
  updateModule,
  archiveModule,
} from '@/app/_actions/structure';
import { ProjectHeader } from './project-header';
import { Progress } from '@/components/ui/bits';
import { Popover, OptionList } from '@/components/ui/popover';
import { Ic } from '@/components/ui/icons';

const DOT_KEY: Record<ProjectStatus, string> = {
  active: 'in_progress',
  planned: 'todo',
  paused: 'blocked',
  done: 'done',
  backlog: 'backlog',
  cancelled: 'cancelled',
};

interface Project {
  id: string;
  key: string;
  name: string;
  emoji: string | null;
  status: ProjectStatus;
  tags: string[];
  shortDesc: string | null;
  statusNote: string | null;
  description: string | null;
}

export function OverviewScreen({
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
  const save = async (patch: Parameters<typeof updateProject>[1]) => {
    await updateProject(project.id, patch);
    router.refresh();
  };

  const mileProgress = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const m of milestones) map.set(m.id, { done: 0, total: 0 });
    for (const t of tasks) {
      if (t.milestoneId && map.has(t.milestoneId)) {
        const e = map.get(t.milestoneId)!;
        e.total++;
        if (t.done) e.done++;
      }
    }
    return map;
  }, [milestones, tasks]);

  return (
    <>
      <ProjectHeader project={project} active="overview" />
      <div className="overview">
        <div className="ov-layout">
          <div className="ov-main">
            <div className="ov-grid">
              <span className="ov-label">Short description</span>
              <input
                className="ov-input"
                defaultValue={project.shortDesc ?? ''}
                placeholder="One line about this project"
                onBlur={(e) => e.target.value !== (project.shortDesc ?? '') && save({ shortDesc: e.target.value || null })}
              />

              <span className="ov-label">Status</span>
              <span>
                <Popover
                  width={190}
                  trigger={
                    <button className="ov-pickbtn" type="button">
                      <span className="pstatus">
                        <span className="dot" style={{ background: `var(--st-${DOT_KEY[project.status]})` }} />
                        {PROJECT_STATUS_LABEL[project.status]}
                      </span>
                    </button>
                  }
                >
                  {(close) => (
                    <OptionList
                      options={PROJECT_STATUS.map((s) => ({ id: s, label: PROJECT_STATUS_LABEL[s] }))}
                      value={project.status}
                      onPick={(id) => {
                        save({ status: id as ProjectStatus });
                        close();
                      }}
                      renderOpt={(o) => (
                        <>
                          <span className="dot" style={{ background: `var(--st-${DOT_KEY[o.id as ProjectStatus]})` }} />
                          {o.label}
                        </>
                      )}
                    />
                  )}
                </Popover>
              </span>

              <span className="ov-label">Status note</span>
              <input
                className="ov-input"
                defaultValue={project.statusNote ?? ''}
                placeholder="Where is this project right now?"
                onBlur={(e) => e.target.value !== (project.statusNote ?? '') && save({ statusNote: e.target.value || null })}
              />

              <span className="ov-label">Prefix</span>
              <input className="ov-input ov-key" value={project.key} readOnly />

              <span className="ov-label">Tags</span>
              <TagEditor tags={project.tags} onChange={(tags) => save({ tags })} />
            </div>

            <label className="ov-label ov-desc-label">Description</label>
            <MarkdownField value={project.description ?? ''} onSave={(d) => save({ description: d || null })} />
          </div>

          <aside className="ov-side">
            <div className="ov-list-block">
              <div className="ov-list-head">
                <Ic.target size={16} /> Milestones <span className="ov-count">{milestones.length}</span>
              </div>
              {milestones.map((m) => {
                const prog = mileProgress.get(m.id) ?? { done: 0, total: 0 };
                return (
                  <div className="ov-mile" key={m.id}>
                    <div className="ov-mile-top">
                      <input
                        className="ov-rowname"
                        defaultValue={m.name}
                        onBlur={(e) => e.target.value.trim() && e.target.value !== m.name && updateMile(m.id, { name: e.target.value.trim() }, router)}
                      />
                      <button
                        className="icon-btn ov-del"
                        type="button"
                        onClick={async () => {
                          await deleteMilestone(m.id);
                          router.refresh();
                        }}
                        aria-label="Delete milestone"
                      >
                        <Ic.trash size={14} />
                      </button>
                    </div>
                    <div className="ov-mile-bottom">
                      <input
                        type="date"
                        className="ov-date"
                        defaultValue={toDateInputValue(m.targetDate)}
                        onChange={(e) =>
                          updateMile(m.id, { targetDate: e.target.value ? new Date(`${e.target.value}T00:00:00`) : null }, router)
                        }
                      />
                      <select
                        className="ov-state"
                        defaultValue={m.status}
                        onChange={async (e) => {
                          await setMilestoneStatus(m.id, e.target.value as MilestoneStatus);
                          router.refresh();
                        }}
                      >
                        {MILESTONE_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {MILESTONE_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      <span className="ov-mile-prog">
                        <Progress value={prog.total ? prog.done / prog.total : 0} width={54} />
                        <span className="ov-rowmeta">
                          {prog.done}/{prog.total}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
              <button
                className="add-row-btn sm"
                type="button"
                onClick={async () => {
                  await createMilestone({ projectId: project.id, name: 'New milestone' });
                  router.refresh();
                }}
              >
                <Ic.plus size={15} /> Add milestone
              </button>
            </div>

            <div className="ov-list-block">
              <div className="ov-list-head">
                <Ic.cube size={16} /> Modules <span className="ov-count">{modules.length}</span>
              </div>
              {modules.map((m) => (
                <div className="ov-row" key={m.id}>
                  <Popover
                    width={150}
                    trigger={<button className="ov-swatch" type="button" style={{ background: m.color ?? '#6E8BFF' }} aria-label="Module color" />}
                  >
                    {(close) => (
                      <div className="color-grid" style={{ padding: 4 }}>
                        {PROJECT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="color-pick"
                            data-on={c === m.color ? '' : undefined}
                            style={{ background: c, color: c }}
                            onClick={async () => {
                              await updateModule(m.id, { color: c });
                              router.refresh();
                              close();
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Popover>
                  <input
                    className="ov-rowname"
                    defaultValue={m.name}
                    onBlur={async (e) => {
                      if (e.target.value.trim() && e.target.value !== m.name) {
                        await updateModule(m.id, { name: e.target.value.trim() });
                        router.refresh();
                      }
                    }}
                  />
                  <button
                    className="icon-btn ov-del"
                    type="button"
                    onClick={async () => {
                      await archiveModule(m.id);
                      router.refresh();
                    }}
                    aria-label="Remove module"
                  >
                    <Ic.trash size={14} />
                  </button>
                </div>
              ))}
              <button
                className="add-row-btn sm"
                type="button"
                onClick={async () => {
                  await createModule({ projectId: project.id, name: 'New module', color: '#6E8BFF' });
                  router.refresh();
                }}
              >
                <Ic.plus size={15} /> Add module
              </button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

async function updateMile(
  id: string,
  patch: Parameters<typeof updateMilestone>[1],
  router: ReturnType<typeof useRouter>,
) {
  await updateMilestone(id, patch);
  router.refresh();
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [v, setV] = useState('');
  const add = () => {
    const t = v.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setV('');
  };
  return (
    <div className="tag-edit">
      {tags.map((t) => (
        <span className="tagchip" key={t}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
            <Ic.close size={11} />
          </button>
        </span>
      ))}
      <input
        className="tag-input"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Add tag…"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

function MarkdownField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [v, setV] = useState(value);
  return (
    <div className="md-field">
      <div className="md-tabs">
        <button type="button" data-active={tab === 'write' ? '' : undefined} onClick={() => setTab('write')}>
          Write
        </button>
        <button type="button" data-active={tab === 'preview' ? '' : undefined} onClick={() => setTab('preview')}>
          Preview
        </button>
      </div>
      {tab === 'write' ? (
        <textarea
          className="md-input"
          value={v}
          onChange={(e) => setV(e.target.value)}
          onBlur={() => v !== value && onSave(v)}
          placeholder={'## What it is\nDescribe the project in markdown…'}
        />
      ) : (
        <div className="md-render" dangerouslySetInnerHTML={{ __html: mdToHtml(v) }} />
      )}
    </div>
  );
}
