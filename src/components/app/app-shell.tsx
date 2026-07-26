'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ShellData } from '@/server/load';
import { useTaskNav, refFromPath } from '@/lib/task-nav';
import { Sidebar } from './sidebar';
import { DetailPanel } from './detail-panel';
import { ProjectForm } from './project-form';
import { WorkspaceForm } from './workspace-form';
import { CommandPalette } from './command-palette';
import { Ic } from '@/components/ui/icons';
import { TipHost } from '@/components/ui/tip-host';

/** Slide-out duration of `.detail-panel` — keep in sync with app.css. */
const DETAIL_EXIT_MS = 280;
const SIDEBAR_MIN = 180;
const SIDEBAR_MAX = 440;
const SIDEBAR_DEFAULT = 230;
const DETAIL_MIN = 320;
const DETAIL_MAX = 640;
const DETAIL_DEFAULT = 384;

interface OpenPanel {
  key: string;
  taskRef: string | null;
  taskId: string | null;
}

export function AppShell({ shell, children }: { shell: ShellData; children: ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const { closeTask } = useTaskNav();
  // The open task comes from a ref path (/app/p/IW/issue/IW-11/slug) for project
  // tasks, or the legacy ?task=<uuid> overlay for Inbox tasks (no ref yet).
  const taskRef = refFromPath(pathname)?.ref ?? null;
  const legacyTaskId = params.get('task');
  const detailKey = taskRef ?? legacyTaskId;

  // The panel has to stay mounted while it slides back out, so remember the task
  // it was showing and drop it once the exit animation (.28s) has finished.
  const [lastOpen, setLastOpen] = useState<OpenPanel | null>(null);
  if (detailKey && detailKey !== lastOpen?.key) {
    setLastOpen({ key: detailKey, taskRef, taskId: legacyTaskId });
  }
  const closing = !detailKey && lastOpen !== null;
  const panel = detailKey ? { taskRef, taskId: legacyTaskId } : lastOpen;
  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(() => setLastOpen(null), DETAIL_EXIT_MS);
    return () => clearTimeout(t);
  }, [closing]);

  const [width, setWidth] = useState(SIDEBAR_DEFAULT);
  const [detailWidth, setDetailWidth] = useState(DETAIL_DEFAULT);
  const [resizing, setResizing] = useState<'sidebar' | 'detail' | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showProject, setShowProject] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // sidebar / detail widths + collapsed state persisted to localStorage (iw-*)
  useEffect(() => {
    const v = parseInt(localStorage.getItem('iw-sidebar-w') ?? '', 10);
    if (v >= SIDEBAR_MIN && v <= SIDEBAR_MAX) setWidth(v);
    const d = parseInt(localStorage.getItem('iw-detail-w') ?? '', 10);
    if (d >= DETAIL_MIN && d <= DETAIL_MAX) setDetailWidth(d);
    setCollapsed(localStorage.getItem('iw-sb-collapsed') === '1');
  }, []);
  useEffect(() => {
    localStorage.setItem('iw-sidebar-w', String(width));
  }, [width]);
  useEffect(() => {
    localStorage.setItem('iw-detail-w', String(detailWidth));
  }, [detailWidth]);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('iw-sb-collapsed', next ? '1' : '0');
      return next;
    });
  }, []);

  // keyboard: ⌘K search, c quick-capture
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch((s) => !s);
        return;
      }
      const el = e.target as HTMLElement | null;
      const typing = !!el && (/input|textarea/i.test(el.tagName) || el.isContentEditable);
      if (e.key === 'c' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('iw:focus-capture'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Double-click resets — detect here because preventDefault on mousedown
    // suppresses the native dblclick event.
    if (e.detail === 2) {
      setWidth(SIDEBAR_DEFAULT);
      return;
    }
    setResizing('sidebar');
    const left = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect().left;
    const onMove = (ev: MouseEvent) => setWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, ev.clientX - left)));
    const onUp = () => {
      setResizing(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const startDetailResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (e.detail === 2) {
        setDetailWidth(DETAIL_DEFAULT);
        return;
      }
      setResizing('detail');
      const startX = e.clientX;
      const startW = detailWidth;
      const onMove = (ev: MouseEvent) => {
        // Drag left → wider detail (list shrinks); drag right → narrower.
        setDetailWidth(Math.min(DETAIL_MAX, Math.max(DETAIL_MIN, startW + (startX - ev.clientX))));
      };
      const onUp = () => {
        setResizing(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [detailWidth],
  );

  const detailOpen = Boolean(detailKey);

  return (
    <div
      className="app"
      data-detail={detailKey ? '' : undefined}
      data-resizing={resizing ?? undefined}
      data-sb-collapsed={collapsed ? '' : undefined}
      style={
        {
          '--sidebar-w': `${collapsed ? 0 : width}px`,
          '--detail-panel-w': `${detailWidth}px`,
        } as React.CSSProperties
      }
    >
      <Sidebar
        shell={shell}
        onNewProject={() => setShowProject(true)}
        onNewWorkspace={() => setShowWorkspace(true)}
        onOpenSearch={() => setShowSearch(true)}
        onCollapse={toggleCollapsed}
      />
      {!collapsed && (
        <div className="col-resizer" onMouseDown={startResize} title="Drag to resize · double-click to reset" />
      )}
      {collapsed && (
        <button className="sb-expand" type="button" onClick={toggleCollapsed} title="Expand sidebar" aria-label="Expand sidebar">
          <Ic.list size={18} />
        </button>
      )}

      <div className="main-col">{children}</div>

      {/* Detail slot is always the 3rd grid track so --detail-w can animate
          0↔panel (main shrinks / grows). The panel slides in/out inside the slot at
          the same rate, so the card moves as one piece instead of being wiped. */}
      <div
        className="detail-slot"
        data-closing={closing ? '' : undefined}
        aria-hidden={detailKey ? undefined : true}
      >
        {panel && (
          <DetailPanel taskRef={panel.taskRef} taskId={panel.taskId} onClose={closeTask} />
        )}
      </div>
      {detailOpen && (
        <div
          className="detail-resizer"
          onMouseDown={startDetailResize}
          title="Drag to resize · double-click to reset"
        />
      )}

      {showProject && (
        <ProjectForm
          workspaceId={shell.activeWorkspace?.id ?? null}
          onClose={() => setShowProject(false)}
        />
      )}
      {showWorkspace && <WorkspaceForm onClose={() => setShowWorkspace(false)} />}
      {showSearch && <CommandPalette onClose={() => setShowSearch(false)} />}
      <TipHost />
    </div>
  );
}
