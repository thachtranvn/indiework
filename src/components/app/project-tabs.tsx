'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { IconPicker } from '@/components/ui/icon-picker';
import { Ic } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { updateProject } from '@/app/_actions/projects';
import { useRun } from '@/components/ui/toast';
import { commitOnEnter } from '@/lib/inline-edit';
import { useChromeBtnSize } from '@/lib/use-media-query';
import { useToggleSidebar } from './nav-toggle';
import {
  BUILTIN_VIEWS,
  DEFAULT_VIEW,
  type CustomView,
  type ViewId,
  type ViewMode,
} from '@/lib/views';

interface ProjectLite {
  id: string;
  key: string;
  name: string;
  emoji: string | null;
  color: string | null;
  pinned: boolean;
}

/**
 * Merged header (v3): sidebar toggle + project identity + Overview/views + add.
 * Filter / Display live on the quick-capture row (see ProjectView), not here —
 * `right` remains as an optional slot for other surfaces.
 */
export function ProjectTabs({
  project,
  activeView,
  customViews,
  onAddView,
  onRenameView,
  onRemoveView,
  modeFor,
  right,
}: {
  project: ProjectLite;
  activeView: 'overview' | ViewId;
  customViews: CustomView[];
  onAddView: () => string;
  onRenameView: (id: string, label: string) => void;
  onRemoveView: (id: string) => void;
  modeFor: (id: ViewId) => ViewMode;
  right?: ReactNode;
}) {
  const router = useRouter();
  const run = useRun();
  const toggleSidebar = useToggleSidebar();
  const [name, setName] = useState(project.name);
  const base = `/app/p/${project.key}`;

  const save = (patch: { name?: string; emoji?: string; color?: string }) =>
    run(
      async () => {
        await updateProject(project.id, patch);
        router.refresh();
      },
      { error: "Couldn't save the project." },
    );

  const goView = (id: ViewId) => router.push(`${base}?view=${id}`, { scroll: false });
  const modeIcon = (id: ViewId) => (modeFor(id) === 'board' ? <Ic.board size={15} /> : <Ic.list size={15} />);
  const btnSize = useChromeBtnSize();

  return (
    <div className="tabs">
      <div className="tabs-sticky">
        <Button
          className="tabs-sb-toggle"
          type="button"
          iconOnly
          size={btnSize}
          variant="tertiary"
          onClick={toggleSidebar}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          leftIcon={<Ic.sidebar size={16} />}
        />
      </div>

      <div className="tabs-main">
        <div className="tabs-lead">
          <IconPicker
            value={project.emoji ?? '🚀'}
            color={project.color}
            onPick={(p) =>
              save({
                ...(p.value !== undefined ? { emoji: p.value } : {}),
                ...(p.color !== undefined ? { color: p.color } : {}),
              })
            }
            triggerClass="tabs-lead-emoji"
            triggerSize={16}
          />
          <input
            className="tabs-lead-name"
            value={name}
            autoComplete="off"
            suppressHydrationWarning
            onChange={(e) => setName(e.target.value)}
            onKeyDown={commitOnEnter}
            onBlur={() => name.trim() && name !== project.name && save({ name: name.trim() })}
            spellCheck={false}
            aria-label="Project name"
          />
        </div>
        <div className="tabs-nav">
          <button className="tab" data-active={activeView === 'overview' ? '' : undefined} onClick={() => router.push(`${base}/overview`)} type="button">
            Overview
          </button>

          {BUILTIN_VIEWS.map((v) => (
            <button key={v.id} className="tab" data-active={activeView === v.id ? '' : undefined} onClick={() => goView(v.id)} type="button">
              {v.label}
            </button>
          ))}

          {customViews.map((v) => (
            <CustomTab
              key={v.id}
              view={v}
              active={activeView === v.id}
              icon={modeIcon(v.id)}
              onOpen={() => goView(v.id)}
              onRename={(label) => onRenameView(v.id, label)}
              onRemove={() => {
                onRemoveView(v.id);
                if (activeView === v.id) goView(DEFAULT_VIEW);
              }}
            />
          ))}

          <Button
            className="tab-add"
            type="button"
            iconOnly
            size={btnSize}
            variant="tertiary"
            aria-label="Add view"
            leftIcon={<Ic.plus size={16} />}
            onClick={() => {
              const id = onAddView();
              goView(id);
            }}
          />
        </div>
      </div>

      {right && <div className="tabs-right">{right}</div>}
    </div>
  );
}

function CustomTab({
  view,
  active,
  icon,
  onOpen,
  onRename,
  onRemove,
}: {
  view: CustomView;
  active: boolean;
  icon: ReactNode;
  onOpen: () => void;
  onRename: (label: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(view.label);

  if (editing) {
    return (
      <span className="tab" data-active={active ? '' : undefined}>
        {icon}
        <input
          className="tab-name-input"
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (label.trim() && label !== view.label) onRename(label.trim());
            else setLabel(view.label);
          }}
          onKeyDown={(e) => {
            commitOnEnter(e);
            if (e.key === 'Escape') {
              setLabel(view.label);
              setEditing(false);
            }
          }}
        />
      </span>
    );
  }

  return (
    <button
      className="tab"
      data-active={active ? '' : undefined}
      onClick={onOpen}
      onDoubleClick={() => active && setEditing(true)}
      type="button"
    >
      {icon} {view.label}
      <span
        className="tab-x"
        role="button"
        aria-label="Remove view"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Ic.close size={12} />
      </span>
    </button>
  );
}
