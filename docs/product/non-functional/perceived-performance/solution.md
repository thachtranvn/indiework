# Perceived Performance — Technical Solution (IndieWork)

> **How** IndieWork meets the responsiveness bar in [spec.md](spec.md), organised **by
> mechanism** rather than by requirement ID. This is the durable design: the patterns, why
> they hold, the trade-offs, and the target shape for designs not yet built.
>
> The triad: **[spec.md](spec.md)** = *what* (requirements, source of truth) · **this file**
> = *how* (design) · **[plan.md](plan.md)** = *status* (living tracker, links back here).
> When a mechanism here changes, update this file; when a requirement is met/measured, update
> plan.md. Requirement text and met/not verdicts live in those two files, **not** here.
>
> Stack snapshot: Next.js 16.2.9 · React 19.2.4 (`reactCompiler: true`) · Drizzle 0.45 ·
> dual-driver (Postgres `pg` 8.21 / libsql). No client query library (no TanStack Query / SWR).

---

## 1. The core loop — optimistic paint over a server-owned cache

Everything write-side builds on one loop ([ADR 0002](../../../adr/0002-optimistic-updates.md)):

```
gesture
  └─ startTransition(() => {
        applyOptimistic(action)        // 1. paint now      (useOptimistic reducer)
        await serverAction(args)       // 2. mutate         ('use server')
     })                                //    └ revalidatePath('/app','layout')
                                       // 3. authoritative props re-flow (RSC re-render)
                                       // 4. React rebases optimistic state onto fresh props
```

The decisive architectural choice: **there is no client cache to keep in sync.** The server
(RSC + `revalidatePath`) *is* the cache. `useOptimistic` holds the predicted value only for
the duration of the transition, then discards it as the re-flowed `tasks` prop becomes the new
base. The optimistic reducer is pure ([src/lib/optimistic.ts](../../../../src/lib/optimistic.ts));
the surfaces ([board.tsx](../../../../src/components/app/board.tsx),
[task-list.tsx](../../../../src/components/app/task-list.tsx),
[inbox.tsx](../../../../src/components/app/inbox.tsx)) own the gesture → transition wiring.

This loop is the mechanism behind instant write feedback (**PP-W1**) and guaranteed convergence
(**PP-F4**): a thrown action makes React auto-revert the optimistic value, and a successful one
is superseded by re-flowed truth either way.

**Deliberate exclusion:** `createTask` stays non-optimistic (board `addTo`) — it needs a
server-generated id/ref, so it `router.refresh()`es instead of predicting.

---

## 2. Action serialisation — ordering correctness comes for free

The race that worries every optimistic UI (rapid edits to the same entity persisting
out of order; a stale response clobbering newer state — **PP-W4 / PP-F5**) is **structurally
absent** in this stack, for a reason specific to Next's App Router.

**Confirmed in Next 16 source** (`packages/next/src/client/components/app-router-instance.ts`,
`AppRouterActionQueue`): Server Actions from a single client are **queued and run
sequentially**. A second action invoked while one is pending is appended (`actionQueue.last.next
= newAction`); the next node is only handed to `runAction` by `runRemainingActions` *after* the
previous action resolves. Because `runAction` is what **dispatches the request**, B's request is
withheld until A's round-trip (including its `revalidatePath` result) completes — the queue defers
the *request*, not merely the application of the result. This applies to programmatic calls inside
`startTransition` (the board's `updateTask`, not a `<form action>`): every server-action dispatch
becomes a `ReducerActions` queue node regardless of how it was invoked.

This is established at the **framework-source level**; the matching `[~]` in plan.md (PP-W4/PP-F5)
tracks an end-to-end remote trace to confirm it on the real target, not doubt about the mechanism.

Consequences for our model:

- **No Race 1 (server applies out of order).** Action B's request is not even sent until A has
  fully resolved. The server applies edits in invocation order = the user's intent order. The
  last write reflects the last intent.
- **No Race 2 (stale response overwrites newer UI).** Responses return in order, and there is
  **no manual "apply server response" step** to guard — reconciliation is React rebasing
  `useOptimistic` onto re-flowed props. The classic fixes (client sequence token, drop-stale
  response, per-entity mutation queue) target a **client-cache** model; they have nothing to
  attach to here and are intentionally **not** implemented.

**The real UI case.** On the board, a drag is a **cross-column status patch** (`updateTask`),
committed **on drop** (one write per drop — [board.tsx](../../../../src/components/app/board.tsx)
`drop()`), not on intermediate hover. Dragging a card B→C→… in quick succession enqueues status
patches that apply in order. (`reorderTasks` exists in
[_actions/tasks.ts](../../../../src/app/_actions/tasks.ts) but is **not wired into any
component** yet; the only live reorder is module/milestone in
[overview.tsx](../../../../src/components/app/overview.tsx).)

**The trade-off serialisation creates.** Correctness is free, but **confirmation latency
stacks**: a burst of N rapid edits drains one-at-a-time, each paying a full round-trip *including
its coarse `revalidatePath`* (§4). Optimistic paint stays instant, but the tail of the queue
confirms late on a remote DB. This is why §4 (scoped invalidation, to drain the queue faster)
and the slow-save affordance (**PP-F3**, gated on `isPending` which naturally spans the queued
tail) matter more here than any ordering guard.

**Caveat — scope of the guarantee.** Serialisation is per client/tab (one `AppRouterActionQueue`).
A second tab, or the MCP surface ([app/mcp/route.ts](../../../../src/app/mcp/route.ts)) writing
concurrently, can still interleave at the DB. That is the multi-client case, an explicit
**non-goal** ([spec.md](spec.md) §3); convergence still holds because each surface re-reads
authoritative truth after its own write.

---

## 3. Reads — stream the shell instead of awaiting data

Write-side optimism cannot touch first paint and navigation (**PP-R**). The design target is to
decouple the shell from data:

- **Current shape:** every app route is `export const dynamic = 'force-dynamic'` (20 files) and
  each `page` `await`s its queries before returning, so the shell paints only after the slowest
  query. There is no `loading.tsx` and no `<Suspense>` in the tree.
- **Target design:**
  1. **`loading.tsx` per app segment** → an instant route-level skeleton on navigation
     (**PP-R2**), via the App Router's automatic Suspense boundary.
  2. **`<Suspense fallback={<Skeleton/>}>` around each slow data region** so the shell and fast
     regions paint while slow ones stream in independently (**PP-R1**, **PP-R3**). Hold layout
     dimensions in the skeleton to keep CLS < 0.1.
  3. Optionally **PPR / `cacheComponents`** (Next 16) for a static shell + dynamic holes once the
     boundaries exist.

These are read-path structural changes, independent of the write loop in §1.

---

## 4. Reconciliation scope — stop refetching the whole subtree

Every action ends in `revalidatePath('/app','layout')`
([_actions/tasks.ts](../../../../src/app/_actions/tasks.ts) `refresh()`) — a **coarse
full-subtree refetch**. It is cheap against an idle local DB but expensive across a network, and
it compounds the §2 queue: each serialized action drags a full re-read behind it (**PP-B4**).

Two target designs, in increasing divergence from today:

- **`revalidateTag` per surface/task-list** — keep the server-owned-cache model, but invalidate
  only the affected region. Minimal client change.
- **Return the changed row from the action and reconcile client-side** through the existing
  optimistic reducer — the change already round-tripped, so apply it directly and skip the
  refetch. A middle ground that is explicitly **not** the global client store ADR 0002 rejected;
  it reuses [optimistic.ts](../../../../src/lib/optimistic.ts) `applyTaskOptimistic`.

Either one shortens the §2 queue-drain time directly, which is the highest-leverage write-path win.

---

## 5. Query shape & ordering data

- **Sequential waterfalls (PP-B3).** `taskService.reorder`
  ([task.service.ts](../../../../src/server/services/task.service.ts)) loops per-row `UPDATE`
  inside one transaction (N statements one-after-another); module/milestone reorder share the
  shape. Independent reads/writes should be batched (`Promise.all`) or collapsed into a single
  statement. Bulk task ops already fan out with `Promise.all` within one action — good; the
  remaining audit is the service-layer read paths.
- **Reorder representation (PP-B3 + PP-B4).** Today `position` is a dense integer and a reorder
  **renumbers the whole list** (`position: i`). When task reorder is actually wired, prefer
  **fractional indexing / LexoRank** for `position`: a move becomes **one scoped write** to the
  moved row (a key between its new neighbours) instead of an N-row renumber — paying off as both
  a smaller query (PP-B3) and a scoped invalidation target (PP-B4). Rebalance keys when
  precision runs out. Note this is a **PP-B** (cost) optimisation, *not* a PP-W4 correctness fix
  — ordering is already correct by §2 and by the full-array idempotence of the current reorder.

---

## 6. Dual-driver — the cross-cutting constraint

IndieWork runs on **two database drivers** behind one `db`
([db/index.ts](../../../../src/server/db/index.ts)), chosen by `DB_DRIVER`: **Postgres `pg`**
(managed path — Vercel + Supabase) and **libsql** (self-host / public demo). Every
latency-hiding mechanism above must hold on **both**, and a few PP-B items only exist on one:

- **Pooling (PP-B2) is a pg-path concern.** `pg.Pool { max: 10, keepAlive, idleTimeout }` plus
  the Supabase **transaction pooler on `:6543`** (mandated by
  [deploy-vercel-supabase.md](../../../infra/deploy-vercel-supabase.md); direct/IPv6 rejected).
  libsql is in-process — no pool, just a `busy_timeout` guard.
- **Region colocation (PP-B1)** only means anything on the managed path (app and DB across a
  network); trivially met when self-hosted in one process.
- **Driver choice is forced by transactions.** The service layer uses async transaction
  callbacks, which synchronous `better-sqlite3` cannot run — hence libsql. Any design that
  assumes Postgres-only features (e.g. `revalidateTag` is driver-agnostic, but a Postgres-only
  SQL trick for §5 would not be) must degrade cleanly on libsql.

The **managed remote path is the design target** (worst-case envelope, [spec.md](spec.md) §1);
solutions are validated there but must not break the in-process driver.

---

## 7. Failure feedback — surface the revert (as built)

ADR 0002 deliberately shipped a **silent revert**: React reverts the optimistic value on a thrown
action (the §1 convergence), but the user was never told and could not retry. That is the top
intent gap (**PP-F1/F2/F3**), now closed by a **mutation runner + toast layer**
([toast.tsx](../../../../src/components/ui/toast.tsx)), mounted once as `FeedbackProvider` in
[app/layout.tsx](../../../../src/app/app/layout.tsx) so it wraps every write surface.

**The provider** owns a toast stack (portalled to `document.body`, `z-index` above modals) and a
single global **in-flight counter**. Two hooks layer over it, one per mutation shape:

- **`useRun`** — wraps a plain (non-optimistic) action: tracks pending, and on rejection raises an
  error toast tied to the action (**PP-F1**). Returns the resolved value or `undefined` on failure,
  so callers branch on success (navigate / clear a draft only when it actually saved). Used for
  creates, detail-panel edits, comments, attachments, overview config, sidebar, tabs, settings.
- **`useOptimisticRun(applyOptimistic)`** — wraps the ADR 0002 gesture (board drag, list/inbox
  toggle, bulk). It runs `applyOptimistic` + the action inside `startTransition`; on throw, React
  reverts the optimistic value to truth (the action didn't revalidate — §1) **and** the runner
  raises a toast whose **Retry** re-runs the *whole* gesture in a fresh transition (**PP-F2**).

**Why a global counter, not `isPending`.** The original target gated the slow-save indicator on a
`useTransition` `isPending`. The as-built uses a provider-level counter instead: it is incremented
as each write goes in-flight and decremented when it settles, and it **spans every surface**, not
one component's transition. A `1000 ms` timer is armed on the 0→1 edge and cleared on the →0 edge —
so intermediate count changes during a draining burst don't reset it, and one **"Still saving…"**
indicator (`aria-live="polite"`) correctly covers a burst (**PP-F3**). This still relies on §2's
serialisation for *ordering*, but no longer on a single `isPending` to span the tail.

**Retry & draft safety.** Idempotent updates default to a Retry action; **creates use a no-retry
toast** (a retry could duplicate a write whose response was merely lost). Surfaces that compose a
draft — comment composer, sub-task add, the workspace/project forms — clear or close **only on a
truthy (success) result**, so a failed save keeps what the user typed (**PP-F2**: never lost without
acknowledgement). `app/error.tsx` is the route-level backstop for the *other* failure class — a
fault thrown while a route's data loads or renders (e.g. Server Action version-skew after a deploy).

**Verified, not assumed.** The decisive risk was whether catching the thrown error *inside* the
transition still lets `useOptimistic` revert to truth. Fault injection of the real runner confirms
it: the optimistic value paints, then reverts to truth at the throw, with the error toast and a
working Retry; the slow-save indicator stays hidden for sub-1 s writes and appears past the
threshold. (Local fault-injection of the runner path; a remote-latency smoke test on the live
surfaces is tracked as the PP-F slice of the §measurement todo in [plan.md](plan.md).)

---

## References

- [spec.md](spec.md) — the requirements these mechanisms satisfy.
- [plan.md](plan.md) — per-ID status; links into the sections above.
- [ADR 0002](../../../adr/0002-optimistic-updates.md) — the optimistic-update decision (§1, §7).
- [deploy-vercel-supabase.md](../../../infra/deploy-vercel-supabase.md) — managed-path infra (§6).
- Next 16 action queue: `packages/next/src/client/components/app-router-instance.ts`
  (`AppRouterActionQueue`, `runRemainingActions`) — the basis for §2.
