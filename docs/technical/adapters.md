# Delivery surfaces (adapters)

> Four ways into the same service layer. Every adapter does the same four things and
> nothing more: **authenticate → (rate-limit) → parse/shape input → call a service →
> format the response for its protocol.** No business logic lives here.

See [service-layer.md](service-layer.md) for what the services themselves do.

## At a glance

| Surface | Path | Auth | Rate-limit | Response shape | Used by |
|---|---|---|---|---|---|
| Server Actions | [src/app/_actions/](../../src/app/_actions) | `requireSession()` (cookie) | — | returns value / throws; `revalidatePath` | Web UI |
| REST API | [src/app/api/v1/](../../src/app/api/v1) | `requireBearer()` (API key) | `apiRateState` | `{ data, error }` envelope | External clients |
| MCP | [src/app/mcp/route.ts](../../src/app/mcp/route.ts) | `requireBearer()` (API key) | `apiRateState` | JSON-RPC 2.0 | AI agents |
| RSC pages | [src/app/app/](../../src/app/app) | `requireSession()` | — | rendered HTML / `notFound()` | Web UI (reads) |

---

## 1. Server Actions — the Web UI mutation path

`'use server'` functions in [_actions/](../../src/app/_actions). A client component calls one
directly; it runs on the server, guards the session, calls a service, and revalidates the
route so the server components re-render with fresh data.

**Shape** (from [_actions/tasks.ts](../../src/app/_actions/tasks.ts)):

```ts
export async function createTask(input: CreateTaskInput) {
  const userId = await requireSession();        // 1. auth gate
  const task = await taskService.create(input, userId); // 2. delegate
  revalidatePath('/app', 'layout');             // 3. re-flow server data
  return task;
}
```

**Files & responsibilities:**

| File | Actions (exported) |
|---|---|
| `tasks.ts` | `createTask` · `updateTask` · `toggleTaskDone` · `addSubtask` · `setTaskStatusNote` · `assignTaskToProject` · `deleteTask` · `reorderTasks` · `bulkUpdateTasks` · `bulkDeleteTasks` · `addTaskComment` · `editTaskComment` · `addAttachment` · `uploadAttachment` · `removeAttachment` |
| `projects.ts` | `createProject` · `updateProject` · `setProjectStatusNote` · `archiveProject` · `unarchiveProject` |
| `structure.ts` | modules: `createModule` · `updateModule` · `archiveModule` · `reorderModules` · milestones: `createMilestone` · `updateMilestone` · `setMilestoneStatus` · `deleteMilestone` · `reorderMilestones` |
| `workspace.ts` | `setActiveWorkspace` (sets workspace cookie) · `createWorkspace` · `updateWorkspace` |
| `apikeys.ts` | `createApiKey` · `revokeApiKey` |
| `queries.ts` | **read-only**: `getTaskDetail` · `getTaskDetailByRef` · `loadSearchIndex` |
| `auth.ts` | `login` (form action, rate-limited) · `logout` |

**Optimistic layer.** A subset of mutations is rendered optimistically on the client with
`useOptimistic` + `startTransition`, layered *over* these actions — the action's
`revalidatePath` is what reconciles the optimistic value back to server truth, and a thrown
action auto-reverts. The decision of which mutations get this treatment (and which
deliberately do not) is recorded in [ADR 0002](../adr/0002-optimistic-updates.md); the
end-to-end mechanics are in [flows.md](flows.md#3-optimistic-update-board-drag).

---

## 2. REST API — `/api/v1`

Route Handlers under [api/v1/](../../src/app/api/v1). For programmatic clients. Every handler
is `export const dynamic = 'force-dynamic'`, rate-limits, requires a bearer token, and wraps
the result in the shared envelope.

**Shape** (from [api/v1/tasks/route.ts](../../src/app/api/v1/tasks/route.ts)):

```ts
export async function POST(req: Request) {
  const rate = apiRateState(req);
  if (rate.limited) return tooManyRequests(rate.retryAfterSec);
  const userId = await requireBearer(req);
  if (!userId) return unauthorized();
  try {
    const task = await taskService.create(await req.json(), userId);
    return ok(task, 201);
  } catch (e) {
    return handleServiceError(e);
  }
}
```

**Endpoints:**

| Method · Path | Service call | Auth | Success |
|---|---|---|---|
| `GET /tasks` | `taskService.list(filters)` | `requireBearer` | `ok(data)` |
| `POST /tasks` | `taskService.create(body, userId)` | `requireBearer` | `ok(data, 201)` |
| `GET /tasks/:id` | `taskService.getById(id)` | `requireBearer` | `ok(data)` |
| `PATCH /tasks/:id` | `taskService.update(id, body)` | `requireBearer` | `ok(data)` |
| `POST /tasks/:id/comments` | `commentService.add(…, API source, userId)` | `requireBearer` | `ok(data, 201)` |
| `POST /tasks/:id/attachments` | `attachmentService.upload(…)` | `requireBearer` | `ok(data, 201)` |
| `GET /projects` | `projectService.list()` | `requireBearer` | `ok(data)` |
| `GET /inbox` | `taskService.listInbox()` | `requireBearer` | `ok(data)` |
| `GET /attachments/:id/download` | `attachmentService.open(id)` → streams bytes | `requireApiUser` | binary + headers |
| `DELETE /attachments/:id/download` | `attachmentService.remove(id)` | `requireBearer` | `ok(data)` |

> The download route uses `requireApiUser` (bearer **or** session cookie) so the web UI can
> fetch the file inline without a token; the rest of `/api/v1` is bearer-only.

**The envelope + error mapping** ([lib/api-response.ts](../../src/lib/api-response.ts)):

- Success → `{ data: T, error: null }` (HTTP 200/201).
- Failure → `{ data: null, error: string }`. `handleServiceError(e)` maps the cause:

| Cause | HTTP |
|---|---|
| `ZodError` | 400 (joined field messages) |
| `ServiceError` `not_found` | 404 |
| `ServiceError` `conflict` | 409 |
| `ServiceError` `unauthorized` | 401 |
| `ServiceError` `forbidden` | 403 |
| `ServiceError` `validation` / `bad_request` | 400 |
| `SyntaxError` (bad JSON body) | 400 |
| anything else | 500 (logged, message not leaked) |

Rate-limited requests short-circuit to `429` with a `Retry-After` header before auth runs.

---

## 3. MCP — `/mcp`

[mcp/route.ts](../../src/app/mcp/route.ts) implements **JSON-RPC 2.0 over HTTP POST**,
stateless (compatible with MCP "streamable HTTP" clients without SSE/session for simple tool
calls). The protocol (`initialize` / `tools/list` / `tools/call`) is implemented directly
rather than bridging the SDK's Node-stream transport into a Web route handler.

- **Auth:** `requireBearer` + `apiRateState` (same as REST).
- **Protocol version:** `2024-11-05`; server info `{ name: 'indiework', version: '0.1.0' }`.
- **Each tool is a thin wrapper** over a service method, returning a **slim** shape
  (trimmed fields) rather than the full row, so agent context stays small.
- **Errors:** `ZodError` / `ServiceError` are converted by `formatError()` into a one-line
  string returned as `{ content: [...], isError: true }` — the agent gets a readable reason,
  not a stack trace.
- **Comment attribution:** comments created here are stamped `source = mcp` (or `agent`),
  distinct from the `createdById` principal — see [data.md](data.md#identity--attribution).

**Tools (≈29), grouped by entity** — each maps to the service method of the same intent:

| Group | Tools |
|---|---|
| Tasks | `create_task` · `create_tasks` (bulk) · `add_subtask` · `list_tasks` · `get_task` · `update_task` · `update_tasks` (bulk) · `set_status_note` · `delete_task` |
| Inbox | `list_inbox` |
| Comments | `add_comment` · `list_comments` · `update_comment` · `delete_comment` |
| Projects | `list_projects` · `get_project` · `create_project` · `update_project` · `archive_project` |
| Milestones | `create_milestone` · `update_milestone` · `set_milestone_status` · `remove_milestone` · `reorder_milestones` |
| Modules | `create_module` · `update_module` · `archive_module` · `reorder_modules` |

> `get_task` composes `taskService.getByRef` + `listChildren`; `get_project` composes
> `projectService.getByKey` + `milestoneService.list` + `moduleService.list`. Bulk tools
> (`create_tasks` / `update_tasks`) return one result per item and never abort the batch on a
> single bad item.

For the rationale on bounding destructive operations (e.g. accidental project deletion) at
this surface, see [ADR 0001](../adr/0001-mcp-as-agent-surface.md).

---

## 4. RSC pages — the server-component read path

Pages under [app/app/](../../src/app/app) are React Server Components. They `requireSession()`,
read **directly** from services at render time (no action/API hop for reads), and throw a
`ServiceError` that Next maps to `notFound()` on a bad ref. They're `force-dynamic`.

| Page | Reads |
|---|---|
| `/app` | `projectService.list()` → redirect to first pinned/active project or `/inbox` |
| `/app/inbox` | `taskService.listInbox()` + `projectService.list()` |
| `/app/all` | tasks across the active workspace |
| `/app/p/[projectKey]` | project + its modules / milestones / tasks |
| `/app/p/[projectKey]/board` · `/overview` | board (status subset) · project edit + structure |
| `/app/issue/[ref]/…` · `/app/task/[ref]/…` | task detail (overlay vs standalone page) |
| `/app/settings` · `/settings/workspace` | API keys · workspace settings |

Mutations from these pages go back out through Server Actions (§1); reads that aren't part of
the initial render (e.g. the detail panel's `reload()`) call the read-only actions in
`queries.ts`.
