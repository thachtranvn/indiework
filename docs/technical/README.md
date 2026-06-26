# IndieWork — Technical Architecture

> **How IndieWork is built.** This is the structural counterpart to the product docs:
> [product/scope.md](../product/scope.md) says *what* the product is, the
> [ADRs](../adr/README.md) record *why* specific decisions were made, and this folder
> describes *how the code is organized* — the layers, the seams, and the request flows.
>
> Scope: the `main` branch (single-user, self-hostable). The team / multi-tenant work
> under [pivot/](../pivot/) is a separate, in-design track and is **not** described here,
> except where scaffolding for it already exists in `main` (RBAC, workspace membership).

## The one-sentence version

IndieWork is a **Next.js (App Router) monolith** in a **layered architecture**: several
thin **delivery surfaces** (Server Actions, REST, MCP, server components) all call **one
service layer** (`src/server/services/*`), which holds the business logic in a
**Transaction Script** style and talks to the database through **Drizzle** over a
**driver-agnostic seam** (Postgres in production, SQLite for the self-host / demo path).

## Layer map

```
┌──────────────────────────────────────────────────────────────────────────┐
│  DELIVERY / ADAPTERS                                  src/app/             │
│                                                                            │
│   Server Actions      REST  /api/v1     MCP  /mcp        RSC pages         │
│   _actions/*.ts       api/v1/**         mcp/route.ts     app/**/page.tsx   │
│   (web UI mutations)  (external client) (AI agent)       (server reads)    │
│        │                   │                 │                 │           │
│   requireSession      requireBearer     requireBearer     requireSession   │
│   + revalidatePath    + rate-limit      + rate-limit                       │
│        └───────────────────┴────────┬────────┴─────────────────┘           │
│                                      ▼  one call shape, never re-implemented│
├──────────────────────────────────────────────────────────────────────────┤
│  SERVICE LAYER                                        src/server/services/ │
│   taskService · projectService · milestoneService · moduleService ·        │
│   commentService · attachmentService · workspaceService · memberService ·  │
│   userService · apiKeyService     → business logic, returns DTOs/rows       │
│   dto.ts (boundary shapes) · errors.ts (typed ServiceError)                │
├──────────────────────────────────────────────────────────────────────────┤
│  VALIDATION  src/server/validators/*  (Zod schemas, parsed at the seam)    │
│  DOMAIN      src/lib/domain.ts        (pure primitives: refs, enums, ranks)│
├──────────────────────────────────────────────────────────────────────────┤
│  DATA ACCESS                                          src/server/db/       │
│   db/index.ts  → driver seam (Postgres | SQLite via DB_DRIVER)             │
│   schema.ts (canonical types) · schema.sqlite.ts · allocateSeq            │
├──────────────────────────────────────────────────────────────────────────┤
│  CROSS-CUTTING / INFRA                                                      │
│   auth/  (session · bearer · password · rate-limit · RBAC ctx)            │
│   storage/ (ObjectStorage: memory | R2)   env.ts (validated config)        │
└──────────────────────────────────────────────────────────────────────────┘
```

## Layer responsibilities

| Layer | Directory | Owns | Must **not** |
|---|---|---|---|
| Delivery / Adapters | [src/app/](../../src/app) | Auth gate, parse/shape I/O, format the response for its protocol | Contain business logic |
| Service layer | [src/server/services/](../../src/server/services) | Business logic, transactions, build DTOs, throw typed errors | Know about HTTP/JSON-RPC/cookies |
| Validation | [src/server/validators/](../../src/server/validators) | Zod schemas; the trust boundary for external input | — |
| Domain primitives | [src/lib/domain.ts](../../src/lib/domain.ts) | Pure functions + enums (`buildRef`, `parseRef`, status/priority) | Touch the DB |
| Data access | [src/server/db/](../../src/server/db) | Drizzle queries, driver selection, seq allocation | Hold business rules |
| Auth | [src/server/auth/](../../src/server/auth) | Sessions, bearer tokens, password hashing, RBAC, rate-limit | — |
| Storage | [src/server/storage/](../../src/server/storage) | Object storage abstraction (attachments) | — |
| Config | [src/server/env.ts](../../src/server/env.ts) | Validated env, fail-fast at boot | Leak to the client bundle |

## Architecture style — and why

**Layered + Service Layer, Transaction Script** (Fowler's *PoEAA* vocabulary). This is a
deliberate, pragmatic fit — not a default:

- **Three+ delivery surfaces, one service core.** Web UI, REST, and MCP each need the
  *same* operations. Putting the logic in a shared service layer (not in each handler) is
  exactly the situation a Service Layer exists for. With a single caller it would be
  needless indirection; with three it pays for itself. (See [ADR 0001](../adr/0001-mcp-as-agent-surface.md).)
- **Transaction Script, not a rich Domain Model.** Each service method is a linear script
  (validate → DB work → return). Most Task "logic" here is I/O-bound (atomic `seq`
  allocation, transactions), so a behavior-rich entity would buy little and add a
  hydrate/dehydrate layer. Pure rules live as functions in `lib/domain.ts` instead.
- **Drizzle directly, no formal Repository.** Services call Drizzle inline. The one real
  abstraction is the **driver seam** in `db/index.ts` (Postgres ⇄ SQLite), which earns its
  place by enabling the self-host / demo path on a single env var.
- **Single-user today, evolvable.** RBAC and workspace-membership scaffolding already
  exist (`auth/ctx.ts`, `memberService`) so the multi-tenant track can grow in without a
  rewrite. When pure business rules get dense, the migration path is: lift rules into
  `lib/domain.ts` → rich entities → module split — incrementally, not big-bang.

## The invariants that shape everything

These appear again and again across layers; learn them once:

1. **Public identity is the ref `KEY-seq`** (e.g. `DISK-14`). The internal `uuid` is never
   exposed. The ref is **derived** at the boundary (`buildRef(projectKey, seq)`), not stored.
2. **`done` is derived**, not a column — `status === 'done'`. Computed in `toTaskDto` and
   mirrored by the optimistic reducer.
3. **Inbox = a task with no project.** `project_id` null ⇒ `seq` null ⇒ `ref` null.
   Triage assigns a project and allocates the seq.
4. **Per-project sequence is atomic.** `project_counters.next_seq` is bumped inside a
   transaction (`allocateSeq`) so two concurrent creates never collide.
5. **Auth is resolved at the entry point, never from the request body.** Adapters produce a
   `userId` (and, for bearer, a workspace + role) before the service runs.
6. **Errors are typed in the service, mapped at the edge.** Services throw `ServiceError`
   with a `code`; each adapter maps that code to its protocol (HTTP status / JSON-RPC error).

## Read next

| Doc | What it covers |
|---|---|
| [adapters.md](adapters.md) | The four delivery surfaces in detail: auth, response shapes, the full endpoint/tool tables |
| [service-layer.md](service-layer.md) | Service method inventory, the DTO pattern, typed errors, validators, domain primitives |
| [data.md](data.md) | Drizzle dual-driver seam, the data model, identity/seq allocation, soft vs hard delete |
| [cross-cutting.md](cross-cutting.md) | Auth (sessions, bearer, password, RBAC), storage abstraction, config, multi-tenant scaffolding |
| [flows.md](flows.md) | End-to-end sequence diagrams: create, triage, optimistic update, attachments, login |
