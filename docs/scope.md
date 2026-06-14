# IndieWork — Product Scope (Source of Truth)

> The durable definition of **what IndieWork is** — the complete target product, including parts built much later. It reconciles two inputs:
> - **`brainstorm/pm-tool-spec.md`** (Vietnamese) — the **binding** architecture & data-model spec. Governs the backbone.
> - **`../design-handoff/`** — the high-fidelity UI design + coded prototype. Governs the UI and **additively extends** the data model.
>
> The design is a **superset** of the spec, not a competing authority. `brainstorm/schema.*.ts`, `index.ts`, `*.sql` are reference only.
> This document changes only when the *product definition* changes. For build sequencing, see **[roadmap.md](roadmap.md)**.

---

## 1. Product

IndieWork is a **single-user, self-hostable** project-management tool for a solo indie dev — "Asana, calm, for one person." No team surface (no assignee, mention, notification, permission, presence). Tasks belong to **projects**, grouped along two independent axes: **Module** (sub-system) ⟂ **Milestone** (phase). Signature interaction: click a task → a **detail panel slides in from the right** without leaving the list. Light-mode-first, fully token-driven (a dark theme swaps from variables alone).

**Three frontends, one service layer:** Web UI (Server Actions) · REST API (Route Handlers) · MCP server — all call one `src/server/services/*` layer. Adapters stay thin; business logic is never rewritten per surface.

---

## 2. Data model (Postgres, uuid PKs)

Public identity is always the ref `KEY-seq` (e.g. `DISK-14`); the internal uuid is never exposed. A task's `done` is **derived** (`status === 'done'`), not stored.

| Entity | Fields |
|---|---|
| **workspaces** | `id` · `name` · `emoji` · `tagline` · timestamps — top-level container above projects; multiple supported, switched from the sidebar. |
| **projects** | `id` · `workspace_id` FK · `key` (unique, `^[A-Z][A-Z0-9]{1,9}$`) · `name` · `emoji` · `color` · `status` (`active·planned·paused·done·backlog·cancelled`) · `pinned` bool · `tags` text[] · `short_desc` · `status_note` · `description` (md) · `archived_at` · timestamps |
| **project_counters** | `project_id` PK · `next_seq` — atomic per-project sequence allocation |
| **milestones** | `id` · `project_id` FK cascade · `name` · `description?` · `status` (`planned·active·done`) · `target_date` · `position` · timestamps |
| **modules** | `id` · `project_id` FK cascade · `name` · `color` · `position` · `archived_at` · timestamps |
| **tasks** | `id` · `project_id` (nullable = **Inbox**) · `module_id` (set null) · `milestone_id` (set null) · `seq` (null in Inbox) · `title` · `description` (md) · `status` · `priority` · `status_note` · `position` · `due_date` · `completed_at` · timestamps |
| **comments** | `id` · `task_id` FK cascade · `body` (md) · `source` (`web·api·mcp·agent`) · `created_at` — append-only timeline |
| **api_keys** | `id` · `name` · `prefix` · `hash` · `scope` (`read·write·read-write`) · `created_at` · `last_used_at` — named, scoped, copy-once, revocable |
| **labels** + **task_labels** | `labels(id·project_id?·name·color)` · `task_labels(task_id·label_id)` — free cross-cut when the module/milestone axes aren't enough |

### Enums (canonical — `brainstorm/shared.ts`)
- **task status** (7): `inbox · backlog · todo · in_progress · blocked · done · cancelled`
- **task priority** (5): `none · low · medium · high · urgent`
- **milestone status** (3): `planned · active · done`
- **project status** (6): `active · planned · paused · done · backlog · cancelled`
- **comment source** (4): `web · api · mcp · agent`
- **api key scope** (3): `read · write · read-write`
- Board columns = task-status subset: `backlog · todo · in_progress · blocked · done`

---

## 3. Screens / surfaces

| Surface | Notes |
|---|---|
| **Login** | One password → signed cookie. No signup/recovery/social. (screenshot 01) |
| **App shell** | Dark, resizable (180–440px, persisted) sidebar: workspace switcher · ⌘K search · Inbox+badge · projects grouped by lifecycle status (PINNED/IN PROGRESS/PLANNED/PAUSED/COMPLETED/BACKLOG) · new project. Main column + right detail overlay. Sidebar stays dark in both themes. |
| **Project · Issues** (task list) | Grouping engine: group-by **module \| milestone \| status \| priority** + optional sub-group + filters (status/priority/hide-done). Sections w/ progress bar + inline quick-add (inherits the section's group value). Task rows: circular checkbox, title, mono ref, **hover-reveal** priority bars/due/tag, blocked → warm status-note 2nd line, done → strikethrough. **Multi-select (shift-range) + bulk action bar.** |
| **Detail panel** | ref+copy+close (×/Esc/click-out) · inline title · **status note** (elevated, visually distinct from comments) · property popovers (status·priority·module·milestone·due) · description (md) · **activity timeline** (append-only, source badges) · delete (confirm). Slides in `.26s`. |
| **Project · Board** | Kanban by status subset; drag card between columns = change status; inline add per column. |
| **Project · Overview** | Project edit (short_desc·status·status_note·key·tags·description md) + **milestones management** (cards: date, state, progress, reorder) + **modules management** (name·color·reorder). |
| **Inbox** | Quick-capture ("Dump an idea"), uncategorized list, **assign-to-project** action. `INBOX-N` display ref (seq stays null until assigned). |
| **All projects** | Table of every project grouped by status. |
| **Global search (⌘K)** | Projects + tasks, arrow-key navigable, Enter to open. |
| **Settings** | General (workspace name/tagline/emoji) + **API keys** (create/scope/copy-once/revoke). |
| **Quick capture** | Always-present; `c` focuses it anywhere; zero required fields. The star interaction. |

**Keyboard:** `c` quick-capture · `⌘K`/`Ctrl-K` search · `Esc` close · arrows in search.
**Motion:** panel/modal slide `.26s` ease-out · content fade `.2s` · hover `.12s`; respect `prefers-reduced-motion`.

---

## 4. External access

- **REST** `/api/v1/*` — `POST/GET /tasks`, `GET/PATCH /tasks/:id`, `POST /tasks/:id/comments`, `GET /projects`, `GET /inbox`. `{ data, error }` envelope.
- **MCP** `/mcp` — streamable HTTP, tools 1:1 over services: `create_task · list_tasks · get_task(ref) · update_task · add_comment · set_status_note · list_projects · list_inbox`. Records `source = agent`/`mcp`.
- **Auth** — web: `.ENV` password + signed cookie. API/MCP: Bearer token (static `.ENV` token, or a managed `api_keys` row once those ship).

---

## 5. Reconciliation rules (durable)

- **Postgres + uuid PKs** (spec §2/§4) — overrides the brainstorm reference files' SQLite/integer design.
- **`done` is derived** — `status === 'done'` + `completed_at`; not a stored boolean. Checking the circle sets status→done & stamps `completed_at`; unchecking clears it (→ `todo`).
- **`comment.source` keeps 4 values** (incl. `mcp`); the design's UI may render `mcp` with the `agent` badge.
- **milestone** `date`/`state` (design) ≙ `target_date`/`status` (spec).
- **Inbox ref** `INBOX-N` is display-only; DB `seq` stays null until a task is assigned to a project.
- **Themes** — light default + dark (tokens ready); sidebar always dark regardless of theme.
- **Branding** — the design is repurposed from "Disk Advisor"; use IndieWork, drop that name and its sample data. Port `design-handoff/prototype/tokens.css` near-verbatim. Fonts Figtree + IBM Plex Mono via `next/font`.

---

## 6. Stack & deploy

Next.js 16 (App Router/RSC/Route Handlers) · React 19 · Tailwind 4 · Drizzle + PostgreSQL · `@modelcontextprotocol/sdk` (HTTP) · pnpm. Auth: `.ENV` password + signed cookie (web), Bearer token (REST/MCP). Deploy: Docker standalone + Postgres. License **MIT**. Domain **indiework.space** (public landing + app login).
