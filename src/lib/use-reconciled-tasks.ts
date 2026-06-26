'use client';

/**
 * Client task mirror for the return-row reconcile path (perceived-performance PP-B4).
 *
 * The optimistic surfaces (board, list, inbox) used to mirror the server `tasks`
 * prop *transiently* via `useOptimistic`, relying on every action's
 * `revalidatePath('/app','layout')` to re-flow the authoritative prop after a
 * mutation — a full subtree re-read per single-field edit (solution.md §4).
 *
 * This hook holds the list in a `useState` mirror seeded from the prop, so a
 * scoped mutation can `commit` the server's returned row directly and skip the
 * refetch. The server is still the source of truth: whenever the prop changes
 * (navigation, or a *revalidating* mutation from another path), the mirror
 * re-syncs to it. Optimistic predictions still layer on top via the same pure
 * `applyTaskOptimistic` reducer (ADR 0002) — this is NOT the global client store
 * that ADR rejected; it is a per-surface mirror that defers to server truth.
 */
import { useCallback, useEffect, useOptimistic, useState } from 'react';
import type { TaskDto } from '@/server/services';
import { applyTaskOptimistic, type OptimisticTaskAction } from '@/lib/optimistic';

export interface ReconciledTasks {
  /** The list to render: client mirror with any in-flight optimistic prediction applied. */
  tasks: TaskDto[];
  /** Paint an optimistic prediction for the duration of a transition (ADR 0002). */
  applyOptimistic: (action: OptimisticTaskAction) => void;
  /** Commit server-returned row(s) into the mirror — permanent, no refetch (PP-B4). */
  commit: (rows: TaskDto | TaskDto[]) => void;
}

export function useReconciledTasks(serverTasks: TaskDto[]): ReconciledTasks {
  const [tasks, setTasks] = useState(serverTasks);

  // Re-sync to server truth whenever the prop changes — navigation, or a
  // revalidating mutation (create/assign/delete) that re-flowed the subtree.
  // Reconcile edits don't revalidate, so this stays quiet between them and the
  // committed rows persist; when it does fire, the DB already reflects them.
  useEffect(() => {
    setTasks(serverTasks);
  }, [serverTasks]);

  const [optimisticTasks, applyOptimistic] = useOptimistic(tasks, applyTaskOptimistic);

  const commit = useCallback((rows: TaskDto | TaskDto[]) => {
    const list = Array.isArray(rows) ? rows : [rows];
    if (list.length === 0) return;
    const byId = new Map(list.map((r) => [r.id, r]));
    setTasks((prev) => prev.map((t) => byId.get(t.id) ?? t));
  }, []);

  return { tasks: optimisticTasks, applyOptimistic, commit };
}
