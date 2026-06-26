# IndieWork — Perceived Performance & Responsiveness (Requirements / Source of Truth)

> The durable definition of **how responsive IndieWork must feel** under any latency, from a
> loaded local DB to the worst-case Vercel → Supabase round-trip. This file states the **what**
> (target behaviour the user must experience). It does *not* prescribe *how* — the **design**
> lives in **[solution.md](solution.md)** (by mechanism) and the **status** in
> **[plan.md](plan.md)** (by ID), where any unmet requirement stays an unchecked todo.
>
> This document changes only when the **quality bar** changes — not when a solution ships.
> Sibling source-of-truth: product = [scope.md](../../scope.md); ordering = [roadmap.md](../../roadmap.md).

---

## 0. How to read this

- Each requirement has a **stable ID** (`PP-W1`, `PP-R2`, …). IDs are permanent; never
  renumber. The status tracker references these IDs.
- Each requirement is **testable**: it has a target you can measure or a behaviour you can
  observe. "Feels fast" is not a requirement; "visual feedback within 100 ms of the gesture" is.
- Each requirement is **solution-agnostic** — it states the experience to achieve, not the
  technique. No requirement names a library, API, or prior implementation decision; that
  mapping belongs in the status tracker.
- Numeric targets are **v1 budgets** — sensible defaults from the team's web performance budget
  (Core Web Vitals) and the RAIL interaction model. Tune them against real production telemetry;
  changing a *number* is a doc edit, changing the *bar* (adding/removing a requirement) is a
  deliberate decision.
- **Abbreviations.** FCP = First Contentful Paint · LCP = Largest Contentful Paint ·
  CLS = Cumulative Layout Shift · INP = Interaction to Next Paint · P95 = 95th percentile ·
  RTT = round-trip time · RAIL = Response, Animation, Idle, Load.

### ID categories — what the user is waiting on

Perceived performance decomposes by *which moment the user is waiting on* — independent of how
any of it is built. Four categories:

| Prefix | Surface | The required experience |
|--------|---------|-------------------------|
| **PP-W** | Write responsiveness | A mutation gives immediate, visible feedback — the user never doubts whether their action registered. |
| **PP-R** | Read responsiveness | Loads and navigations show meaningful structure promptly; slow data fills in progressively instead of blocking the whole view. |
| **PP-B** | Actual latency budget | The underlying work's real time has a hard ceiling — the base cost that PP-W/PP-R sit on top of. Perceived speed only hides latency; it doesn't eliminate it. |
| **PP-F** | Failure feedback & reconciliation | When work fails or stalls, the user is told, can recover, and the screen always settles to the true state. |

---

## 1. Context — perceived performance is universal; latency is the variable

Perceived performance is the gap between a user's intent and a visible, trustworthy response.
**Every** system has it, local or distributed: real work (a query, server compute, the client
render) takes nonzero time, and that time **spikes** under load, lock contention, a bad query
plan, a cold cache, or a large payload. A local Postgres call is cheaper than a cross-region one,
but it is **not free or invisible** — an overloaded local/VPS DB can be slower than a healthy
remote one. So the requirements below target **user-perceived latency from any source**, not a
network hop.

Latency sources this bar must absorb (network is only one):

| Source | Where | Scales with distance? |
|--------|-------|-----------------------|
| Client render / main thread | browser | no — felt even with zero backend |
| Server compute | request handler | no |
| **Database** — query cost, lock/IO contention, **overload**, cold cache | DB | no — topology-independent |
| Transport — client↔server, server↔DB round-trips | network | **yes** |
| Cold start / connection setup | serverless, pool | no |

These requirements are deliberately **solution-agnostic**. What they demand — keeping what the
user *perceives* decoupled from how long the work *actually* takes — is achievable on a loaded
VPS as much as on remote Supabase. *How* each one is met is recorded in the
[status tracker](plan.md), not here.

**Why Vercel + Supabase is named** ([deploy-vercel-supabase.md](../../../infra/deploy-vercel-supabase.md)):
it is the **worst-case latency envelope** (cold start + cross-region RTT + pooled, shared
managed DB), so it is the stress test. If the bar holds there, it holds on a VPS or locally too.
It is the forcing function, **not** the only target — every requirement here applies to every
deployment.

---

## 2. Requirements

### PP-W — Write responsiveness

| ID | Requirement (MUST) | Target / acceptance |
|----|--------------------|---------------------|
| **PP-W1** | A direct manipulation of a **single known field** (drag card between columns/lanes, toggle done, single-field bulk edit) reflects on screen **without waiting for the server to confirm**. | Visual change within **100 ms** of the gesture (RAIL "instant"); no snap-back, no flicker while the save is still pending. |
| **PP-W2** | While a save is pending, the rest of the surface stays **interactive**. A pending write must not freeze the board/list or block an unrelated interaction. | No full-surface disable. INP for the surface stays **< 200 ms** during a pending write. |
| **PP-W3** | Two quick successive interactions on **different rows/cards** must not serialize behind each other. | Second gesture paints within PP-W1's budget regardless of whether the first write has resolved. |
| **PP-W4** | When the **same field** is changed several times in quick succession (e.g. dragging one card through several positions before it settles), the persisted and displayed value converges to the user's **last** intent — out-of-order completion of the individual writes must not leave an earlier value as the winner. | After the burst settles, both server state and on-screen state equal the last intent; no superseded intermediate value wins. (Complements PP-W3 — different rows; relies on PP-F5 + PP-F4.) |

### PP-R — Read & navigation responsiveness

| ID | Requirement (MUST) | Target / acceptance |
|----|--------------------|---------------------|
| **PP-R1** | The app **shell** (sidebar, layout chrome) paints **without blocking on data**. | Shell visible within **FCP < 1.5 s**; data regions may still be loading at that point. |
| **PP-R2** | Navigation between app surfaces shows an **immediate** loading state — never a blank screen or a frozen copy of the previous view while data loads. | A placeholder is visible within **~100 ms** of the navigation intent. |
| **PP-R3** | Slow data regions **fill in progressively** behind a placeholder, rather than holding the whole view hostage to the slowest query. | Each region replaces its own placeholder as its data arrives; **CLS < 0.1** across the swap. |
| **PP-R4** | A surface's initial data load stays within budget for an interactive feel on the production deployment. | **LCP < 2.5 s** for the primary app surfaces (board, list, inbox). |

### PP-B — Actual latency budget

| ID | Requirement (MUST) | Target / acceptance |
|----|--------------------|---------------------|
| **PP-B1** | Where the application and database are separated by a network, they sit in the **same region** — no avoidable cross-region round-trip on a data request. | Same region; no cross-region RTT on any DB-bound request. (Trivially met when app and DB are colocated.) |
| **PP-B2** | Concurrent requests must not **exhaust database connections** or pay full connection-setup cost on every request. | No connection-exhaustion errors under expected concurrent load; connection reuse in place. |
| **PP-B3** | A single request must not issue an **N+1 or sequential query waterfall**; independent data is fetched **concurrently**. | Queries-per-request bounded and documented; independent reads issued concurrently, not one-after-another. |
| **PP-B4** | Refreshing a view after a mutation re-reads **only the data the change affects**, not everything on the page. | Refresh cost is bounded to the changed entities; a single-field change does not re-query the whole view. |
| **PP-B5** | **P95** write round-trip (gesture → confirmed server truth) stays within budget on the production deployment. | **P95 < 400 ms** warm. (Cold-start outliers acknowledged; see PP-F3.) |

### PP-F — Failure feedback & reconciliation

> A change that fails silently is indistinguishable from one that succeeded. On any deployment
> with a non-trivial failure rate (timeouts, dropped connections, contention, transient DB
> errors), the user **must** be told a write failed and be able to recover. A silent revert is
> **not** acceptable.

| ID | Requirement (MUST) | Target / acceptance |
|----|--------------------|---------------------|
| **PP-F1** | A **failed** mutation surfaces a **visible** error affordance (e.g. toast or inline) — it never fails silently. | User sees an explicit "couldn't save" message tied to the action that failed. |
| **PP-F2** | On failure, the view returns to the true (server) state **and** the user is offered a **retry** path. | Return-to-truth + actionable feedback (retry / dismiss); the change is never lost without acknowledgement. |
| **PP-F3** | A write that exceeds a **latency threshold** shows a "still saving…" affordance, so a slow save is not mistaken for a frozen UI. | In-progress affordance appears after **~1 s** if the write has not yet resolved. |
| **PP-F4** | The displayed state **always converges** to authoritative server truth; no permanent divergence between what is shown and the real data. | After any mutation settles (success or failure), on-screen state equals server state. |
| **PP-F5** | A **late or out-of-order** server response must not overwrite a **newer** local state. Once a more recent change to the same entity exists, the older in-flight response is reconciled away, never replayed onto the UI. | UI never visibly flips back to a superseded value; the state that survives reconciliation is the latest intent, not whichever response landed last. |

---

## 3. Non-goals (explicitly out of scope)

- **Real-time multi-client sync.** IndieWork is single-user; no presence, no live cross-device
  push. (See [scope.md](../../scope.md) §1.)
- **Cross-surface instant propagation.** Editing in one view is not required to *instantly*
  update another simultaneously-open view; a brief re-sync after the change is acceptable.
  Revisit only if cross-surface staleness becomes a *real* complaint — not pre-emptively (YAGNI).
- **Offline-first / local-write durability.** Out of scope; the DB is the single source of truth.

---

## 4. Verification

Each requirement is verifiable; the status tracker records the method per item.

- **PP-W / PP-R**: performance traces + Lighthouse against the production deployment; INP/LCP/CLS
  measured on the real surfaces. PP-W4: fire a rapid same-entity burst (repeated reorder) and
  assert persisted + displayed state equal the last intent.
- **PP-B**: query count per request, region check on the deployment, and a concurrency load test
  for connection exhaustion.
- **PP-F**: fault injection — force a write to fail / time out and observe the affordance. PP-F5:
  inject delayed / out-of-order responses and assert the UI never flips back to a superseded value.

---

## References

- [solution.md](solution.md) — the technical design, by mechanism (where implementation choices,
  incl. ADR 0002, are reasoned through — deliberately **not** here).
- [plan.md](plan.md) — living status tracker; maps each ID to its current state and links into
  the design.
- [deploy-vercel-supabase.md](../../../infra/deploy-vercel-supabase.md) — the worst-case latency
  envelope (managed DB across a network).
- [scope.md](../../scope.md) §1 — single-user product boundary.
