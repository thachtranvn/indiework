'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ShellData } from '@/server/load';
import { Sidebar } from './sidebar';
import { DetailPanel } from './detail-panel';
import { ProjectForm } from './project-form';
import { WorkspaceForm } from './workspace-form';
import { CommandPalette } from './command-palette';

export function AppShell({ shell, children }: { shell: ShellData; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const taskId = params.get('task');

  const [width, setWidth] = useState(256);
  const [resizing, setResizing] = useState(false);
  const [showProject, setShowProject] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // sidebar width persisted to localStorage
  useEffect(() => {
    const v = parseInt(localStorage.getItem('wb-sidebar-w') ?? '', 10);
    if (v >= 180 && v <= 440) setWidth(v);
  }, []);
  useEffect(() => {
    localStorage.setItem('wb-sidebar-w', String(width));
  }, [width]);

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

  const closeDetail = useCallback(() => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.delete('task');
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);
    const left = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect().left;
    const onMove = (ev: MouseEvent) => setWidth(Math.min(440, Math.max(180, ev.clientX - left)));
    const onUp = () => {
      setResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  return (
    <div
      className="app"
      data-detail={taskId ? '' : undefined}
      data-resizing={resizing ? '' : undefined}
      style={{ '--sidebar-w': `${width}px` } as React.CSSProperties}
    >
      <Sidebar
        shell={shell}
        onNewProject={() => setShowProject(true)}
        onNewWorkspace={() => setShowWorkspace(true)}
        onOpenSearch={() => setShowSearch(true)}
      />
      <div className="col-resizer" onMouseDown={startResize} title="Drag to resize" />

      <div className="main-col">{children}</div>

      {taskId && <DetailPanel taskId={taskId} onClose={closeDetail} />}

      {showProject && (
        <ProjectForm
          workspaceId={shell.activeWorkspace?.id ?? null}
          onClose={() => setShowProject(false)}
        />
      )}
      {showWorkspace && <WorkspaceForm onClose={() => setShowWorkspace(false)} />}
      {showSearch && <CommandPalette onClose={() => setShowSearch(false)} />}
    </div>
  );
}
