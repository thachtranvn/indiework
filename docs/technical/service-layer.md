# Service layer

> The core. All business logic lives in `src/server/services/*`. Every delivery surface
> ([adapters.md](adapters.md)) calls into here; logic is never re-implemented per surface.

Each service is a plain exported object of `async` methods — a **Transaction Script**:
validate input (Zod), do the DB work (sometimes in a transaction), return a DTO or row, and
throw a typed `ServiceError` on failure. Services depend on the DB seam and validators; they
know nothing about HTTP, cookies, or JSON-RPC.

## Method inventory

| Service | File | Methods |
|---|---|---|
| `taskService` | [task.service.ts](../../src/server/services/task.service.ts) | `create` · `update` · `toggleDone` · `addSubtask` · `assignToProject` · `setStatusNote` · `reorder` · `delete` · `getById` · `getByRef` · `listChildren` · `list` · `listInbox` |
| `projectService` | [project.service.ts](../../src/server/services/project.service.ts) | `list` (+ open-issue count) · `getByKey` · `getById` · `create` · `update` · `setStatusNote` · `archive` · `unarchive` |
| `milestoneService` | [milestone.service.ts](../../src/server/services/milestone.service.ts) | `list` · `create` · `update` · `setStatus` · `remove` · `reorder` |
| `moduleService` | [module.service.ts](../../src/server/services/module.service.ts) | `list` · `create` · `update` · `archive` · `reorder` |
| `commentService` | [comment.service.ts](../../src/server/services/comment.service.ts) | `list` · `add` · `update` · `delete` |
| `attachmentService` | [attachment.service.ts](../../src/server/services/attachment.service.ts) | `list` · `get` · `add` · `upload` · `open` · `remove` · `countsForProject` |
| `workspaceService` | [workspace.service.ts](../../src/server/services/workspace.service.ts) | `list` · `get` · `getDefault` · `create` · `update` |
| `memberService` | [member.service.ts](../../src/server/services/member.service.ts) | `roleOf` · `listForUser` · `ensureMembership` |
| `userService` | [user.service.ts](../../src/server/services/user.service.ts) | `getById` · `getByIds` · `getByEmail` · `verifyLogin` · `ensureAdmin` · `resetAdminPassword` · `ensureDefaultAgent` · `getDefaultAgentId` · `getFirstAdminId` · `backfillAttribution` |
| `apiKeyService` | [apikey.service.ts](../../src/server/services/apikey.service.ts) | `list` · `create` · `revoke` · `resolveUser` · `ensureLegacyToken` |

All are re-exported from the [services barrel](../../src/server/services/index.ts).

## The DTO pattern — applied only where it earns its place

A **DTO** (Data Transfer Object) is the flat shape a service returns *across the boundary*,
distinct from the DB row. This project does **not** mint a DTO per entity; it uses the lightest
transform each case needs. Four patterns coexist:

| Entity | Transform | Why |
|---|---|---|
| **Task** | named DTO `TaskDto`, separate file [dto.ts](../../src/server/services/dto.ts) | Derived fields (`ref`, `done`, `attachmentCount`) used across ~13 methods |
| **Project** | inline `T & { issues: number }` via `withCounts` | One derived field, one place — naming it would be overhead |
| **ApiKey** | `ApiKeyPublic` (an **omit**) | Must *hide* the secret `hash` from the boundary |
| **Comment / Module / Milestone / …** | raw Drizzle row | Nothing to derive |

`TaskDto` is the canonical example:

```ts
export type TaskDto = TaskRow & {
  ref: string | null;        // "DISK-3"; null while in Inbox (seq is null)
  done: boolean;             // derived: status === 'done'
  attachmentCount: number;   // 0 unless populated by list()
};

export function toTaskDto(row, projectKey, attachmentCount = 0): TaskDto { … }
```

`toTaskDto` is the **single place** the derivation rules live, so every method that returns a
task produces a consistent `ref`/`done` — no handler ever re-assembles `"DISK-3"` itself.

> Note the `Task = Row & {…}` form **exposes every column**. That's fine for tasks (no
> sensitive columns), but it's why `ApiKey` uses an *omit* instead — the boundary control is
> the whole point of the DTO there.

## Typed errors

[errors.ts](../../src/server/services/errors.ts) defines one error type with a `code`, plus
factory helpers. Services throw these; adapters map the `code` to their protocol (the HTTP
mapping table is in [adapters.md](adapters.md#the-envelope--error-mapping)).

```ts
type ServiceErrorCode = 'not_found' | 'conflict' | 'validation'
                      | 'bad_request' | 'unauthorized' | 'forbidden';

notFound('task')        // → 404
conflict('key in use')  // → 409
unauthorized()          // → 401   (not authenticated)
forbidden()             // → 403   (authenticated, not allowed)
```

This keeps services protocol-agnostic: a service says *what kind* of failure happened; each
edge decides *how to express it*.

## Validation — the trust boundary

[validators/](../../src/server/validators) holds Zod schemas; services call `schema.parse()`
at the top of write methods, so untrusted input is rejected before any DB work. Input types
are inferred from the schemas (`z.infer`), not hand-written.

| File | Schemas |
|---|---|
| `task.ts` | `createTaskSchema` · `updateTaskSchema` · `listTasksSchema` · `setStatusNoteSchema` |
| `project.ts` | `createProjectSchema` · `updateProjectSchema` · `setProjectStatusNoteSchema` |
| `milestone.ts` | `createMilestoneSchema` · `updateMilestoneSchema` · `reorderSchema` |
| `module.ts` | `createModuleSchema` · `updateModuleSchema` |
| `workspace.ts` | `createWorkspaceSchema` · `updateWorkspaceSchema` |
| `comment.ts` | `addCommentSchema` · `updateCommentSchema` · `deleteCommentSchema` |
| `attachment.ts` | `createAttachmentSchema` |

Enums in these schemas reference the canonical arrays in `lib/domain.ts` (e.g.
`z.enum(PROJECT_STATUS)`), so adding a status value updates the validators, the DB column
enum, and the MCP tool schema from **one** edit.

## Domain primitives — pure logic, no I/O

[src/lib/domain.ts](../../src/lib/domain.ts) is the "domain layer" expressed as **pure
functions and constants** — the natural home for rules that don't touch the DB:

- **Identity:** `buildRef(key, seq)` → `"DISK-3"`, `parseRef("DISK-3")` → `{ key, seq }`,
  `PROJECT_KEY_REGEX`, `isValidProjectKey`.
- **Enums + ordering:** `TASK_STATUS`, `TASK_PRIORITY`, `TASK_PRIORITY_RANK` (drives the
  list sort), `PROJECT_STATUS`, `MILESTONE_STATUS`, and their label maps.

Because these are pure, they're trivially testable and shared by services, adapters
(the MCP tool schemas import the enums), and the optimistic reducer alike. When Task business
rules grow dense enough to feel repetitive across service methods, this is where they should
consolidate first — before reaching for a rich entity class. See the architecture-style note
in the [overview](README.md#architecture-style--and-why).
