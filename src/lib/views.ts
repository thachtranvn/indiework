'use client';

import { useCallback } from 'react';
import type { TaskStatus } from '@/lib/domain';
import type { IconName } from '@/components/ui/icons';
import { useLocalStorage } from './use-local-storage';

export type ViewMode = 'list' | 'board';

/** Built-in view ids; custom views use generated string ids. */
export type BuiltinViewId = 'all' | 'active' | 'backlog';
export type ViewId = BuiltinViewId | string;

export interface BuiltinView {
  id: BuiltinViewId;
  label: string;
  icon: IconName;
  defaultMode: ViewMode;
}

export const BUILTIN_VIEWS: BuiltinView[] = [
  { id: 'all', label: 'All issues', icon: 'list', defaultMode: 'list' },
  { id: 'active', label: 'Active', icon: 'board', defaultMode: 'board' },
  { id: 'backlog', label: 'Backlog', icon: 'list', defaultMode: 'list' },
];

export const DEFAULT_VIEW: ViewId = 'all';

export interface CustomView {
  id: string;
  label: string;
}

/** Which task statuses a view shows (root tasks are scoped before grouping). */
export function viewAllowsStatus(viewId: ViewId, status: TaskStatus): boolean {
  if (viewId === 'active') return status !== 'backlog' && status !== 'inbox' && status !== 'cancelled';
  if (viewId === 'backlog') return status === 'backlog';
  return true; // all + custom
}

/** Status a quick-captured task lands in for this view (undefined → service default). */
export function viewCaptureStatus(viewId: ViewId): TaskStatus | undefined {
  if (viewId === 'backlog') return 'backlog';
  return undefined;
}

function defaultMode(viewId: ViewId): ViewMode {
  return BUILTIN_VIEWS.find((v) => v.id === viewId)?.defaultMode ?? 'list';
}

let customSeq = 0;

/**
 * View state for one project, persisted to localStorage (`iw-*`, per project key):
 * the custom view list and each view's list/board mode.
 */
export function useViews(projectKey: string) {
  const [customViews, setCustomViews] = useLocalStorage<CustomView[]>(`iw-custom-views-${projectKey}`, []);
  const [viewModes, setViewModes] = useLocalStorage<Record<string, ViewMode>>(`iw-view-modes-${projectKey}`, {});

  const modeFor = useCallback(
    (viewId: ViewId): ViewMode => viewModes[viewId] ?? defaultMode(viewId),
    [viewModes],
  );

  const setMode = useCallback(
    (viewId: ViewId, mode: ViewMode) => setViewModes((m) => ({ ...m, [viewId]: mode })),
    [setViewModes],
  );

  const addView = useCallback((): string => {
    const id = `v${Date.now().toString(36)}${(customSeq++).toString(36)}`;
    setCustomViews((vs) => [...vs, { id, label: 'New view' }]);
    return id;
  }, [setCustomViews]);

  const renameView = useCallback(
    (id: string, label: string) => setCustomViews((vs) => vs.map((v) => (v.id === id ? { ...v, label } : v))),
    [setCustomViews],
  );

  const removeView = useCallback(
    (id: string) => setCustomViews((vs) => vs.filter((v) => v.id !== id)),
    [setCustomViews],
  );

  return { customViews, addView, renameView, removeView, modeFor, setMode };
}
