'use client';

import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ShellData } from '@/server/load';
import { useTaskNav, refFromPath } from '@/lib/task-nav';
import { useIsMobile } from '@/lib/use-media-query';
import { Sidebar } from './sidebar';
import { DetailPanel } from './detail-panel';
import { ProjectForm } from './project-form';
import { WorkspaceForm } from './workspace-form';
import { CommandPalette } from './command-palette';
import { Ic } from '@/components/ui/icons';
import { TipHost } from '@/components/ui/tip-host';

/** Slide-out duration of `.detail-panel` — keep in sync with app.css (+ a
 *  short buffer so iOS doesn't unmount mid-composite). */
const DETAIL_EXIT_MS = 450;
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
  // it was showing and drop it once the exit animation (.4s) has finished.
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
  // Default matches the server snapshot. Prefs load in useLayoutEffect (before
  // paint) so a persisted collapse doesn't animate shut, and hydration stays
  // clean — reading localStorage in useState() mismatched SSR HTML on device.
  const [collapsed, setCollapsed] = useState(false);
  const [showProject, setShowProject] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // On phones the sidebar is an overlay drawer instead of a grid track, so it
  // needs its own state: `collapsed` is persisted and would otherwise launch the
  // drawer already open just because the user left the rail expanded on desktop.
  // Navigating always dismisses it — tracked alongside the path and adjusted
  // during render (same pattern as `lastOpen` above) rather than in an effect,
  // so the drawer never paints one frame over the page it just left.
  const isMobile = useIsMobile();
  const [drawer, setDrawer] = useState({ open: false, path: pathname });
  if (drawer.path !== pathname) setDrawer({ open: false, path: pathname });
  const drawerOpen = drawer.open;
  const setDrawerOpen = useCallback(
    (open: boolean | ((prev: boolean) => boolean)) =>
      setDrawer((d) => ({ ...d, open: typeof open === 'function' ? open(d.open) : open })),
    [],
  );

  // sidebar / detail widths + collapsed state persisted to localStorage (iw-*)
  useLayoutEffect(() => {
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

  // Same trigger (`iw:toggle-sidebar`, the header button) means "collapse the
  // rail" on desktop and "open the drawer" on mobile.
  const toggleNav = useCallback(() => {
    if (isMobile) setDrawerOpen((o) => !o);
    else toggleCollapsed();
  }, [isMobile, toggleCollapsed]);

  // keyboard: ⌘K search, c quick-capture; sidebar toggle from the headers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch((s) => !s);
        return;
      }
      if (e.key === 'Escape') setDrawerOpen(false);
      const el = e.target as HTMLElement | null;
      const typing = !!el && (/input|textarea/i.test(el.tagName) || el.isContentEditable);
      if (e.key === 'c' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('iw:focus-capture'));
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('iw:toggle-sidebar', toggleNav);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('iw:toggle-sidebar', toggleNav);
    };
  }, [toggleNav]);

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
      data-detail={detailKey || closing ? '' : undefined}
      data-resizing={resizing ?? undefined}
      // Collapsing is a desktop-only concept — on mobile the rail is off-canvas
      // regardless, and honouring a persisted collapse would only disable the
      // drawer's pointer events.
      data-sb-collapsed={!isMobile && collapsed ? '' : undefined}
      data-drawer={drawerOpen ? '' : undefined}
      style={
        {
          '--sidebar-w': `${collapsed ? 0 : width}px`,
          '--sidebar-panel-w': `${width}px`,
          '--detail-panel-w': `${detailWidth}px`,
        } as React.CSSProperties
      }
    >
      <div className="sidebar-slot" aria-hidden={(isMobile ? !drawerOpen : collapsed) || undefined}>
        <Sidebar
          shell={shell}
          onNewProject={() => setShowProject(true)}
          onNewWorkspace={() => setShowWorkspace(true)}
          onOpenSearch={() => setShowSearch(true)}
        />
      </div>
      {isMobile && drawerOpen && (
        <button
          className="drawer-scrim"
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
        />
      )}
      {!collapsed && (
        <div className="col-resizer" onMouseDown={startResize} title="Drag to resize · double-click to reset" />
      )}
      {collapsed && (
        <button className="sb-expand" type="button" onClick={toggleCollapsed} title="Expand sidebar" aria-label="Expand sidebar">
          <Ic.sidebar size={16} />
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
