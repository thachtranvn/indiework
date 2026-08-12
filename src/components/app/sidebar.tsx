'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ShellData } from '@/server/load';
import { setActiveWorkspace } from '@/app/_actions/workspace';
import { logout } from '@/app/_actions/auth';
import { useRun } from '@/components/ui/toast';
import { BrandMark } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { Popover } from '@/components/ui/popover';
import { Ic } from '@/components/ui/icons';
import { Kbd } from '@/components/ui/kbd';
import { EntityIcon } from '@/components/ui/bits';
import { useChromeBtnSize } from '@/lib/use-media-query';

type Projects = ShellData['projects'];

export function Sidebar({
  shell,
  onNewProject,
  onNewWorkspace,
  onOpenSearch,
  onClose,
}: {
  shell: ShellData;
  onNewProject: () => void;
  onNewWorkspace: () => void;
  onOpenSearch: () => void;
  /** Mobile full-screen sheet close — omitted / unused on desktop. */
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const run = useRun();
  // Touch targets on the phone drawer — compact sizes stay for the desktop rail.
  const btnSize = useChromeBtnSize();
  const { user, workspaces, activeWorkspace, projects, inboxCount } = shell;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [footScrolled, setFootScrolled] = useState(false);

  /** Footer top border when the nav list can scroll (content overflows). */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () => setFootScrolled(el.scrollHeight > el.clientHeight + 1);
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [projects.length, collapsed]);

  const switchWorkspace = async (id: string) => {
    if (id === activeWorkspace?.id) return;
    const ok = await run(
      async () => {
        await setActiveWorkspace(id);
        return true as const;
      },
      { error: "Couldn't switch workspace." },
    );
    if (!ok) return;
    // Leaving a project page: that project may not live in the new workspace,
    // so land on the app home instead of staring at an out-of-scope project.
    if (pathname.startsWith('/app/p/')) router.push('/app');
    else router.refresh();
  };

  const toggleSection = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const { pinned, others } = useMemo(() => splitProjects(projects), [projects]);
  const userLabel = user.email ?? user.name;

  return (
    <aside className="sidebar">
      {/* workspace switcher */}
      <div className="ws-row">
        <Popover
          align="left"
          width={232}
          trigger={
            <div className="ws-switch">
              <BrandMark size={28} className="ws-mark" />
              <span className="ws-meta">
                <b>{activeWorkspace?.name ?? 'Workspace'}</b>
                <small>{activeWorkspace?.tagline ?? 'personal projects'}</small>
              </span>
              <Button
                type="button"
                iconOnly
                size={btnSize}
                variant="tertiary"
                tabIndex={-1}
                aria-hidden
                leftIcon={<Ic.chevronSelectorVertical />}
              />
            </div>
          }
        >
        {(close) => (
          <div className="ws-pop">
            {workspaces.map((w) => (
              <button
                key={w.id}
                className="ws-opt"
                data-active={w.id === activeWorkspace?.id ? '' : undefined}
                onClick={() => {
                  close();
                  void switchWorkspace(w.id);
                }}
                type="button"
              >
                <span className="ws-opt-text">
                  <b>{w.name}</b>
                  <small>{w.tagline}</small>
                </span>
              </button>
            ))}
            <div className="ws-pop-divider" />
            <button
              className="ws-action"
              type="button"
              onClick={() => {
                close();
                onNewWorkspace();
              }}
            >
              <Ic.plus size={15} /> New workspace
            </button>
            <Link className="ws-action" href="/app/settings/workspace" onClick={close}>
              <Ic.settings size={15} /> Workspace settings
            </Link>
          </div>
        )}
        </Popover>
        {onClose && (
          <Button
            className="sb-drawer-close"
            type="button"
            iconOnly
            size={btnSize}
            variant="tertiary"
            onClick={onClose}
            aria-label="Close navigation"
            leftIcon={<Ic.chevronLeft />}
          />
        )}
      </div>

      {/* search — same chrome as quick-capture (Add task) */}
      <button className="sb-search qcap-inner" type="button" onClick={onOpenSearch}>
        <span className="qcap-plus" aria-hidden>
          <Ic.search size={16} />
        </span>
        <span className="sb-search-label">Search</span>
        <Kbd className="qcap-hint">⌘K</Kbd>
      </button>

      <div className="sb-scroll" ref={scrollRef}>
        {/* inbox */}
        <div className="sb-block">
          <Link className="nav-item" href="/app/inbox" data-active={pathname === '/app/inbox' ? '' : undefined}>
            <span className="nav-icon">
              <Ic.inbox size={16} />
            </span>
            <span className="nav-label">Inbox</span>
            {inboxCount > 0 && <span className="nav-badge">{inboxCount}</span>}
          </Link>
        </div>

        {pinned.length > 0 && (
          <>
            <div className="sb-divider" />
            <div className="sb-block">
              <SectionHead
                label="Pinned"
                collapsed={collapsed.has('pinned')}
                onToggle={() => toggleSection('pinned')}
              />
              <div
                className="sb-collapse"
                data-open={collapsed.has('pinned') ? undefined : ''}
                inert={collapsed.has('pinned') ? true : undefined}
              >
                <div className="sb-collapse-inner">
                  <div className="sb-grouprows">
                    {pinned.map((p) => (
                      <ProjectNavItem key={p.id} project={p} pathname={pathname} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="sb-divider" />
        <div className="sb-block">
          <SectionHead
            label="Projects"
            collapsed={collapsed.has('projects')}
            onToggle={() => toggleSection('projects')}
            action={
              <Button
                className="sb-section-action"
                type="button"
                iconOnly
                size={btnSize}
                variant="tertiary"
                aria-label="New project"
                title="New project"
                onClick={onNewProject}
                leftIcon={<Ic.plus />}
              />
            }
          />
          <div
            className="sb-collapse"
            data-open={collapsed.has('projects') ? undefined : ''}
            inert={collapsed.has('projects') ? true : undefined}
          >
            <div className="sb-collapse-inner">
              <div className="sb-grouprows">
                {others.map((p) => (
                  <ProjectNavItem key={p.id} project={p} pathname={pathname} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="sb-divider" />
        <div className="sb-block">
          <SectionHead
            label="Admin"
            collapsed={collapsed.has('admin')}
            onToggle={() => toggleSection('admin')}
          />
          <div
            className="sb-collapse"
            data-open={collapsed.has('admin') ? undefined : ''}
            inert={collapsed.has('admin') ? true : undefined}
          >
            <div className="sb-collapse-inner">
              <Link
                className="nav-item"
                href="/app/design-system"
                data-active={pathname.startsWith('/app/design-system') ? '' : undefined}
              >
                <span className="nav-icon">
                  <Ic.layers size={16} />
                </span>
                <span className="nav-label">Design System</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* user footer + account menu */}
      <div className="sb-foot" data-scrolled={footScrolled ? '' : undefined}>
        <div className="sb-user">
          <span className="sb-user-email">{userLabel}</span>
          <Popover
            align="right"
            width={180}
            trigger={
              <Button
                className="sb-icon-btn"
                type="button"
                iconOnly
                size={btnSize}
                variant="tertiary"
                aria-label="Account menu"
                leftIcon={<Ic.dotsHorizontal />}
              />
            }
          >
            {(close) => (
              <div className="ws-pop">
                <Link
                  className="ws-action"
                  href="/app/settings"
                  onClick={close}
                  data-active={pathname === '/app/settings' ? '' : undefined}
                >
                  <Ic.settings size={15} /> Settings
                </Link>
                {/* Chrome injects `__gcruniqueid` on forms before hydrate (dev overlay). */}
                <form action={logout} className="sb-menuform" suppressHydrationWarning>
                  <button className="ws-action" type="submit">
                    <Ic.logout size={15} /> Log out
                  </button>
                </form>
              </div>
            )}
          </Popover>
        </div>
      </div>
    </aside>
  );
}

/** Section head — label + chevron, optional tertiary action (Figma 56:2559). */
function SectionHead({
  label,
  collapsed,
  onToggle,
  action,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="sb-section">
      <div className="sb-section-inner">
        <button
          className="sb-section-toggle"
          type="button"
          data-collapsed={collapsed ? '' : undefined}
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          <span className="sb-section-label">{label}</span>
          <span className="sb-section-caret" aria-hidden>
            <Ic.chevronDown size={14} />
          </span>
        </button>
        {action}
      </div>
    </div>
  );
}

/** Renders a single project row in the sidebar nav. */
function ProjectNavItem({
  project: p,
  pathname,
}: {
  project: Projects[number];
  pathname: string;
}) {
  const href = `/app/p/${p.key}`;
  return (
    <Link className="nav-item" href={href} data-active={pathname.startsWith(href) ? '' : undefined}>
      <span className="nav-icon">
        <EntityIcon icon={p.emoji} color={p.color} size={16} />
      </span>
      <span className="nav-label">{p.name}</span>
      {p.issues > 0 && <span className="nav-badge">{p.issues}</span>}
    </Link>
  );
}

/** Splits projects into pinned and everything else (unpinned). */
function splitProjects(projects: Projects): { pinned: Projects; others: Projects } {
  return {
    pinned: projects.filter((p) => p.pinned),
    others: projects.filter((p) => !p.pinned),
  };
}
