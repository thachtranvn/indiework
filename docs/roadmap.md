# IndieWork — Build Roadmap

> Living plan for building toward **[scope.md](scope.md)**. Updated as we progress. Scope.md = *what*; this = *in what order*.

## Now / Phase 1 — Foundation + core app loop

Backbone + the heart of the app, on the real design system.

- **Schema + migrations** — all of scope.md §2 as Drizzle/Postgres (uuid). `workspaces` table modeled now (+ nullable `projects.workspace_id`), seed one default workspace; `api_keys` and `labels`/`task_labels` tables created but unused this phase. Per-project `seq` via `project_counters` (atomic).
- **Service layer** (`src/server/services/*`) + **zod validators** (shared by all 3 frontends). Build a `projectService.create` + `taskService.create`(+seq) slice and verify against live Postgres before fanning out.
- **Auth** — `.ENV` password + signed cookie (web) + middleware; static `.ENV` `API_TOKEN` Bearer for REST/MCP (managed `api_keys` come in P4).
- **Design tokens** — port `design-handoff/prototype/tokens.css`; fonts via `next/font`.
- **Landing page** — real, polished, for indiework.space.
- **Login** — real (matches screenshot 01).
- **Core app loop** — three-zone dark-sidebar **shell** + grouped **task list** (grouping engine, quick-capture, sections) + slide-in **detail panel**, wired to real services.
- **Docker** — Dockerfile (standalone, migrate-on-boot) + compose (app + Postgres).

## Phase 2 — Remaining core screens

- **Board** (kanban + drag-to-change-status), **Overview** (project edit + milestones/modules management), **Inbox**, **All-projects** table.
- Multi-select + **bulk actions** on the task list; hover-reveal, inline-edit polish.

## Phase 3 — External access + ergonomics

- **REST** `/api/v1/*` adapters (thin over services).
- **MCP** `/mcp` server + tools.
- **⌘K global search/command palette**, full keyboard map.

## Phase 4 — Extensions

- **Managed `api_keys`** + the Settings/API-keys screen (replaces static `.ENV` token).
- **Workspace switcher UI** + multi-workspace flows.
- **Labels** (cross-cut), cycles/sprints, full-text search (tsvector), JSON export/import, **dark-mode toggle** (tokens already support it).

## Deferred-but-modeled (built table, UI later)

| Thing | Now | Becomes |
|---|---|---|
| Workspaces | table + seeded default; sidebar shows it | switcher + multi-workspace (P4) |
| API keys | static `.ENV` Bearer token | managed scoped keys + Settings UI (P4) |
| Labels | tables created, unused | label UI + filtering (P4) |
| Dark theme | tokens present | user toggle (P4) |
