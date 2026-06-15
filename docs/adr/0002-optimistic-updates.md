# 0002 — Optimistic updates for board/list mutations

- **Status:** Accepted
- **Date:** 2026-06-15
- **Deciders:** Tung Nguyen

## Context

Every task mutation in the Web UI goes through a Server Action in
[src/app/_actions/tasks.ts](../../src/app/_actions/tasks.ts) that ends with
`revalidatePath('/app', 'layout')`. The calling client component then typically
also called `router.refresh()`. The net effect: after a drag, a checkbox toggle,
or a bulk edit, the UI **waited** for the server round-trip *and* a full re-fetch
of the layout subtree before anything moved on screen.

The most visible case is the board ([board.tsx](../../src/components/app/board.tsx)):
on drop, `setDragId(null)` cleared the drag state, so the card **snapped back to its
original column** and sat there until `await updateTask(...)` + the refresh
re-rendered it in the new column. Same shape on the list checkbox, the inbox
checkbox, and the bulk bar — a single-field change that the user expects to be
instant instead felt laggy and flickered.

The stack is React 19.2 + Next 16.2, so `useOptimistic` is available.

## Decision

**Apply optimistic updates per-component with `useOptimistic` + `startTransition`,
layered over the Server Actions that already revalidate** — not a global client
store, and only for the interactions where it actually pays off.

### Mechanism

Each surface mirrors its server `tasks` prop through one reducer:

```ts
const [optimisticTasks, applyOptimistic] = useOptimistic(tasks, applyTaskOptimistic);

const onToggleDone = (id: string) => {
  startTransition(async () => {
    applyOptimistic({ kind: 'toggleDone', id }); // paints immediately
    await toggleTaskDone(id);                     // revalidatePath re-flows real data
  });
};
```

The shared reducer + helpers live in
[src/lib/optimistic.ts](../../src/lib/optimistic.ts) (`applyTaskOptimistic`,
`toggledDone`). `done` is a derived field (`status === 'done'`); the reducer keeps
it in sync exactly as `taskService` does.

Because `useOptimistic` holds the optimistic value only while a transition is
pending, and the awaited action's `revalidatePath` re-flows the authoritative
`tasks` prop, the optimistic state reconciles to real data with no extra wiring —
**and a thrown action auto-reverts the optimistic change.**

### Consequence: `router.refresh()` is dropped where it was redundant

`revalidatePath('/app', 'layout')` inside a Server Action invoked from a client
component already refreshes the current route. The extra `router.refresh()` was a
second fetch. It is **removed** from every optimistic path (board drag, list
toggle/bulk, inbox toggle/assign). It is **kept** only where a non-action fetch is
involved — e.g. the detail panel's `reload()` calls `getTaskDetail` directly.

## Where optimistic is applied (and where it is not)

The rule: optimistic pays off when the change is **one known field, high-frequency,
near-zero failure rate, and the user is staring at the affected row/board.** It is
*not* worth the bug surface for creates (need a server-generated `id`/`ref`),
destructive-but-rare ops, or low-frequency config.

| Tier | Surface | Interaction | Action | Optimistic op |
|------|---------|-------------|--------|---------------|
| 1 | [board.tsx](../../src/components/app/board.tsx) | drag card to column/lane | `updateTask` | `patch` |
| 1 | [task-list.tsx](../../src/components/app/task-list.tsx) | row checkbox | `toggleTaskDone` | `toggleDone` |
| 1 | [inbox.tsx](../../src/components/app/inbox.tsx) | row checkbox | `toggleTaskDone` | `toggleDone` |
| 1 | [detail-panel.tsx](../../src/components/app/detail-panel.tsx) | sub-task checkbox | `toggleTaskDone` | local flip via `setDetail` |
| 2 | [task-list.tsx](../../src/components/app/task-list.tsx) | bulk set status / priority / done | `bulkUpdateTasks` | `patch` |
| 2 | [task-list.tsx](../../src/components/app/task-list.tsx) | bulk delete | `bulkDeleteTasks` | `remove` |
| 2 | [inbox.tsx](../../src/components/app/inbox.tsx) | assign to project | `assignTaskToProject` | `remove` (leaves Inbox) |

**Deliberately NOT optimistic:**

- **All `createTask`** (board "Add card", quick-capture, `addSubtask`): a create needs
  the server-generated `id`/`ref`. Optimistic would mean rendering a placeholder card
  with a temp id and reconciling — real bug surface for little gain, since the
  revalidate surfaces the new card quickly anyway. (YAGNI.)
- **`deleteTask` from the detail panel:** closes the panel; rolling a "vanished" task
  back on error is more jarring than a brief wait.
- **Comments / attachments:** users tolerate network latency here; comments also need a
  server timestamp/id.
- **Settings, project/workspace forms, overview config edits:** low-frequency,
  full-form submits.

## Why not a global client store

`list`, `board`, and `detail-panel` are three separate React trees, each holding its
own copy of the server data via props, and `useOptimistic` is per-component — so an
optimistic change in one does not propagate to the others. That is acceptable today
because the user effectively sees one surface at a time (the detail panel is an
overlay, and a `revalidatePath` refresh re-syncs the rest within the same tick).

Lifting `tasks` into a shared client store (Zustand/Context) so "edit once → every
surface updates instantly" is a **larger refactor with real ongoing cost** (keeping
the store in sync with server truth, cache invalidation). It is **not** justified by
current UX needs — revisit only if cross-surface staleness becomes a real complaint.
(YAGNI.)

## The pattern for future mutations

When adding a new task mutation, decide its tier by the rule above:

1. **Single known field, frequent, low failure rate** → wrap in
   `startTransition`, call `applyOptimistic({...})` first, then `await` the action.
   Extend `OptimisticTaskAction` in [src/lib/optimistic.ts](../../src/lib/optimistic.ts)
   if a new op shape is needed. Do **not** add a `router.refresh()`.
2. **Create, rare-destructive, or config** → keep it plain (`await action()`), and add
   `router.refresh()` only if the mutation's action does not already revalidate the
   route you are on.

## Consequences

**Positive**

- Board drag, checkboxes, and bulk edits feel instant; no snap-back/flicker.
- One shared reducer keeps the optimistic math in one place and matches service truth.
- Removing redundant `router.refresh()` cuts a second fetch per mutation.

**Trade-offs**

- Optimistic state is per-surface, not global (see above) — accepted.
- On a failed action the optimistic change reverts via React; the user gets the
  snap-back rather than an explicit error toast. Acceptable for a single-user,
  self-hosted tool with a near-zero failure rate against a local DB; a visible error
  affordance can be layered on later if needed.

## References

- [src/lib/optimistic.ts](../../src/lib/optimistic.ts) — shared reducer + helpers
- [src/app/_actions/tasks.ts](../../src/app/_actions/tasks.ts) — actions that `revalidatePath`
- [scope.md](../scope.md) §1 (three frontends, one service layer)
- ADR [0001](0001-mcp-as-agent-surface.md) — same "thin adapters over one service layer" shape
