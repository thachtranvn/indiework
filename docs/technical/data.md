# Data access & model

> Drizzle ORM over a **driver-agnostic seam**: Postgres in production, SQLite for the
> self-host / public-demo path. The service layer imports **one** `db` + `schema` and never
> a dialect directly. See [data model in scope.md §2](../product/scope.md) for the full
> field-level entity reference; this doc covers the *mechanics*.

## The driver seam — one env var, two backends

[db/index.ts](../../src/server/db/index.ts) selects the backend from `DB_DRIVER` (default
`postgres`) and exports a single `db` + `schema`. Switching to SQLite is `DB_DRIVER=sqlite` —
nothing in the service layer changes.

The interesting part is the **type seam**:

```
schema.ts (Postgres)  ──→  canonical TYPE module   (dto.ts infers row types from it)
schema.sqlite.ts      ──→  real runtime objects under SQLite
                            (correct dialect SQL + value mappers: Date→epoch, tags→json)
                            …cast to the Postgres types so every consumer sees ONE shape
```

- **`schema.ts` is the single source of types.** `TaskRow = typeof tasks.$inferSelect` and
  every DTO derive from the Postgres schema.
- Under SQLite the runtime exports the *real* SQLite tables (they carry the right SQL and
  value mappers) but **cast to the Postgres types**, so all consumers typecheck against one
  shape. The two dialect schemas are kept **structurally identical** to keep that cast honest.
- **Why libsql, not better-sqlite3:** the service layer uses async transaction callbacks
  (`await db.transaction(async (tx) => …)`), which the synchronous better-sqlite3 driver
  can't run — so SQLite goes through libsql.
- Driver handles are reused across dev hot-reloads (a `globalThis` cache) to avoid exhausting
  connections / re-opening the SQLite file on every reload.

Config that governs this lives in [env.ts](../../src/server/env.ts): `DB_DRIVER`,
`DATABASE_URL` (required when `postgres`), `SQLITE_PATH` (default `./data/iw.db`).

## Entities

Full field lists live in [scope.md §2](../product/scope.md). The shape, briefly:

```
workspaces ─┬─< projects ─┬─< milestones
            │             ├─< modules
            │             ├─< project_counters (1:1, next_seq)
            │             └─< tasks ─┬─< comments
            │                        └─< attachments
            │                        ├── task_labels >── labels
            └ (membership: users × workspaces × role)
```

- **tasks** carry `project_id` (nullable = **Inbox**), `module_id` / `milestone_id`
  (set-null on delete), `seq` (null in Inbox), `status`, `priority`, `position`,
  `due_date`, `completed_at`, and `created_by_id` (attribution).
- **comments** are an append-only timeline with a `source` channel (`web · api · mcp · agent`).
- **labels** + **task_labels** are the free cross-cut axis, independent of module/milestone.

Canonical enums live in `lib/domain.ts` and are referenced everywhere (DB column enums, Zod
validators, MCP schemas) — see [service-layer.md](service-layer.md#domain-primitives).

## Identity model — uuid inside, `KEY-seq` outside

Two identifiers, deliberately separated:

| | Internal | Public |
|---|---|---|
| Form | `uuid` primary key | ref `KEY-seq` (e.g. `DISK-14`) |
| Stored? | yes | **no** — derived from `project.key` + `task.seq` |
| Exposed? | never crosses the boundary | the only id callers see |

The ref is assembled by `buildRef(projectKey, seq)` at DTO-build time and parsed back by
`parseRef`. An Inbox task has `project_id = null ⇒ seq = null ⇒ ref = null`; the UI shows an
`INBOX-N` display ref until the task is assigned.

## Atomic per-project sequence

Each project's task numbers must be gapless-allocated without collisions under concurrency.
`project_counters` holds `next_seq` per project; `allocateSeq(tx, projectId)` bumps it **inside
a transaction** and returns the new value. Both task **create** (when a project is given) and
Inbox **triage** (`assignToProject`) allocate through it:

```ts
const id = await db.transaction(async (tx) => {
  const seq = await allocateSeq(tx, projectId);     // atomic bump
  const [row] = await tx.insert(schema.tasks)
    .values({ ...values, projectId, seq })
    .returning({ id: schema.tasks.id });
  return row.id;
});
```

This is the main reason most "Task business logic" is I/O-bound and stays in the service
layer rather than a pure entity (see the [architecture-style note](README.md#architecture-style--and-why)).

## Derived vs stored

- **`done` is never stored** — it's `status === 'done'`, computed in `toTaskDto` and mirrored
  by the optimistic reducer so the UI and the server agree.
- **`ref` is never stored** — derived as above.
- **open-issue count** on a project is computed on read (`withCounts`), not denormalized.

Keeping these derived avoids a class of drift bugs (a stored `done` going out of sync with
`status`), at the cost of a trivial computation on each read.

## Soft delete vs hard delete

| Operation | Kind | Where |
|---|---|---|
| `projectService.archive` / `unarchive` | **soft** (`archived_at`) | reversible |
| `moduleService.archive` | **soft** (`archived_at`) | reversible |
| `taskService.delete` | **hard** | irreversible |
| `milestoneService.remove` | **hard** | irreversible |
| `commentService.delete` | **hard** | append-only timeline edit |

The default for high-value containers (projects, modules) is reversible archival; only leaf /
low-risk records are hard-deleted. The MCP surface bounds the destructive ones deliberately —
see [ADR 0001](../adr/0001-mcp-as-agent-surface.md).

## Migrations

Schema changes are versioned Drizzle migrations; bootstrap + backfill (admin user, default
agent, back-compat token) run through an idempotent seed. Both dialect schemas must move
together to keep the type-seam cast honest.

> ⚠️ The migration `_journal.json` has been future-dated in places; a new migration whose
> `when` is below the current max will be **silently skipped** by `db:migrate`. When adding a
> migration, bump its `when` above the existing max. (Project gotcha — see also that
> `projects.workspace_id` is set-null, so deleting a workspace orphans its projects rather
> than cascading.)
