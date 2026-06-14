'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ShellData } from '@/server/load';
import { PROJECT_STATUS, PROJECT_STATUS_LABEL, type ProjectStatus } from '@/lib/domain';
import { Ic } from '@/components/ui/icons';

type Projects = ShellData['projects'];

const DOT_KEY: Record<ProjectStatus, string> = {
  active: 'in_progress',
  planned: 'todo',
  paused: 'blocked',
  done: 'done',
  backlog: 'backlog',
  cancelled: 'cancelled',
};

export function AllProjectsScreen({ projects }: { projects: Projects }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(
    () =>
      PROJECT_STATUS.map((status) => ({
        status,
        items: projects.filter((p) => p.status === status),
      })).filter((g) => g.items.length > 0),
    [projects],
  );

  const toggle = (s: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <span className="topbar-emoji">🗂️</span>
          <h1>All projects</h1>
        </div>
      </div>
      <div className="ptable-wrap">
        <table className="ptable">
          <thead>
            <tr>
              <th>Project</th>
              <th>Description</th>
              <th>Status note</th>
              <th className="pt-num">Open</th>
              <th className="pt-tags">Tags</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const isCollapsed = collapsed.has(g.status);
              return (
                <FragmentGroup
                  key={g.status}
                  status={g.status}
                  count={g.items.length}
                  collapsed={isCollapsed}
                  onToggle={() => toggle(g.status)}
                >
                  {!isCollapsed &&
                    g.items.map((p) => (
                      <tr
                        key={p.id}
                        className="pt-row"
                        onClick={() => router.push(`/app/p/${p.key}/overview`)}
                      >
                        <td className="pt-name">
                          <span className="nav-emoji">{p.emoji ?? '•'}</span>
                          <span className="pt-pname">{p.name}</span>
                          <span className="pt-key">{p.key}</span>
                        </td>
                        <td className="pt-desc">{p.shortDesc}</td>
                        <td className="pt-note">{p.statusNote}</td>
                        <td className="pt-num">{p.issues}</td>
                        <td>
                          <div className="pt-tagrow">
                            {p.tags.map((t) => (
                              <span className="tagchip sm" key={t}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                </FragmentGroup>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FragmentGroup({
  status,
  count,
  collapsed,
  onToggle,
  children,
}: {
  status: ProjectStatus;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="pt-grouprow" data-collapsed={collapsed ? '' : undefined} onClick={onToggle}>
        <td colSpan={5}>
          <span className="pt-groupcaret">
            <Ic.chevronDown size={13} />
          </span>
          <span className="dot" style={{ background: `var(--st-${DOT_KEY[status]})` }} />
          {PROJECT_STATUS_LABEL[status]}
          <span className="pt-groupcount">{count}</span>
        </td>
      </tr>
      {children}
    </>
  );
}
