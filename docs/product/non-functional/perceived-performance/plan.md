# Perceived Performance — Solution Status (Living Tracker)

> Maps each requirement in **[spec.md](spec.md)** (the source of truth) to its current state.
> **Unmet requirements stay unchecked todos here.** The *design* behind each item — patterns,
> trade-offs, target shape — lives in **[solution.md](solution.md)** (organised by mechanism);
> this file links into it and only tracks status. This file changes whenever a solution ships or
> a measurement is taken; the requirements file changes only when the bar itself moves.

**Legend:** `[x]` ✅ met · `[~]` 🚧 partial / by-construction-unverified · `[ ]` ⬜ not started
**Snapshot date:** 2026-06-26 · against `main`. Shipped this pass: **(#1)** failure-feedback layer
(toast + mutation runner — [toast.tsx](../../../../src/components/ui/toast.tsx),
[app/error.tsx](../../../../src/app/app/error.tsx)); **(#2)** route-level streaming —
`loading.tsx` per leaf app segment + dimension-matched skeletons
([skeletons.tsx](../../../../src/components/app/skeletons.tsx)). Still absent: per-sub-region
`<Suspense>` inside a page, and `revalidateTag` (still 20 `force-dynamic`, 0 tag-cache;
`reactCompiler: true`).

---

## PP-W — Write responsiveness

- [x] **PP-W1** — Optimistic paint via `useOptimistic` + `startTransition`, per surface
  ([optimistic.ts](../../../../src/lib/optimistic.ts), [board.tsx](../../../../src/components/app/board.tsx),
  [task-list.tsx](../../../../src/components/app/task-list.tsx), [inbox.tsx](../../../../src/components/app/inbox.tsx);
  [ADR 0002](../../../adr/0002-optimistic-updates.md)). Met for board drag, list/inbox toggle, bulk single-field.
  → design: [solution.md §1](solution.md).
- [~] **PP-W2** — Surface stays mounted under `startTransition`, holds **by construction**; but
  **no explicit pending affordance** and **not load-verified**. *Todo: verify INP < 200 ms during a pending save.*
  → design: [solution.md §1, §7](solution.md).
- [~] **PP-W3** — Independent gestures use independent transitions; holds **by construction**.
  Not verified back-to-back on a slow DB. *Todo: trace two rapid edits remote.* → design: [solution.md §2](solution.md).
- [~] **PP-W4** — Last-intent convergence under rapid same-entity writes. Holds **by construction**:
  Next serialises Server Actions per client (`AppRouterActionQueue`), so writes apply in intent
  order. *Todo: confirm with a back-to-back board-drag trace remote.* → design: [solution.md §2](solution.md).

## PP-R — Read & navigation responsiveness

- [x] **PP-R1** — Shell paints without blocking on data. **Met:** the persistent app layout
  (sidebar/chrome) renders independently of the page; each segment's slow data now streams behind a
  `loading.tsx` Suspense fallback instead of blocking the shell. (`loadShell` itself is a small
  same-region read.) → design: [solution.md §3](solution.md).
- [x] **PP-R2** — Immediate loading state on navigation. **Met:** `loading.tsx` per leaf app
  segment ([skeletons.tsx](../../../../src/components/app/skeletons.tsx)) — project view, overview,
  inbox, all-projects, settings, workspace-settings — so a navigation paints a structural skeleton
  at once, never a blank screen or a frozen copy of the previous view. → design: [solution.md §3](solution.md).
- [~] **PP-R3** — Progressive streaming of slow regions. **Partial:** each segment streams behind a
  skeleton that **reuses the real layout container classes** (`.topbar`/`.qcap`/`.scroll-body`/
  `.task-row`…) so the swap holds layout dimensions (CLS target met by construction). *Not yet
  done:* per-**sub-region** streaming **within** a page (e.g. task list streaming separately from
  the project chrome) — pages still load their data as a unit. Deferred (the monolithic client
  views would need splitting; same-region DB makes it low-priority until measured — YAGNI).
  → design: [solution.md §3](solution.md).
- [ ] **PP-R4** — LCP < 2.5 s on production target. **Unmeasured** (needs the live deploy). Trace
  once on Vercel+Supabase.
  → design: [solution.md §3](solution.md).

## PP-B — Server/DB latency budget

- [x] **PP-B1** — Region colocation. **Met (documented operator requirement):**
  [deploy-vercel-supabase.md](../../../infra/deploy-vercel-supabase.md) Step 1. *Deploy-time choice,
  not enforced in code.* → design: [solution.md §6](solution.md).
- [x] **PP-B2** — Connection pooling. **Met:** transaction pooler on `6543` for the app runtime
  (same doc); direct/IPv6 rejected. → design: [solution.md §6](solution.md).
- [ ] **PP-B3** — No N+1 / sequential waterfall. **Unaudited.** Known: `taskService.reorder` loops
  per-row `UPDATE`. → design: [solution.md §5](solution.md).
- [ ] **PP-B4** — Scoped invalidation. **Not met:** actions end in `revalidatePath('/app','layout')`
  ([tasks.ts](../../../../src/app/_actions/tasks.ts)) — coarse full-subtree refetch; compounds the
  action queue (solution.md §2). → design: [solution.md §4](solution.md).
- [ ] **PP-B5** — P95 action round-trip < 400 ms. **Unmeasured** (no telemetry). *Todo: add action
  timing; read Vercel observability.* → design: [solution.md §2, §4](solution.md).

## PP-F — Failure feedback & reconciliation

- [x] **PP-F1** — Visible error on failure. **Met:** the mutation runner
  ([toast.tsx](../../../../src/components/ui/toast.tsx) `useRun`/`useOptimisticRun`) catches every
  action failure and raises a dismissable error toast (`role="alert"`, `aria-live="assertive"`)
  tied to the failed gesture, wired across **all** write surfaces (board/list/inbox, detail panel +
  comments + sub-tasks + attachments, overview module/milestone config, sidebar, tabs, settings,
  forms); `app/error.tsx` is the route-level backstop for load/render faults. *Verified by fault
  injection of the real runner (forced throw → toast).* → design: [solution.md §7](solution.md).
- [x] **PP-F2** — Revert **plus** retry path. **Met:** React auto-reverts on throw (PP-F4) and the
  toast carries a **Retry** that re-applies the whole optimistic gesture (verified: retry re-flips
  the optimistic value, then re-runs). Drafts (comment/sub-task/forms) are kept on failure, never
  silently dropped. Creates use a no-retry toast (avoids duplicate-write on a lost response).
  → design: [solution.md §7](solution.md).
- [x] **PP-F3** — "Still saving…" after ~1 s. **Met:** a global in-flight counter in the provider
  arms a `1000 ms` timer on the 0→1 edge; the indicator stays hidden for fast writes and reveals
  only past the threshold, clearing when all writes settle. *Verified: hidden at 300 ms, shown at
  1200 ms, cleared on resolve.* → design: [solution.md §7](solution.md).
- [x] **PP-F4** — Convergence to server truth. **Met:** awaited action's `revalidatePath` re-flows
  authoritative `tasks`; `useOptimistic` reconciles, a thrown action auto-reverts — **confirmed
  empirically** that catching the error inside the transition still reverts to truth. → design:
  [solution.md §1](solution.md).
- [~] **PP-F5** — Late / out-of-order response must not overwrite newer state. Holds **by
  construction**: actions serialise (PP-W4) and there is no manual response-apply step to clobber.
  → design: [solution.md §2](solution.md).

---

## Open todos — prioritized

The user flagged **error feedback** as the top intent gap. Infra (PP-B1/B2) is already satisfied by
the deploy doc, so the open, in-repo work, in priority order:

1. ~~**Failure feedback (PP-F1, PP-F2, PP-F3)**~~ — ✅ **done** (IW-93): toast + mutation runner +
   slow-save indicator + route error boundary. Closes the ADR 0002 silent-revert gap.
2. ~~**Streaming reads (PP-R1, PP-R2, PP-R3)**~~ — ✅ **done** (PP-R1/R2 met; PP-R3 partial):
   `loading.tsx` per leaf segment + dimension-matched skeletons. Remaining: per-sub-region
   `<Suspense>` within a page (deferred — needs splitting the monolithic client views).
3. **Scoped invalidation (PP-B4)** — `revalidateTag` or return-row reconcile, so a single edit stops
   triggering a full-layout refetch — and the action queue drains faster (solution.md §2).
4. **Query-shape audit (PP-B3)** — N+1 / sequential waterfalls in the service layer; reorder representation.
5. **Measurement (PP-R4, PP-B5, verify PP-W2/W3/W4)** — trace against the real Vercel+Supabase deploy
   so targets are checked with data, not assumed. *(Also worth a smoke-test of PP-F1/F2/F3 on the
   real surfaces against remote latency, to complement the local fault-injection verification.)*

> Each item above is a candidate IndieWork task in project **IW**. Mirror them with the `indiework`
> skill when you want them on the board.
